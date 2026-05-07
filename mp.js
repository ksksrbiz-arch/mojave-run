// MOJAVE RUN — multiplayer client (ghost overlay co-op).
// Connects via WebSocket to the same origin that served the page.
// Each peer broadcasts its position/score; everyone draws everyone else
// as a translucent ghost car on their own road. Gameplay stays single-player
// per client — this is cooperative side-by-side, not a shared simulation.

(function () {
  const STATE_HZ = 12;          // ~12 state messages/sec
  const PEER_TIMEOUT_MS = 6000; // drop peers we haven't heard from in 6s

  const MP = {
    ws: null,
    connected: false,
    joining: false,
    id: null,
    room: null,
    name: 'DRIVER',
    vehicleId: 'rust',
    peers: new Map(), // id -> { name, color, vehicleId, s, lastSeen }
    listeners: { open: [], close: [], peers: [], event: [] },
    _sendTimer: 0,
    _lastSent: 0,
  };

  function on(ev, fn) { (MP.listeners[ev] || (MP.listeners[ev] = [])).push(fn); }
  function emit(ev, ...args) { (MP.listeners[ev] || []).forEach(fn => { try { fn(...args); } catch (e) { console.error(e); } }); }

  function defaultUrl() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  function connect({ url, room, name, vehicleId }) {
    if (MP.ws) try { MP.ws.close(); } catch (_) {}
    MP.peers.clear();
    MP.connected = false;
    MP.joining = true;
    MP.room = (room || 'LOBBY').toUpperCase().slice(0, 12);
    MP.name = (name || 'DRIVER').slice(0, 14);
    MP.vehicleId = vehicleId || 'rust';
    const wsUrl = url || defaultUrl();
    let ws;
    try { ws = new WebSocket(wsUrl); }
    catch (e) { MP.joining = false; emit('close', String(e)); return; }
    MP.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join', room: MP.room, name: MP.name, vehicleId: MP.vehicleId,
      }));
    };
    ws.onmessage = (evt) => {
      let msg; try { msg = JSON.parse(evt.data); } catch { return; }
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case 'joined':
          MP.id = msg.id;
          MP.connected = true;
          MP.joining = false;
          MP.peers.clear();
          (msg.peers || []).forEach(p => MP.peers.set(p.id, {
            name: p.name, color: p.color, vehicleId: p.vehicleId, s: p.state || null, lastSeen: performance.now(),
          }));
          emit('open');
          emit('peers');
          break;
        case 'peer-join':
          MP.peers.set(msg.id, { name: msg.name, color: msg.color, vehicleId: msg.vehicleId, s: null, lastSeen: performance.now() });
          emit('peers');
          break;
        case 'peer-leave':
          MP.peers.delete(msg.id);
          emit('peers');
          break;
        case 'peer-state': {
          const p = MP.peers.get(msg.id); if (!p) return;
          p.s = msg.s; p.lastSeen = performance.now();
          break;
        }
        case 'peer-meta': {
          const p = MP.peers.get(msg.id); if (!p) return;
          if (msg.name) p.name = msg.name;
          if (msg.color) p.color = msg.color;
          if (msg.vehicleId) p.vehicleId = msg.vehicleId;
          emit('peers');
          break;
        }
        case 'peer-event':
          emit('event', msg.id, msg.ev);
          break;
      }
    };
    ws.onclose = () => {
      MP.connected = false;
      MP.joining = false;
      MP.peers.clear();
      emit('close');
      emit('peers');
    };
    ws.onerror = () => { /* close fires next */ };
  }

  function disconnect() {
    if (MP.ws) try { MP.ws.close(); } catch (_) {}
    MP.ws = null;
    MP.connected = false;
    MP.peers.clear();
  }

  function sendState(s) {
    if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
    const now = performance.now();
    if (now - MP._lastSent < 1000 / STATE_HZ) return;
    MP._lastSent = now;
    try { MP.ws.send(JSON.stringify({ type: 'state', s })); } catch (_) {}
  }

  function sendEvent(ev) {
    if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
    try { MP.ws.send(JSON.stringify({ type: 'event', ev })); } catch (_) {}
  }

  function sendMeta(meta) {
    if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
    if (meta.name) MP.name = meta.name;
    if (meta.vehicleId) MP.vehicleId = meta.vehicleId;
    try { MP.ws.send(JSON.stringify({ type: 'meta', ...meta })); } catch (_) {}
  }

  function pruneStale() {
    const now = performance.now();
    let removed = false;
    for (const [id, p] of MP.peers) {
      if (now - p.lastSeen > PEER_TIMEOUT_MS) { MP.peers.delete(id); removed = true; }
    }
    if (removed) emit('peers');
  }

  // expose
  window.MP = Object.assign(MP, { connect, disconnect, sendState, sendEvent, sendMeta, on, defaultUrl, pruneStale });
})();
