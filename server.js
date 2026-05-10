// MOJAVE RUN — multiplayer relay + static file server
// Run: `node server.js` (optional `PORT=8787 node server.js`)
// Deployed on Render at https://mojave-run-lw3g.onrender.com as the
// multiplayer back-end for the Netlify-hosted frontend.
//
// Single dependency: `ws`. Install with `npm install` once.
//
// Hardening:
//   * heartbeat ping/pong (drops zombie sockets)
//   * per-connection message rate limit + payload size cap
//   * room peer cap (prevents one room flooding the relay)
//   * graceful SIGINT/SIGTERM shutdown
//   * permissive CORS so the static site can be served separately from the WS
//
// Endpoints:
//   GET  /healthz                  — health check
//   GET  /api/scores?mode=…        — top-10 scoreboard for a mode
//   POST /api/scores               — submit a run score
//   POST /api/accounts/register    — create a cloud account, returns { id, token }
//   POST /api/accounts/save        — save profile data { id, token, data }
//   GET  /api/accounts/load?id=&token= — restore profile data
//   POST /api/push/register        — register a push notification token
//   POST /api/iap/validate          — validate an in-app purchase receipt

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT, 10) || 8787;
const ROOT = __dirname;

// Tunables (env-overridable so ops can adjust without code changes).
const MAX_PAYLOAD_BYTES = parseInt(process.env.MP_MAX_PAYLOAD, 10) || 4096;
const MAX_MSGS_PER_SEC = parseInt(process.env.MP_MAX_MPS, 10) || 60;
const ROOM_PEER_CAP = parseInt(process.env.MP_ROOM_CAP, 10) || 16;
const HEARTBEAT_MS = parseInt(process.env.MP_HEARTBEAT_MS, 10) || 15000;
const SCORES_FILE = path.join(ROOT, 'scores.json');
const MAX_SCORES_PER_MODE = 50;
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const MAX_ACCOUNTS = 50000;
const MAX_PROFILE_BYTES = 65536; // 64 KB per cloud save

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

// ============================================================
// GLOBAL SCOREBOARD — in-memory, persisted to scores.json
// ============================================================
let scoreboards = {}; // mode -> [{ name, score, mode, kills, distance, vehicle, ts }]
let scoresSavePending = false;

function loadScores() {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const raw = fs.readFileSync(SCORES_FILE, 'utf8');
      scoreboards = JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn('[scores] failed to load scores.json:', e.message);
    scoreboards = {};
  }
}

function saveScores() {
  if (scoresSavePending) return;
  scoresSavePending = true;
  setTimeout(() => {
    scoresSavePending = false;
    try {
      fs.writeFileSync(SCORES_FILE, JSON.stringify(scoreboards, null, 2));
    } catch (e) {
      console.warn('[scores] failed to write scores.json:', e.message);
    }
  }, 2000); // debounce: batch writes within 2 seconds
}

function addScore(entry) {
  const mode = String(entry.mode || 'classic').slice(0, 24);
  if (!scoreboards[mode]) scoreboards[mode] = [];
  const board = scoreboards[mode];
  // sanitize
  const row = {
    name: String(entry.name || 'DRIVER').slice(0, 14).toUpperCase(),
    score: Math.max(0, Math.floor(Number(entry.score) || 0)),
    mode,
    kills: Math.max(0, Math.floor(Number(entry.kills) || 0)),
    distance: Math.max(0, Math.floor(Number(entry.distance) || 0)),
    vehicle: String(entry.vehicle || '').slice(0, 16),
    ts: Date.now(),
  };
  if (row.score <= 0) return; // ignore zero scores
  board.push(row);
  // keep top N by score
  board.sort((a, b) => b.score - a.score);
  if (board.length > MAX_SCORES_PER_MODE) board.splice(MAX_SCORES_PER_MODE);
  saveScores();
}

loadScores();

// ============================================================
// ACCOUNTS — cloud save/restore for driver profiles
// ============================================================
let accounts = {}; // id -> { token, savedAt, data }
let accountsSavePending = false;

