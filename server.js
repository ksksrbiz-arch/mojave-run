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
      return;
    }

    if (!peer.room) return;
    const roomMap = rooms.get(peer.room);
    if (!roomMap) return;
    const me = roomMap.get(peer.id);
    if (!me) return;

    if (msg.type === 'state') {
      // trust client-reported state; this is co-op cosmetic, not authoritative
      me.state = msg.s || null;
      broadcast(peer.room, { type: 'peer-state', id: peer.id, s: me.state }, peer.id);
    } else if (msg.type === 'event') {
      const ev = msg.ev || {};
      broadcast(peer.room, { type: 'peer-event', id: peer.id, ev }, peer.id);
    } else if (msg.type === 'meta') {
      if (msg.name) me.name = peer.name = safeStr(msg.name, 14);
      if (msg.color) me.color = peer.color = safeStr(msg.color, 16);
      if (msg.vehicleId) me.vehicleId = peer.vehicleId = safeStr(msg.vehicleId, 16);
      broadcast(peer.room, { type: 'peer-meta', id: peer.id, name: me.name, color: me.color, vehicleId: me.vehicleId }, peer.id);
    }
  });

  ws.on('close', () => {
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
