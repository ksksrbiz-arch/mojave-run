// MOJAVE RUN — multiplayer client (ghost overlay co-op).
// Connects via WebSocket to the same origin that served the page.
// Each peer broadcasts its position/score; everyone draws everyone else
// as a translucent ghost car on their own road. Gameplay stays single-player
// per client — this is cooperative side-by-side, not a shared simulation.
//
// Stability features:
//   * automatic reconnect with exponential backoff (capped)
//   * heartbeat ping/pong with latency measurement and dead-link detection
//   * latest-state coalescing so we never queue stale frames on a slow link
//   * themed status events the UI surfaces as desert-flavored toasts
//   * single re-join on reconnect: room/name/vehicle preserved across drops

(function () {
  const STATE_HZ = 15;            // ~15 state messages/sec (smoother peers)
  const PEER_TIMEOUT_MS = 6000;   // drop peers we haven't heard from in 6s
  const PING_INTERVAL_MS = 4000;  // heartbeat cadence
  const PING_TIMEOUT_MS = 12000;  // no pong within this -> consider link dead
  const RECONNECT_MIN_MS = 800;
  const RECONNECT_MAX_MS = 15000;
  const MAX_RECONNECTS = 20;      // give up after this many in a row

  const MP = {
    ws: null,
    connected: false,
    joining: false,
    id: null,
    room: null,
    name: 'DRIVER',
    vehicleId: 'rust',
    color: '#f5d76e',
    url: null,
    pingMs: null,                 // last round-trip latency (ms)
    peers: new Map(),             // id -> { name, color, vehicleId, s, prev, recvAt, lastSeen }
    listeners: { open: [], close: [], peers: [], event: [], status: [], latency: [] },
    _pendingState: null,
    _flushTimer: 0,
    _lastSent: 0,
    _pingTimer: 0,
    _lastPongAt: 0,
    _lastPingSentAt: 0,
    _awaitingPongSince: 0,
    _reconnectTimer: 0,
    _reconnectAttempts: 0,
    _wantConnected: false,        // user intent — only auto-reconnect when true
    _closingByUser: false,
  };

  function on(ev, fn) { (MP.listeners[ev] || (MP.listeners[ev] = [])).push(fn); }
  function emit(ev, ...args) {
    (MP.listeners[ev] || []).forEach(fn => { try { fn(...args); } catch (e) { console.error(e); } });
  }

  // Themed status messages — UI maps these to toasts/banners.
  function setStatus(code, detail) {
    emit('status', { code, detail: detail || '' });
  }

  function normalizeWsUrl(raw) {
    const value = String(raw == null ? '' : raw).trim();
    if (!value) return '';
    let candidate = value;
    if (/^https?:\/\//i.test(candidate)) {
      candidate = candidate.replace(/^http/i, 'ws');
    } else if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
      const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
      if (candidate.startsWith('/')) {
        candidate = `${proto}${location.host}${candidate}`;
      } else {
        candidate = `${proto}${candidate}`;
      }
    }
    try {
      const u = new URL(candidate, location.href);
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') return '';
      if (!u.pathname || u.pathname === '/') u.pathname = '/ws';
      return u.toString();
    } catch (_) {
      return '';
    }
  }

  function defaultUrl() {
    // Priority order:
    //   1. window.MP_DEFAULT_URL (lets a build/host inject it at runtime)
    //   2. <meta name="mp-server-url" content="…"> in index.html
    //   3. same origin as the page (works when server.js serves the site)
    const fromWindow = (typeof window.MP_DEFAULT_URL === 'string' && window.MP_DEFAULT_URL.trim()) || '';
    const metaEl = document.querySelector('meta[name="mp-server-url"]');
    const fromMeta = (metaEl && metaEl.content && metaEl.content.trim()) || '';
    const configured = fromWindow || fromMeta;
    const normalized = normalizeWsUrl(configured);
    if (normalized) return normalized;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  function clearTimers() {
    if (MP._pingTimer) { clearInterval(MP._pingTimer); MP._pingTimer = 0; }
    if (MP._flushTimer) { clearInterval(MP._flushTimer); MP._flushTimer = 0; }
    if (MP._reconnectTimer) { clearTimeout(MP._reconnectTimer); MP._reconnectTimer = 0; }
  }

  function scheduleReconnect() {
    if (!MP._wantConnected) return;
    if (MP._reconnectAttempts >= MAX_RECONNECTS) {
      setStatus('giveup', 'SIGNAL LOST — RADIO SILENT');
      return;
    }
    const n = MP._reconnectAttempts++;
    const wait = Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * Math.pow(1.7, n))
      + Math.random() * 400;
    setStatus('reconnecting', `REPATCHING THE WIRE… (${Math.ceil(wait/1000)}s)`);
    MP._reconnectTimer = setTimeout(() => openSocket(), wait);
  }

  function openSocket() {
    let ws;
    try { ws = new WebSocket(MP.url); }
    catch (e) {
      setStatus('error', 'BAD FREQUENCY — CHECK SERVER ADDRESS');
      MP.joining = false;
      scheduleReconnect();
      return;
    }
    // Replace the active socket. A stale socket whose handlers fire later
    // will be ignored by the isCurrent() guard below — without it, a fast
    // rejoin or auto-reconnect could let an old onclose tear down the new
    // connection (peers cleared, timers killed, status flipped to dropped).
    MP.ws = ws;
    MP.joining = true;
    const isCurrent = () => MP.ws === ws;

    ws.onopen = () => {
      if (!isCurrent()) return;
      MP._reconnectAttempts = 0;
      MP._lastPongAt = performance.now();
      MP._awaitingPongSince = 0;
      try {
        ws.send(JSON.stringify({
          type: 'join',
          room: MP.room,
          name: MP.name,
          color: MP.color,
          vehicleId: MP.vehicleId,
        }));
      } catch (_) { /* close handler will retry */ }
    };

    ws.onmessage = (evt) => {
      if (!isCurrent()) return;
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case 'joined':
          MP.id = msg.id;
          MP.connected = true;
          MP.joining = false;
          MP.peers.clear();
          (msg.peers || []).forEach(p => MP.peers.set(p.id, {
            name: p.name, color: p.color, vehicleId: p.vehicleId,
            s: p.state || null, prev: null, recvAt: performance.now(),
            lastSeen: performance.now(),
          }));
          startHeartbeat();
          startFlusher();
          setStatus('joined', `LINKED UP IN ${MP.room}`);
          emit('open');
          emit('peers');
          break;
        case 'peer-join':
          MP.peers.set(msg.id, {
            name: msg.name, color: msg.color, vehicleId: msg.vehicleId,
            s: null, prev: null, recvAt: performance.now(), lastSeen: performance.now(),
          });
          setStatus('peer-join', `${(msg.name || 'DRIVER').toUpperCase()} ROLLED IN`);
          emit('peers');
          break;
        case 'peer-leave': {
          const p = MP.peers.get(msg.id);
          MP.peers.delete(msg.id);
          if (p) setStatus('peer-leave', `${(p.name || 'DRIVER').toUpperCase()} PEELED OFF`);
          emit('peers');
          break;
        }
        case 'peer-state': {
          const p = MP.peers.get(msg.id); if (!p) return;
          // keep previous sample for interpolation
          p.prev = p.s ? { s: p.s, t: p.recvAt } : null;
          p.s = msg.s;
          p.recvAt = performance.now();
          p.lastSeen = p.recvAt;
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
        case 'pong': {
          const now = performance.now();
          MP._lastPongAt = now;
          MP._awaitingPongSince = 0;
          if (typeof msg.t === 'number') {
            MP.pingMs = Math.max(0, Math.round(now - msg.t));
            emit('latency', MP.pingMs);
          }
          break;
        }
        case 'kicked':
          setStatus('kicked', msg.reason ? String(msg.reason).toUpperCase() : 'BOOTED FROM ROOM');
          MP._wantConnected = false;
          try { ws.close(); } catch (_) {}
          break;
      }
    };

    ws.onclose = (evt) => {
      // If a newer socket has already taken over, this is a stale close
      // event for the previous attempt — drop it on the floor so it can't
      // tear down the live connection.
      if (!isCurrent()) return;
      const wasConnected = MP.connected;
      MP.connected = false;
      MP.joining = false;
      MP.peers.clear();
      clearTimers();
      emit('peers');
      if (MP._closingByUser) {
        MP._closingByUser = false;
        setStatus('disconnected', 'OFF THE GRID');
        emit('close');
        return;
      }
      if (wasConnected) {
        setStatus('dropped', 'SIGNAL LOST IN A DUST STORM');
      } else if (!MP._reconnectAttempts) {
        setStatus('error', 'COULD NOT REACH SERVER');
      }
      emit('close');
      scheduleReconnect();
    };

    ws.onerror = () => { /* close fires next */ };
  }

  function startHeartbeat() {
    if (MP._pingTimer) clearInterval(MP._pingTimer);
    MP._pingTimer = setInterval(() => {
      if (!MP.ws || MP.ws.readyState !== 1) return;
      const now = performance.now();
      // dead-link guard: once a ping is outstanding, require a pong in time.
      if (MP._awaitingPongSince && now - MP._awaitingPongSince > PING_TIMEOUT_MS) {
        try { MP.ws.close(); } catch (_) {}
        return;
      }
      if (MP._awaitingPongSince) return;
      MP._lastPingSentAt = now;
      MP._awaitingPongSince = now;
      try { MP.ws.send(JSON.stringify({ type: 'ping', t: now })); } catch (_) {}
    }, PING_INTERVAL_MS);
  }

  // Coalesce state: we always send the latest snapshot at most STATE_HZ.
  function startFlusher() {
    if (MP._flushTimer) clearInterval(MP._flushTimer);
    MP._flushTimer = setInterval(() => {
      if (!MP._pendingState) return;
      if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
      const now = performance.now();
      if (now - MP._lastSent < 1000 / STATE_HZ) return;
      MP._lastSent = now;
      try { MP.ws.send(JSON.stringify({ type: 'state', s: MP._pendingState })); } catch (_) {}
      MP._pendingState = null;
    }, Math.floor(1000 / STATE_HZ / 2));
  }

  function connect({ url, room, name, vehicleId, color }) {
    disconnect(/*silent*/ true);
    // disconnect() set _closingByUser to suppress the disconnect toast on the
    // *previous* socket; we must clear it now so that a failure on the brand
    // new connection isn't mistaken for a user-initiated close (which would
    // skip auto-reconnect and surface a misleading "OFF THE GRID" toast).
    MP._closingByUser = false;
    MP.peers.clear();
    MP.room = (room || 'LOBBY').toUpperCase().slice(0, 12);
    MP.name = (name || 'DRIVER').slice(0, 14);
    MP.vehicleId = vehicleId || 'rust';
    if (color) MP.color = color;
    MP.url = normalizeWsUrl(url || '') || defaultUrl();
    MP._wantConnected = true;
    MP._reconnectAttempts = 0;
    setStatus('connecting', `RAISING THE ANTENNA…`);
    openSocket();
  }

  function disconnect(silent) {
    MP._wantConnected = false;
    // Only flag user-close when there's actually a live socket whose onclose
    // will consume the flag. Otherwise the flag would leak forward and make
    // the next failed connection look user-initiated.
    const hadSocket = !!MP.ws && MP.ws.readyState !== 3;
    MP._closingByUser = hadSocket;
    clearTimers();
    if (MP.ws) {
      try { MP.ws.close(); } catch (_) {}
    }
    MP.ws = null;
    MP.connected = false;
    MP.joining = false;
    MP.peers.clear();
    MP.pingMs = null;
    MP._awaitingPongSince = 0;
    MP._pendingState = null;
    // When there's no live socket the close handler won't fire, so we have
    // to emit the disconnected status ourselves. With a live socket the
    // onclose path handles it (and the _closingByUser flag suppresses a
    // duplicate "dropped" toast).
    if (!silent && !hadSocket) setStatus('disconnected', 'OFF THE GRID');
  }

  function sendState(s) {
    // Always store latest; flusher decides when to actually transmit.
    MP._pendingState = s;
  }

  function sendEvent(ev) {
    if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
    try { MP.ws.send(JSON.stringify({ type: 'event', ev })); } catch (_) {}
  }

  function sendMeta(meta) {
    if (meta.name) MP.name = String(meta.name).slice(0, 14);
    if (meta.vehicleId) MP.vehicleId = String(meta.vehicleId).slice(0, 16);
    if (meta.color) MP.color = String(meta.color).slice(0, 16);
    if (!MP.connected || !MP.ws || MP.ws.readyState !== 1) return;
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

  // Tab-visibility hook: when the tab returns to foreground, kick a ping
  // immediately so the heartbeat doesn't sit stale for the full interval.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && MP.ws && MP.ws.readyState === 1) {
      MP._lastPongAt = performance.now();
      if (!MP._awaitingPongSince) {
        const now = performance.now();
        MP._lastPingSentAt = now;
        MP._awaitingPongSince = now;
        try { MP.ws.send(JSON.stringify({ type: 'ping', t: now })); } catch (_) {}
      }
    }
  });

  // Network-online event: speed up reconnect when the OS regains connectivity.
  window.addEventListener('online', () => {
    if (MP._wantConnected && !MP.connected && MP._reconnectTimer) {
      clearTimeout(MP._reconnectTimer);
      MP._reconnectTimer = 0;
      setStatus('reconnecting', 'NETWORK BACK — REDIALING');
      openSocket();
    }
  });

  // expose
  window.MP = Object.assign(MP, {
    connect, disconnect, sendState, sendEvent, sendMeta, on, defaultUrl, pruneStale,
  });
})();