// Cryptographically random cloud code component (rejection sampling avoids modulo bias).
function genCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars — power of 2, no bias
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += chars[bytes[i] & 31]; // 32 = 2^5, mask is exact
  return s;
}

// Constant-time string equality to guard against timing attacks.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bA = Buffer.from(a);
  const bB = Buffer.from(b);
  if (bA.length !== bB.length) return false;
  return crypto.timingSafeEqual(bA, bB);
}

// Parse and normalise an account credential from a raw string value.
function parseCredential(raw, len) {
  return String(raw == null ? '' : raw).slice(0, len).toUpperCase();
}

function loadAccounts() {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')) || {};
    }
  } catch (e) {
    console.warn('[accounts] failed to load accounts.json:', e.message);
    accounts = {};
  }
}

function saveAccountsDebounced() {
  if (accountsSavePending) return;
  accountsSavePending = true;
  setTimeout(() => {
    accountsSavePending = false;
    try {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts));
    } catch (e) {
      console.warn('[accounts] failed to write accounts.json:', e.message);
    }
  }, 2000);
}

// Simple in-memory rate limiter for the register endpoint.
const registerRateMap = new Map(); // ip -> { count, windowStart }
const REGISTER_WINDOW_MS = 60000;
const REGISTER_MAX_PER_WINDOW = 10;

function isRegisterRateLimited(ip) {
  const now = Date.now();
  const entry = registerRateMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > REGISTER_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  registerRateMap.set(ip, entry);
  return entry.count > REGISTER_MAX_PER_WINDOW;
}

loadAccounts();

const server = http.createServer((req, res) => {
  // Permissive CORS — read-only static assets.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Tiny health endpoint — useful for status pages and uptime monitors.
  if (req.url === '/healthz') {
    let totalPeers = 0;
    for (const m of rooms.values()) totalPeers += m.size;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, peers: totalPeers, uptime: process.uptime() }));
    return;
  }

  // ---- Scoreboard API ----
  const urlParsed = (req.url || '/').split('?');
  const urlPathApi = urlParsed[0];

  if (urlPathApi === '/api/scores' && req.method === 'GET') {
    const qs = new URLSearchParams(urlParsed[1] || '');
    const mode = (qs.get('mode') || 'classic').slice(0, 24);
    const board = (scoreboards[mode] || []).slice(0, 10);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, mode, scores: board }));
    return;
  }

  if (urlPathApi === '/api/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      if (body.length + chunk.length > 2048) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        addScore(entry);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'bad request' }));
      }
    });
    req.on('error', () => {});
    return;
  }

  // ---- Accounts API ----
  if (urlPathApi === '/api/accounts/register' && req.method === 'POST') {
    const clientIp = req.socket.remoteAddress || '';
    if (isRegisterRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'too many registrations' }));
      return;
    }
    if (Object.keys(accounts).length >= MAX_ACCOUNTS) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'server full' }));
      return;
    }
    const id    = genCode(6);
    const token = genCode(6);
    accounts[id] = { token, savedAt: Date.now(), data: null };
    saveAccountsDebounced();
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, id, token }));
    return;
  }

  if (urlPathApi === '/api/accounts/save' && req.method === 'POST') {
    let body = '';
    let tooBig = false;
    req.on('data', chunk => {
      if (tooBig) return;
      if (body.length + chunk.length > MAX_PROFILE_BYTES) {
        tooBig = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'payload too large' }));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (tooBig) return;
      try {
        const { id, token, data } = JSON.parse(body);
        if (!id || !token || !data) throw new Error('missing fields');
        const normId    = parseCredential(id, 6);
        const normToken = parseCredential(token, 6);
        const acc = accounts[normId];
        if (!acc || !safeEqual(acc.token, normToken)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid credentials' }));
          return;
        }
        acc.data = data;
        acc.savedAt = Date.now();
        saveAccountsDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'bad request' }));
      }
    });
    req.on('error', () => {});
    return;
  }

  if (urlPathApi === '/api/accounts/load' && req.method === 'GET') {
    const qs       = new URLSearchParams(urlParsed[1] || '');
    const normId   = parseCredential(qs.get('id'), 6);
    const normTok  = parseCredential(qs.get('token'), 6);
    const acc      = accounts[normId];
    if (!acc || !safeEqual(acc.token, normTok)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'invalid credentials' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, data: acc.data }));
    return;
  }

  // ---- Push Token Registration ----
  if (urlPathApi === '/api/push/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      if (body.length + chunk.length > 2048) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { id, token, pushToken, platform } = JSON.parse(body);
        if (!id || !token || !pushToken) throw new Error('missing fields');
        const normId    = parseCredential(id, 6);
        const normToken = parseCredential(token, 6);
        const acc = accounts[normId];
        if (!acc || !safeEqual(acc.token, normToken)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid credentials' }));
          return;
        }
        // Store push token on the account
        acc.pushToken = String(pushToken).slice(0, 512);
        acc.pushPlatform = String(platform || 'unknown').slice(0, 16);
        acc.pushRegisteredAt = Date.now();
        saveAccountsDebounced();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'bad request' }));
      }
    });
    req.on('error', () => {});
    return;
  }

  // ---- IAP Receipt Validation (stub — real validation uses Apple/Google server APIs) ----
  if (urlPathApi === '/api/iap/validate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      if (body.length + chunk.length > 8192) { req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { productId, transactionId, receipt, platform } = JSON.parse(body);
        if (!productId || !transactionId) throw new Error('missing fields');
        // TODO: Integrate Apple App Store / Google Play server-side receipt validation.
        // For now, log the transaction and accept — production must verify receipts
        // against the real store APIs before granting entitlements.
        console.log('[iap] validate:', { productId, transactionId, platform, ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, productId, transactionId }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'bad request' }));
      }
    });
    req.on('error', () => {});
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';
  // prevent path traversal
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: MAX_PAYLOAD_BYTES,
  perMessageDeflate: false, // small frequent JSON — compression hurts more than helps
});

