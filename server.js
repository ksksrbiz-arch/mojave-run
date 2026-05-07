// MOJAVE RUN — multiplayer relay + static file server
// Run: `node server.js` (optional `PORT=8787 node server.js`)
// Friends connect to http://<your-ip>:8787 on LAN, or expose to internet via
// `cloudflared tunnel --url http://localhost:8787` and share the public URL.
//
// Single dependency: `ws`. Install with `npm install` once.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');

const PORT = parseInt(process.env.PORT, 10) || 8787;
const ROOT = __dirname;

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

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
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

const wss = new WebSocketServer({ server, path: '/ws' });

// rooms: Map<roomCode, Map<peerId, { ws, name, color, vehicleId, state }>>
const rooms = new Map();
let nextId = 1;

function broadcast(room, msg, exceptId) {
  const peers = rooms.get(room);
  if (!peers) return;
  const data = JSON.stringify(msg);
  for (const [id, p] of peers) {
    if (id === exceptId) continue;
    if (p.ws.readyState === 1) p.ws.send(data);
  }
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  const peer = { id: String(nextId++), room: null, name: 'DRIVER', color: '#f5d76e', vehicleId: 'rust', state: null };
  ws.peer = peer;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'join') {
      const room = String(msg.room || 'lobby').toUpperCase().slice(0, 12);
      peer.room = room;
      peer.name = String(msg.name || 'DRIVER').slice(0, 14);
      peer.color = String(msg.color || '#f5d76e').slice(0, 16);
      peer.vehicleId = String(msg.vehicleId || 'rust').slice(0, 16);
      if (!rooms.has(room)) rooms.set(room, new Map());
      const roomMap = rooms.get(room);
      roomMap.set(peer.id, { ws, name: peer.name, color: peer.color, vehicleId: peer.vehicleId, state: null });
      // tell new peer about existing peers
      const existing = [];
      for (const [id, p] of roomMap) {
        if (id === peer.id) continue;
        existing.push({ id, name: p.name, color: p.color, vehicleId: p.vehicleId, state: p.state });
      }
      send(ws, { type: 'joined', id: peer.id, room, peers: existing });
      // tell others
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
      // small one-shot events (death, level start, chat)
      const ev = msg.ev || {};
      broadcast(peer.room, { type: 'peer-event', id: peer.id, ev }, peer.id);
    } else if (msg.type === 'meta') {
      // vehicle change, name change
      if (msg.name) me.name = peer.name = String(msg.name).slice(0, 14);
      if (msg.color) me.color = peer.color = String(msg.color).slice(0, 16);
      if (msg.vehicleId) me.vehicleId = peer.vehicleId = String(msg.vehicleId).slice(0, 16);
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

  ws.on('error', () => { /* ignore — close handler cleans up */ });
});

server.listen(PORT, () => {
  console.log(`MOJAVE RUN server on http://localhost:${PORT}`);
  console.log(`LAN:  share http://<your-lan-ip>:${PORT}`);
  console.log(`WAN:  cloudflared tunnel --url http://localhost:${PORT}`);
});