// rooms: Map<roomCode, Map<peerId, { ws, name, color, vehicleId, state }>>
const rooms = new Map();
let nextId = 1;

function broadcast(room, msg, exceptId) {
  const peers = rooms.get(room);
  if (!peers) return;
  const data = JSON.stringify(msg);
  for (const [id, p] of peers) {
    if (id === exceptId) continue;
    if (p.ws.readyState === 1) {
      try { p.ws.send(data); } catch (_) { /* socket may be closing */ }
    }
  }
}

function send(ws, msg) {
  if (ws.readyState !== 1) return;
  try { ws.send(JSON.stringify(msg)); } catch (_) {}
}

function safeStr(v, max) {
  return String(v == null ? '' : v).slice(0, max);
}

wss.on('connection', (ws, req) => {
  const peer = {
    id: String(nextId++),
    room: null,
    name: 'DRIVER',
    color: '#f5d76e',
    vehicleId: 'rust',
    state: null,
    msgWindowStart: Date.now(),
    msgsInWindow: 0,
  };
  ws.peer = peer;
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    // rate limit
    const now = Date.now();
    if (now - peer.msgWindowStart > 1000) {
      peer.msgWindowStart = now;
      peer.msgsInWindow = 0;
    }
    if (++peer.msgsInWindow > MAX_MSGS_PER_SEC) {
      send(ws, { type: 'kicked', reason: 'TOO MUCH CHATTER' });
      try { ws.close(1008, 'rate-limit'); } catch (_) {}
      return;
    }

    if (raw.length > MAX_PAYLOAD_BYTES) {
      // ws library already enforces maxPayload; this is a defense-in-depth check.
      try { ws.close(1009, 'payload-too-big'); } catch (_) {}
      return;
    }

    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'ping') {
      // echo timestamp so the client can compute RTT
      send(ws, { type: 'pong', t: msg.t });
      return;
    }

    // === VERSUS MODE MESSAGES ===
    if (msg.type === 'vs-join') {
      const room = safeStr(msg.room || 'VS-LOBBY', 12).toUpperCase();
      peer.name = safeStr(msg.name || 'DRIVER', 14);
      let lobby = vsLobbies.get(room);
      if (!lobby) {
        lobby = { slot0: { ws, peer }, slot1: null };
        vsLobbies.set(room, lobby);
        send(ws, { type: 'vs-waiting', slot: 0, room });
      } else if (!lobby.slot1 && lobby.slot0.ws !== ws) {
        // Prevent same peer from joining if they're already in another versus lobby
        let alreadyInLobby = false;
        for (const [, lb] of vsLobbies) {
          if ((lb.slot0 && lb.slot0.ws === ws) || (lb.slot1 && lb.slot1.ws === ws)) {
            alreadyInLobby = true; break;
          }
        }
        if (alreadyInLobby) {
          send(ws, { type: 'vs-full', room });
        } else {
          lobby.slot1 = { ws, peer };
          send(ws, { type: 'vs-waiting', slot: 1, room });
          // Both players present — start the match
          vsCreateMatch(lobby, room);
          vsLobbies.delete(room);
        }
      } else {
        send(ws, { type: 'vs-full', room });
      }
      return;
    }
    if (msg.type === 'vs-input') {
      const matchId = ws._vsMatchId;
      if (matchId == null) return;
      const match = vsMatches.get(matchId);
      if (!match) return;
      const slot = ws._vsSlot;
      if (slot == null || !match.players[slot]) return;
      const inp = msg.input;
      if (inp && typeof inp === 'object') {
        match.players[slot].input.l = !!inp.l;
        match.players[slot].input.r = !!inp.r;
        match.players[slot].input.f = !!inp.f;
      }
      return;
    }

    if (msg.type === 'join') {
      const room = safeStr(msg.room || 'lobby', 12).toUpperCase();
      // enforce room capacity before mutating state
      const existingRoom = rooms.get(room);
      if (existingRoom && existingRoom.size >= ROOM_PEER_CAP && !existingRoom.has(peer.id)) {
        send(ws, { type: 'kicked', reason: 'ROOM FULL' });
        try { ws.close(1013, 'room-full'); } catch (_) {}
        return;
      }
      // if rejoining (same socket sending join twice) clean up old entry
      if (peer.room && peer.room !== room) {
        const old = rooms.get(peer.room);
        if (old) {
          old.delete(peer.id);
          broadcast(peer.room, { type: 'peer-leave', id: peer.id });
          if (old.size === 0) rooms.delete(peer.room);
        }
      }
      peer.room = room;
      peer.name = safeStr(msg.name || 'DRIVER', 14);
      peer.color = safeStr(msg.color || '#f5d76e', 16);
      peer.vehicleId = safeStr(msg.vehicleId || 'rust', 16);
      if (!rooms.has(room)) rooms.set(room, new Map());
      const roomMap = rooms.get(room);
      roomMap.set(peer.id, { ws, name: peer.name, color: peer.color, vehicleId: peer.vehicleId, state: null });
      const existing = [];
      for (const [id, p] of roomMap) {
        if (id === peer.id) continue;
        existing.push({ id, name: p.name, color: p.color, vehicleId: p.vehicleId, state: p.state });
      }
      send(ws, { type: 'joined', id: peer.id, room, peers: existing });
      broadcast(room, { type: 'peer-join', id: peer.id, name: peer.name, color: peer.color, vehicleId: peer.vehicleId }, peer.id);
      // v2 clients can subscribe to player-join while older clients keep peer-join.
      broadcast(room, { type: 'player-join', id: peer.id, name: peer.name, color: peer.color, vehicleId: peer.vehicleId }, peer.id);
      return;
    }

    if (!peer.room) return;
    const roomMap = rooms.get(peer.room);
    if (!roomMap) return;
    const me = roomMap.get(peer.id);
    if (!me) return;

    if (msg.type === 'state' || msg.type === 'player-state') {
      // trust client-reported state; this is lightweight shared co-op, not authoritative
      me.state = msg.s || null;
      broadcast(peer.room, { type: 'peer-state', id: peer.id, s: me.state }, peer.id);
      // v2 clients can subscribe to player-state while older ghost clients keep peer-state.
      broadcast(peer.room, { type: 'player-state', id: peer.id, s: me.state }, peer.id);
    } else if (msg.type === 'event' || msg.type === 'shared-event') {
      const ev = msg.ev || msg.event || {};
      const outType = msg.type === 'shared-event' ? 'shared-event' : 'peer-event';
      broadcast(peer.room, { type: outType, id: peer.id, ev }, peer.id);
    } else if (msg.type === 'revive') {
      broadcast(peer.room, { type: 'revive', id: peer.id, target: safeStr(msg.target || '', 32) }, peer.id);
    } else if (msg.type === 'meta') {
      if (msg.name) me.name = peer.name = safeStr(msg.name, 14);
      if (msg.color) me.color = peer.color = safeStr(msg.color, 16);
      if (msg.vehicleId) me.vehicleId = peer.vehicleId = safeStr(msg.vehicleId, 16);
      broadcast(peer.room, { type: 'peer-meta', id: peer.id, name: me.name, color: me.color, vehicleId: me.vehicleId }, peer.id);
    }
  });

  ws.on('close', () => {
    vsHandleDisconnect(ws);
    vsHandleLobbyDisconnect(ws);
    if (!peer.room) return;
    const roomMap = rooms.get(peer.room);
    if (!roomMap) return;
    roomMap.delete(peer.id);
    broadcast(peer.room, { type: 'peer-leave', id: peer.id });
    if (roomMap.size === 0) rooms.delete(peer.room);
  });

  ws.on('error', (e) => {
    // ws library will fire 'close' next; just log so ops can see patterns.
    console.warn('[ws] peer error', peer.id, e && e.message);
  });
});

// ============================================================
// VERSUS MODE — authoritative shared-simulation server
// ============================================================
// Two players join a versus lobby; the server runs a deterministic
// simulation at a fixed tick rate and sends authoritative state to
// both clients.  Clients send only their input (left/right/fire);
// the server owns physics, spawning, collisions, and scoring.
//
// Protocol:
//   Client → Server:
//     { type:'vs-join',  room }        – enter versus lobby (reuses room code)
//     { type:'vs-input', input:{l,r,f} } – per-frame input
//     { type:'vs-ready' }              – player is ready to start
//   Server → Client:
//     { type:'vs-waiting', slot, room } – assigned slot, waiting for opponent
//     { type:'vs-countdown', t }       – countdown before match starts
//     { type:'vs-state', tick, p, e, b, road } – authoritative frame
//     { type:'vs-hit', slot, hp }      – damage feedback
//     { type:'vs-kill', slot, score, kills } – kill feedback
//     { type:'vs-end', winner, scores } – match over

const VS_TICK_RATE = 30; // server ticks per second
const VS_TICK_MS = Math.round(1000 / VS_TICK_RATE);
const VS_COUNTDOWN_SECS = 3;
const VS_ROAD_W = 400; // virtual road width
const VS_ROAD_H = 800; // virtual road height
const VS_PLAYER_W = 42;
const VS_PLAYER_H = 64;
const VS_MAX_HP = 100;
const VS_MATCH_DURATION = 60; // seconds
const VS_ENEMY_INTERVAL_MIN = 0.6;
const VS_ENEMY_INTERVAL_MAX = 1.4;
const VS_BULLET_SPEED = -600;
const VS_FIRE_COOLDOWN = 0.18;
const VS_PLAYER_ACCEL = 2400;
const VS_PLAYER_MAX_V = 480;
const VS_PLAYER_DRAG = 6.5;
const VS_ROAD_SPEED_BASE = 280;
const VS_ENEMY_HP = 2;
const VS_ENEMY_SCORE = 100;
const VS_ENEMY_W = 36;
const VS_ENEMY_H = 48;

// Active versus matches: matchId -> match
const vsMatches = new Map();
// Lobby queue: room -> { slot0: { ws, peer }, slot1: ... }
const vsLobbies = new Map();
let vsNextMatchId = 1;

function vsClamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function vsSend(ws, msg) {
  if (ws && ws.readyState === 1) {
    try { ws.send(JSON.stringify(msg)); } catch (_) {}
  }
}

function vsCreateMatch(lobby, room) {
  const id = vsNextMatchId++;
  const match = {
    id,
    room,
    state: 'countdown', // countdown | playing | ended
    countdownT: VS_COUNTDOWN_SECS,
    tick: 0,
    t: 0,
    duration: VS_MATCH_DURATION,
    roadSpeed: VS_ROAD_SPEED_BASE,
    players: [
      {
        ws: lobby.slot0.ws, peer: lobby.slot0.peer, name: lobby.slot0.peer.name,
        x: VS_ROAD_W * 0.35, y: VS_ROAD_H - 110, vx: 0,
        hp: VS_MAX_HP, score: 0, kills: 0, fireCd: 0,
        input: { l: false, r: false, f: false },
      },
      {
        ws: lobby.slot1.ws, peer: lobby.slot1.peer, name: lobby.slot1.peer.name,
        x: VS_ROAD_W * 0.65, y: VS_ROAD_H - 110, vx: 0,
        hp: VS_MAX_HP, score: 0, kills: 0, fireCd: 0,
        input: { l: false, r: false, f: false },
      },
    ],
    enemies: [],
    bullets: [], // { x, y, vx, vy, owner(0|1), dmg }
    spawnTimer: 1.0,
    nextEnemyId: 1,
  };
  // Tag each player ws with the match id so input messages route correctly
  match.players[0].ws._vsMatchId = id;
  match.players[0].ws._vsSlot = 0;
  match.players[1].ws._vsMatchId = id;
  match.players[1].ws._vsSlot = 1;
  vsMatches.set(id, match);
  // Notify both players
  vsSend(match.players[0].ws, { type: 'vs-countdown', t: VS_COUNTDOWN_SECS, slot: 0, opponent: match.players[1].name });
  vsSend(match.players[1].ws, { type: 'vs-countdown', t: VS_COUNTDOWN_SECS, slot: 1, opponent: match.players[0].name });
  return match;
}

function vsSpawnEnemy(match) {
  const lane = Math.random() < 0.5 ? 0 : 1;
  const laneCenter = lane === 0 ? VS_ROAD_W * 0.35 : VS_ROAD_W * 0.65;
  const ex = laneCenter + (Math.random() - 0.5) * (VS_ROAD_W * 0.2);
  match.enemies.push({
    id: match.nextEnemyId++,
    x: ex, y: -VS_ENEMY_H,
    vx: (Math.random() - 0.5) * 60,
    vy: 80 + Math.random() * 60,
    w: VS_ENEMY_W, h: VS_ENEMY_H,
    hp: VS_ENEMY_HP,
    lane,
  });
}

function vsAABB(a, aw, ah, b, bw, bh) {
  return Math.abs(a.x - b.x) < (aw + bw) / 2 && Math.abs(a.y - b.y) < (ah + bh) / 2;
}

function vsTickMatch(match, dt) {
  if (match.state === 'countdown') {
    match.countdownT -= dt;
    if (match.countdownT <= 0) {
      match.state = 'playing';
      match.countdownT = 0;
      for (const p of match.players) {
        vsSend(p.ws, { type: 'vs-start' });
      }
    }
    return;
  }
  if (match.state !== 'playing') return;

  match.tick++;
  match.t += dt;

  // Check time limit
  if (match.t >= match.duration) {
    vsEndMatch(match);
    return;
  }

  // Update players
  for (let i = 0; i < 2; i++) {
    const p = match.players[i];
    const inp = p.input;
    // Steering
    if (inp.l) p.vx -= VS_PLAYER_ACCEL * dt;
    if (inp.r) p.vx += VS_PLAYER_ACCEL * dt;
    if (!inp.l && !inp.r) p.vx -= p.vx * Math.min(1, VS_PLAYER_DRAG * dt);
    p.vx = vsClamp(p.vx, -VS_PLAYER_MAX_V, VS_PLAYER_MAX_V);
    p.x += p.vx * dt;
    // Lane boundaries: each player gets half the road
    const laneX0 = i === 0 ? 0 : VS_ROAD_W * 0.5;
    const laneX1 = i === 0 ? VS_ROAD_W * 0.5 : VS_ROAD_W;
    const margin = VS_PLAYER_W / 2 + 4;
    if (p.x < laneX0 + margin) { p.x = laneX0 + margin; p.vx *= -0.4; }
    if (p.x > laneX1 - margin) { p.x = laneX1 - margin; p.vx *= -0.4; }
    p.y = VS_ROAD_H - 110;
    // Firing
    p.fireCd -= dt;
    if (inp.f && p.fireCd <= 0 && p.hp > 0) {
      p.fireCd = VS_FIRE_COOLDOWN;
      match.bullets.push({
        x: p.x, y: p.y - VS_PLAYER_H / 2 - 4,
        vx: 0, vy: VS_BULLET_SPEED,
        owner: i, dmg: 1,
      });
    }
  }

  // Update bullets
  for (let i = match.bullets.length - 1; i >= 0; i--) {
    const b = match.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -30 || b.y > VS_ROAD_H + 30 || b.x < -30 || b.x > VS_ROAD_W + 30) {
      match.bullets.splice(i, 1);
    }
  }

  // Spawn enemies
  match.spawnTimer -= dt;
  if (match.spawnTimer <= 0) {
    vsSpawnEnemy(match);
    match.spawnTimer = VS_ENEMY_INTERVAL_MIN + Math.random() * (VS_ENEMY_INTERVAL_MAX - VS_ENEMY_INTERVAL_MIN);
    // Difficulty ramp: spawn faster over time
    const ramp = Math.min(0.4, match.t / match.duration * 0.4);
    match.spawnTimer *= (1 - ramp);
  }

  // Update enemies
  for (let i = match.enemies.length - 1; i >= 0; i--) {
    const e = match.enemies[i];
    e.x += e.vx * dt;
    e.y += (e.vy + match.roadSpeed * 0.15) * dt;
    // Remove off-screen
    if (e.y > VS_ROAD_H + 60) {
      match.enemies.splice(i, 1);
      continue;
    }
    // Bullet-enemy collisions
    for (let j = match.bullets.length - 1; j >= 0; j--) {
      const b = match.bullets[j];
      if (vsAABB(e, e.w, e.h, b, 6, 10)) {
        e.hp -= b.dmg;
        match.bullets.splice(j, 1);
        if (e.hp <= 0) {
          const killer = b.owner;
          match.players[killer].score += VS_ENEMY_SCORE;
          match.players[killer].kills++;
          match.enemies.splice(i, 1);
          for (const p of match.players) {
            vsSend(p.ws, { type: 'vs-kill', slot: killer, score: match.players[killer].score, kills: match.players[killer].kills });
          }
          break;
        }
      }
    }
    // Enemy-player collision
    if (match.enemies[i]) {
      for (let pi = 0; pi < 2; pi++) {
        const p = match.players[pi];
        if (p.hp <= 0) continue;
        if (vsAABB(e, e.w, e.h, p, VS_PLAYER_W, VS_PLAYER_H)) {
          p.hp -= 15;
          if (p.hp < 0) p.hp = 0;
          match.enemies.splice(i, 1);
          for (const pl of match.players) {
            vsSend(pl.ws, { type: 'vs-hit', slot: pi, hp: p.hp });
          }
          // If a player dies, opponent wins
          if (p.hp <= 0) {
            vsEndMatch(match);
            return;
          }
          break;
        }
      }
    }
  }

  // Send authoritative state to both clients (compressed)
  const stateMsg = {
    type: 'vs-state',
    tick: match.tick,
    t: Math.round(match.t * 10) / 10,
    dur: match.duration,
    p: match.players.map(p => ({
      x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.vx),
      hp: p.hp, score: p.score, kills: p.kills,
    })),
    e: match.enemies.map(e => ({
      id: e.id, x: Math.round(e.x), y: Math.round(e.y),
      w: e.w, h: e.h,
    })),
    b: match.bullets.map(b => ({
      x: Math.round(b.x), y: Math.round(b.y), o: b.owner,
    })),
  };
  const stateStr = JSON.stringify(stateMsg);
  for (const p of match.players) {
    if (p.ws && p.ws.readyState === 1) {
      try { p.ws.send(stateStr); } catch (_) {}
    }
  }
}

function vsEndMatch(match) {
  if (match.state === 'ended') return;
  match.state = 'ended';
  // Determine winner: player with most score wins; tie-break by HP
  const p0 = match.players[0], p1 = match.players[1];
  let winner = -1; // -1 = draw
  if (p0.hp <= 0 && p1.hp > 0) winner = 1;
  else if (p1.hp <= 0 && p0.hp > 0) winner = 0;
  else if (p0.score > p1.score) winner = 0;
  else if (p1.score > p0.score) winner = 1;
  else if (p0.hp > p1.hp) winner = 0;
  else if (p1.hp > p0.hp) winner = 1;

  const endMsg = {
    type: 'vs-end',
    winner,
    scores: [
      { name: p0.name, score: p0.score, kills: p0.kills, hp: p0.hp },
      { name: p1.name, score: p1.score, kills: p1.kills, hp: p1.hp },
    ],
  };
  for (const p of match.players) {
    vsSend(p.ws, endMsg);
    if (p.ws) {
      delete p.ws._vsMatchId;
      delete p.ws._vsSlot;
    }
  }
  vsMatches.delete(match.id);
}

function vsHandleDisconnect(ws) {
  const matchId = ws._vsMatchId;
  if (matchId == null) return;
  const match = vsMatches.get(matchId);
  if (!match) return;
  // If one player disconnects, end the match — other player wins
  const slot = ws._vsSlot;
  const otherSlot = slot === 0 ? 1 : 0;
  // Force the disconnector's HP to 0
  match.players[slot].hp = 0;
  vsEndMatch(match);
}

function vsHandleLobbyDisconnect(ws) {
  for (const [room, lobby] of vsLobbies) {
    if (lobby.slot0 && lobby.slot0.ws === ws) {
      vsLobbies.delete(room);
      return;
    }
    if (lobby.slot1 && lobby.slot1.ws === ws) {
      // Revert to waiting state for slot0
      lobby.slot1 = null;
      return;
    }
  }
}

// Versus tick loop — runs all active matches at fixed rate
const vsTickLoop = setInterval(() => {
  const dt = VS_TICK_MS / 1000;
  for (const [id, match] of vsMatches) {
    try { vsTickMatch(match, dt); } catch (e) { console.error('[vs] tick error', id, e); }
  }
}, VS_TICK_MS);

// Heartbeat sweep — terminate sockets that didn't pong since last sweep.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      try { ws.terminate(); } catch (_) {}
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch (_) {}
  }
}, HEARTBEAT_MS);

wss.on('close', () => clearInterval(heartbeat));

function shutdown(signal) {
  console.log(`[server] ${signal} — closing`);
  clearInterval(heartbeat);
  clearInterval(vsTickLoop);
  for (const ws of wss.clients) {
    try { ws.close(1001, 'server-shutdown'); } catch (_) {}
  }
  wss.close(() => {
    server.close(() => process.exit(0));
  });
  // hard exit if something hangs
  setTimeout(() => process.exit(0), 4000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (e) => { console.error('[server] uncaught', e); });
process.on('unhandledRejection', (e) => { console.error('[server] unhandledRejection', e); });

server.listen(PORT, () => {
  console.log(`MOJAVE RUN server on http://localhost:${PORT}`);
  console.log(`LAN:  share http://<your-lan-ip>:${PORT}`);
  console.log(`WAN:  cloudflared tunnel --url http://localhost:${PORT}`);
  console.log(`health: http://localhost:${PORT}/healthz`);
});
