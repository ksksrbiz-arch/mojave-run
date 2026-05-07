/* MOJAVE RUN — full game
 * v2.0: profiles, garage, upgrades, modes, gauntlet, bosses
 */
(() => {
'use strict';

// ============================================================
// FEATURE DETECT
// ============================================================
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const IS_MOBILE = IS_TOUCH && Math.min(window.innerWidth, window.innerHeight) < 900;

// ============================================================
// DATA — VEHICLES, UPGRADES, MODES, LEVELS
// ============================================================
const VEHICLES = [
  {
    id: 'rustbucket', name: 'RUST BUCKET',
    desc: 'Balanced veteran of the wastes. Honest steel.',
    cost: 0,
    base: { maxHp: 100, accel: 1800, maxV: 460, fireRate: 0.18, dmg: 1, guns: 2, bigShot: false },
    color: { body:'#a86a2e', hood:'#8a4f1f', cab:'#3a2410', windshield:'#a8d8e8', glow:'#ffe07a' },
  },
  {
    id: 'junker', name: 'JUNKER',
    desc: 'Slow. Heavy. Dependable. Eats hits.',
    cost: 500,
    base: { maxHp: 160, accel: 1400, maxV: 380, fireRate: 0.22, dmg: 1, guns: 2, bigShot: false },
    color: { body:'#5a5040', hood:'#48402c', cab:'#2a2418', windshield:'#7a8898', glow:'#ffd070' },
  },
  {
    id: 'roadrunner', name: 'ROADRUNNER',
    desc: 'Twitch-fast skirmisher. Don\'t trade hits.',
    cost: 1200,
    base: { maxHp: 70, accel: 2400, maxV: 580, fireRate: 0.14, dmg: 1, guns: 2, bigShot: false },
    color: { body:'#c08a3a', hood:'#a0712a', cab:'#5a3818', windshield:'#a8d8e8', glow:'#ffe07a' },
  },
  {
    id: 'goliath', name: 'GOLIATH',
    desc: 'Heavy autocannon. Slow but devastating.',
    cost: 2500,
    base: { maxHp: 200, accel: 1200, maxV: 360, fireRate: 0.32, dmg: 3, guns: 1, bigShot: true },
    color: { body:'#404048', hood:'#30303a', cab:'#1a1a22', windshield:'#5a7a8a', glow:'#ff8c40' },
  },
  {
    id: 'phantom', name: 'PHANTOM',
    desc: 'Quad-gun glass cannon. High risk.',
    cost: 4500,
    base: { maxHp: 60, accel: 2000, maxV: 520, fireRate: 0.10, dmg: 1, guns: 4, bigShot: false },
    color: { body:'#2a3a5a', hood:'#1a2a48', cab:'#0a1a32', windshield:'#7ad0ff', glow:'#80f0ff' },
  },
];
const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]));

const UPGRADE_TRACKS = [
  {
    id: 'engine', name: 'ENGINE',
    desc: 'Faster acceleration & top speed',
    apply: (st, tier) => {
      const m = [1, 1.10, 1.20, 1.32, 1.45, 1.60][tier];
      st.accel *= m; st.maxV *= m;
    },
    tiers: [100, 250, 500, 1000, 2000],
  },
  {
    id: 'plating', name: 'PLATING',
    desc: 'Reinforced hull. More HP.',
    apply: (st, tier) => {
      const m = [1, 1.15, 1.30, 1.50, 1.75, 2.00][tier];
      st.maxHp *= m;
    },
    tiers: [100, 250, 500, 1000, 2000],
  },
  {
    id: 'weapons', name: 'WEAPONS',
    desc: 'Faster firing rate',
    apply: (st, tier) => {
      const m = [1, 0.92, 0.85, 0.78, 0.70, 0.60][tier];
      st.fireRate *= m;
    },
    tiers: [150, 300, 600, 1200, 2400],
  },
];

const MODES = [
  { id: 'classic',    name: 'CLASSIC',     desc: 'Endless run. Survive as long as you can. Difficulty climbs forever.' },
  { id: 'gauntlet',   name: 'GAUNTLET',    desc: '12 tiered sectors. Clear objectives. Bosses every 4 levels.' },
  { id: 'timeattack', name: 'TIME ATTACK', desc: '60 seconds. Frenzy spawns. Highest score wins.' },
];

// 12 gauntlet levels. obj: 'survive' (seconds), 'kills' (count), 'distance' (meters), 'boss' (boss tier)
const LEVELS = [
  { num:1,  name:'OUTSKIRTS',       obj:'survive',  target:30,   reward:75,   diff:1.0 },
  { num:2,  name:'BROKEN HIGHWAY',  obj:'kills',    target:8,    reward:100,  diff:1.1 },
  { num:3,  name:'DUST FIELDS',     obj:'distance', target:1500, reward:125,  diff:1.2 },
  { num:4,  name:'ALPHA RAIDER',    obj:'boss',     target:1,    reward:300,  diff:1.4, boss:1 },
  { num:5,  name:'SCORCHED FLATS',  obj:'survive',  target:45,   reward:175,  diff:1.5 },
  { num:6,  name:'CANYON RUN',      obj:'kills',    target:14,   reward:225,  diff:1.7 },
  { num:7,  name:'THE BONEYARD',    obj:'distance', target:2500, reward:275,  diff:1.9 },
  { num:8,  name:'TWIN DEMONS',     obj:'boss',     target:1,    reward:500,  diff:2.1, boss:2 },
  { num:9,  name:'NIGHT WATCH',     obj:'survive',  target:60,   reward:325,  diff:2.3, night:true },
  { num:10, name:'STORM FRONT',     obj:'kills',    target:22,   reward:425,  diff:2.6, storm:true },
  { num:11, name:'DEAD ZONE',       obj:'distance', target:3500, reward:550,  diff:3.0, night:true, storm:true },
  { num:12, name:'THE OVERLORD',    obj:'boss',     target:1,    reward:1500, diff:3.5, boss:3, night:true },
];

// ============================================================
// PROFILE STORE
// ============================================================
const STORAGE_KEY = 'mojaveRun_profiles_v2';
const ACTIVE_KEY  = 'mojaveRun_activeProfile_v2';
const LEGACY_BEST = 'mojaveRunBest';

const Profile = {
  _data: null,
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : { profiles: [] };
    } catch (e) { this._data = { profiles: [] }; }
    return this._data;
  },
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data)); } catch (e) {}
  },
  list() { return this._data.profiles.slice(); },
  activeId() {
    try { return localStorage.getItem(ACTIVE_KEY); } catch (e) { return null; }
  },
  active() {
    const id = this.activeId();
    return this._data.profiles.find(p => p.id === id) || null;
  },
  setActive(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
  },
  create(name) {
    name = (name || '').trim().toUpperCase().slice(0, 14);
    if (!name) throw new Error('Name required');
    if (this._data.profiles.some(p => p.name === name)) throw new Error('Name already used');
    if (this._data.profiles.length >= 6) throw new Error('Max 6 drivers');
    const p = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      created: Date.now(),
      scrap: 100, // starter scrap
      lifetimeScrap: 0,
      runs: 0,
      bestClassic: 0,
      bestTime: 0,
      bestDistance: 0,
      ownedVehicles: { rustbucket: true },
      vehicleUpgrades: { rustbucket: { engine: 0, plating: 0, weapons: 0 } },
      activeVehicle: 'rustbucket',
      gauntletCleared: [], // array of cleared level numbers
    };
    // migrate legacy best score on first profile
    if (this._data.profiles.length === 0) {
      const legacy = parseInt(localStorage.getItem(LEGACY_BEST) || '0', 10);
      if (legacy > 0) p.bestClassic = legacy;
    }
    this._data.profiles.push(p);
    this.save();
    this.setActive(p.id);
    return p;
  },
  delete(id) {
    this._data.profiles = this._data.profiles.filter(p => p.id !== id);
    this.save();
    if (this.activeId() === id) {
      const first = this._data.profiles[0];
      if (first) this.setActive(first.id);
      else { try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {} }
    }
  },
  earn(amt) {
    const p = this.active(); if (!p) return;
    amt = Math.floor(amt);
    p.scrap += amt;
    p.lifetimeScrap += amt;
    this.save();
  },
  spend(amt) {
    const p = this.active(); if (!p) return false;
    if (p.scrap < amt) return false;
    p.scrap -= amt;
    this.save();
    return true;
  },
  unlock(vehicleId) {
    const p = this.active(); if (!p) return false;
    const v = VEHICLE_BY_ID[vehicleId]; if (!v) return false;
    if (p.ownedVehicles[vehicleId]) return false;
    if (p.scrap < v.cost) return false;
    p.scrap -= v.cost;
    p.ownedVehicles[vehicleId] = true;
    p.vehicleUpgrades[vehicleId] = { engine: 0, plating: 0, weapons: 0 };
    this.save();
    return true;
  },
  upgrade(vehicleId, trackId) {
    const p = this.active(); if (!p) return false;
    if (!p.ownedVehicles[vehicleId]) return false;
    const track = UPGRADE_TRACKS.find(t => t.id === trackId); if (!track) return false;
    const ups = p.vehicleUpgrades[vehicleId];
    const cur = ups[trackId] || 0;
    if (cur >= track.tiers.length) return false;
    const cost = track.tiers[cur];
    if (p.scrap < cost) return false;
    p.scrap -= cost;
    ups[trackId] = cur + 1;
    this.save();
    return true;
  },
  selectVehicle(vehicleId) {
    const p = this.active(); if (!p) return false;
    if (!p.ownedVehicles[vehicleId]) return false;
    p.activeVehicle = vehicleId;
    this.save();
    return true;
  },
  // Compute effective stats for a vehicle including upgrades
  effectiveStats(vehicleId) {
    const v = VEHICLE_BY_ID[vehicleId]; if (!v) return null;
    const p = this.active();
    const ups = (p && p.vehicleUpgrades && p.vehicleUpgrades[vehicleId]) || {engine:0,plating:0,weapons:0};
    const st = Object.assign({}, v.base);
    UPGRADE_TRACKS.forEach(t => t.apply(st, ups[t.id] || 0));
    return st;
  },
  recordRunResult(result) {
    const p = this.active(); if (!p) return;
    p.runs += 1;
    if (result.mode === 'classic' && result.score > p.bestClassic) p.bestClassic = result.score;
    if (result.mode === 'timeattack' && result.score > p.bestTime) p.bestTime = result.score;
    if (result.mode === 'classic' && result.distance > p.bestDistance) p.bestDistance = result.distance;
    if (result.mode === 'gauntlet' && result.victory && result.level && !p.gauntletCleared.includes(result.level)) {
      p.gauntletCleared.push(result.level);
      p.gauntletCleared.sort((a,b)=>a-b);
    }
    this.save();
  },
  isLevelUnlocked(num) {
    if (num === 1) return true;
    const p = this.active(); if (!p) return false;
    return p.gauntletCleared.includes(num - 1);
  },
};

// ============================================================
// CANVAS
// ============================================================
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
  W = cvs.clientWidth = window.innerWidth;
  H = cvs.clientHeight = window.innerHeight;
  cvs.width  = Math.floor(W * DPR);
  cvs.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (Game.player) {
    const { x0, x1 } = roadBounds();
    Game.player.x = clamp(Game.player.x, x0 + Game.player.w/2 + 4, x1 - Game.player.w/2 - 4);
    Game.player.y = H - 110;
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));

// ============================================================
// AUDIO
// ============================================================
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
}
function blip(freq, dur, type='square', vol=0.08, slide=0) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t); o.stop(t + dur);
}
function noise(dur, vol=0.12, filterFreq=800) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i/data.length);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(audioCtx.destination);
  src.start(t);
}
const SFX = {
  shoot: () => blip(880, 0.06, 'square', 0.05, -300),
  bigShot: () => { blip(180, 0.12, 'sawtooth', 0.1, -80); noise(0.08, 0.06, 1500); },
  hit:   () => { noise(0.18, 0.18, 1200); blip(120, 0.18, 'sawtooth', 0.06, -60); },
  pickup:() => { blip(660, 0.06, 'triangle', 0.08); setTimeout(()=>blip(990,0.08,'triangle',0.08),50); },
  scrap: () => { blip(880, 0.04, 'triangle', 0.06); setTimeout(()=>blip(1320,0.06,'triangle',0.06),40); },
  explode:() => { noise(0.45, 0.25, 600); blip(80, 0.4, 'sawtooth', 0.1, -40); },
  bigBoom:() => { noise(0.7, 0.35, 400); blip(50, 0.6, 'sawtooth', 0.15, -30); },
  death: () => { blip(220,0.4,'sawtooth',0.12,-180); noise(0.6,0.3,500); },
  start: () => { blip(440,0.08,'square',0.06); setTimeout(()=>blip(660,0.08,'square',0.06),80); setTimeout(()=>blip(880,0.12,'square',0.06),160); },
  victory:() => { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>blip(f,0.18,'square',0.08),i*120)); },
  levelUp:() => { [659,880].forEach((f,i)=>setTimeout(()=>blip(f,0.12,'triangle',0.08),i*100)); },
  boss:   () => { blip(110,0.4,'sawtooth',0.12,-30); setTimeout(()=>blip(82,0.4,'sawtooth',0.12,-20),200); },
  click:  () => blip(550, 0.04, 'square', 0.04),
};

// ============================================================
// HELPERS
// ============================================================
const rand = (a,b) => a + Math.random() * (b - a);
const irand = (a,b) => Math.floor(rand(a,b+1));
const clamp = (v,lo,hi) => v < lo ? lo : v > hi ? hi : v;
const PARTICLE_SCALE = IS_MOBILE ? 0.65 : 1;

function aabb(a,b){return Math.abs(a.x-b.x)*2<(a.w+b.w)&&Math.abs(a.y-b.y)*2<(a.h+b.h);}

function roadBounds() {
  const roadFrac = W < 600 ? 0.86 : 0.74;
  const roadW = Math.min(W * roadFrac, 720);
  const x0 = (W - roadW) / 2;
  const x1 = x0 + roadW;
  return { x0, x1, w: roadW };
}

function emit(x, y, n, opts = {}) {
  n = Math.max(1, Math.round(n * PARTICLE_SCALE));
  const { color='#f5d76e', speed=180, life=0.6, size=3, spread=Math.PI*2, gravity=0 } = opts;
  for (let i = 0; i < n; i++) {
    const ang = rand(0, spread) - (spread === Math.PI*2 ? 0 : spread/2 - Math.PI/2);
    const sp = rand(speed * 0.3, speed);
    Game.particles.push({
      x, y,
      vx: Math.cos(ang)*sp, vy: Math.sin(ang)*sp,
      life, max: life, size: size * rand(0.6, 1.2),
      color, gravity,
    });
  }
}

function shockwave(x, y, color = 'rgba(255,180,80,0.6)', maxR = 80) {
  Game.shockwaves.push({ x, y, r: 8, maxR, life: 0.4, max: 0.4, color });
}

// ============================================================
// INPUT
// ============================================================
const keys = Object.create(null);
const input = { left:false, right:false, fire:false, touchTargetX: null, touchFire: false };
const activePointers = new Map();

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowleft','arrowright','arrowup','arrowdown',' '].includes(e.key.toLowerCase())) e.preventDefault();
  ensureAudio();
  if (e.key.toLowerCase() === 'f') toggleFullscreen();
  if (e.key.toLowerCase() === 'p' && Game.state === 'playing') Game.paused = !Game.paused;
  if (Game.state === 'gameover') {
    if (e.key.toLowerCase() === 'r' || e.key === 'Enter') UI.act('res-again');
  }
}, { passive:false });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function onPointerDown(e) {
  ensureAudio();
  if (Game.state !== 'playing') return; // canvas only handles input during gameplay
  if (Game.paused) { Game.paused = false; return; }
  e.preventDefault();
  try { cvs.setPointerCapture(e.pointerId); } catch(_){}
  activePointers.set(e.pointerId, e.clientX);
  syncTouchInput();
}
function onPointerMove(e) {
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, e.clientX);
    syncTouchInput();
  }
}
function onPointerEnd(e) {
  activePointers.delete(e.pointerId);
  syncTouchInput();
}
function syncTouchInput() {
  if (activePointers.size === 0) {
    input.touchTargetX = null;
    input.touchFire = false;
  } else {
    const xs = [...activePointers.values()];
    input.touchTargetX = xs[xs.length - 1];
    input.touchFire = true;
  }
}
cvs.addEventListener('pointerdown', onPointerDown);
cvs.addEventListener('pointermove', onPointerMove);
cvs.addEventListener('pointerup',   onPointerEnd);
cvs.addEventListener('pointercancel', onPointerEnd);
cvs.addEventListener('pointerleave', onPointerEnd);
['touchstart','touchmove','touchend','gesturestart','contextmenu'].forEach(ev =>
  cvs.addEventListener(ev, e => e.preventDefault(), { passive:false })
);

function readKbd() {
  input.left  = !!(keys['arrowleft']  || keys['a']);
  input.right = !!(keys['arrowright'] || keys['d']);
  input.fire  = !!(keys[' '] || keys['z'] || keys['x']) || input.touchFire;
}

// ============================================================
// FULLSCREEN + WAKE LOCK
// ============================================================
const fsBtn = document.getElementById('fsBtn');
const pauseBtn = document.getElementById('pauseBtn');

function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) req.call(el).catch(()=>{});
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(()=>{});
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document).catch(()=>{});
  }
}
fsBtn.addEventListener('click', e => { e.stopPropagation(); toggleFullscreen(); });
fsBtn.addEventListener('pointerdown', e => e.stopPropagation());
pauseBtn.addEventListener('click', e => { e.stopPropagation(); if (Game.state === 'playing') Game.paused = !Game.paused; });
pauseBtn.addEventListener('pointerdown', e => e.stopPropagation());

let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(_){}
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(()=>{}); wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Game.state === 'playing') requestWakeLock();
  else { if (Game.state === 'playing') Game.paused = true; releaseWakeLock(); }
});

// ============================================================
// GAME STATE
// ============================================================
const Game = {
  state: 'menu',          // 'menu' | 'playing' | 'gameover' | 'victory'
  paused: false,
  mode: null,             // 'classic' | 'gauntlet' | 'timeattack'
  level: null,            // gauntlet level number
  levelData: null,
  t: 0,
  // run stats
  score: 0,
  scrapEarned: 0,
  distance: 0,
  kills: 0,
  speed: 280,
  targetSpeed: 280,
  health: 100,
  maxHealth: 100,
  fireCooldown: 0,
  spawnTimer: 0,
  pickupTimer: 0,
  shake: 0,
  flash: 0,
  hintTime: 0,
  laneOffset: 0,
  // theme
  isNight: false,
  isStorm: false,
  // entities
  player: null,
  vehicle: null,
  vehicleStats: null,
  bullets: [],
  enemies: [],
  obstacles: [],
  pickups: [],
  enemyBullets: [],
  particles: [],
  shockwaves: [],
  decor: [],
  // boss
  boss: null,
  // background fly-ins
  bgScroll: 0,
};

function makeDecor(yOverride) {
  const { x0, x1 } = roadBounds();
  const side = Math.random() < 0.5 ? 'L' : 'R';
  const x = side === 'L' ? rand(0, Math.max(8, x0 - 8)) : rand(x1 + 8, W);
  const y = yOverride !== undefined ? yOverride : -20;
  const r = Math.random();
  let type;
  if (r < 0.55) type = 'rock';
  else if (r < 0.8) type = 'cactus';
  else if (r < 0.92) type = 'wreck';
  else type = 'skull';
  return { x, y, type, size: type === 'rock' ? rand(8, 22) : rand(14, 26), tone: rand(0.6, 1.0), rot: rand(-0.5, 0.5) };
}

function startRun(mode, level) {
  ensureAudio();
  const profile = Profile.active();
  if (!profile) return;
  const v = VEHICLE_BY_ID[profile.activeVehicle] || VEHICLES[0];
  const stats = Profile.effectiveStats(profile.activeVehicle);
  Game.mode = mode;
  Game.level = level || null;
  Game.levelData = level ? LEVELS.find(l => l.num === level) : null;
  Game.state = 'playing';
  Game.paused = false;
  Game.t = 0;
  Game.score = 0;
  Game.scrapEarned = 0;
  Game.distance = 0;
  Game.kills = 0;
  const baseSpeed = 280 * (Game.levelData ? (0.85 + Game.levelData.diff * 0.15) : 1);
  Game.speed = baseSpeed; Game.targetSpeed = baseSpeed;
  Game.maxHealth = Math.round(stats.maxHp);
  Game.health = Game.maxHealth;
  Game.fireCooldown = 0;
  Game.spawnTimer = 0.6;
  Game.pickupTimer = 3;
  Game.shake = 0; Game.flash = 0;
  Game.hintTime = IS_TOUCH ? 4.5 : 0;
  Game.bullets.length = 0; Game.enemies.length = 0; Game.obstacles.length = 0;
  Game.pickups.length = 0; Game.enemyBullets.length = 0;
  Game.particles.length = 0; Game.shockwaves.length = 0;
  Game.decor.length = 0;
  Game.laneOffset = 0;
  Game.isNight = !!(Game.levelData && Game.levelData.night);
  Game.isStorm = !!(Game.levelData && Game.levelData.storm);
  Game.vehicle = v;
  Game.vehicleStats = stats;
  Game.player = {
    x: W * 0.5, y: H - 110, w: 42, h: 64, vx: 0,
  };
  Game.boss = null;
  Game.bgScroll = 0;
  for (let i = 0; i < 30; i++) Game.decor.push(makeDecor(Math.random() * H));
  // Spawn boss right away in boss levels
  if (Game.levelData && Game.levelData.obj === 'boss') {
    spawnBoss(Game.levelData.boss);
    SFX.boss();
  } else {
    SFX.start();
  }
  requestWakeLock();
  pauseBtn.classList.add('show');
  fsBtn.classList.add('hidden');
  UI.hideAllScreens();
}

function endRun(reason /* 'death' | 'victory' | 'time' */) {
  if (Game.state !== 'playing') return;
  Game.state = reason === 'victory' ? 'victory' : 'gameover';
  releaseWakeLock();
  pauseBtn.classList.remove('show');
  fsBtn.classList.remove('hidden');
  // award scrap (10% of score)
  const baseScrap = Math.floor(Game.score / 10);
  let bonus = 0;
  if (reason === 'victory' && Game.levelData) bonus = Game.levelData.reward;
  Game.scrapEarned = baseScrap + bonus;
  Profile.earn(Game.scrapEarned);
  // record stats
  Profile.recordRunResult({
    mode: Game.mode,
    score: Math.floor(Game.score),
    distance: Math.floor(Game.distance),
    level: Game.level,
    victory: reason === 'victory',
  });
  if (reason === 'victory') SFX.victory(); else SFX.death();
  // small delay to let final FX play
  setTimeout(() => UI.showResults(reason), 1100);
}

// Check level objective each frame
function checkObjective() {
  if (Game.mode !== 'gauntlet' || !Game.levelData) return;
  const L = Game.levelData;
  if (L.obj === 'survive' && Game.t >= L.target) endRun('victory');
  else if (L.obj === 'kills' && Game.kills >= L.target) endRun('victory');
  else if (L.obj === 'distance' && Game.distance >= L.target) endRun('victory');
  // boss: handled by boss death
  // Time attack: 60s timer
  if (Game.mode === 'timeattack' && Game.t >= 60) endRun('time');
}

// ============================================================
// SPAWNERS
// ============================================================
function spawnEnemy() {
  if (Game.boss) return; // bosses pause normal spawns mid-fight
  const { x0, x1 } = roadBounds();
  const margin = 32;
  const r = Math.random();
  const lvlMul = Game.levelData ? Game.levelData.diff : 1;
  if (r < 0.45) {
    Game.enemies.push({
      kind:'buggy',
      x: rand(x0+margin, x1-margin),
      y: -50, w:40, h:56,
      vx: rand(-40, 40),
      vy: rand(60, 110) * Math.min(1.5, 1 + (lvlMul-1)*0.3),
      hp: 2, fireT: rand(0.8, 1.6),
    });
  } else if (r < 0.8) {
    Game.obstacles.push({
      kind:'wreck',
      x: rand(x0+margin, x1-margin),
      y:-60, w:44, h:64, rot: rand(-0.4,0.4),
    });
  } else {
    const cx = rand(x0+margin, x1-margin);
    const n = irand(1,3);
    for (let i = 0; i < n; i++) {
      Game.obstacles.push({
        kind:'barrel',
        x: cx + (i - (n-1)/2)*26 + rand(-4,4),
        y: -40 - i*22, w:22, h:24, hp:1,
      });
    }
  }
}

function spawnPickup() {
  const { x0, x1 } = roadBounds();
  const kind = Math.random() < 0.78 ? 'scrap' : 'repair';
  Game.pickups.push({ kind, x: rand(x0+30, x1-30), y:-30, w:22, h:22, t:0 });
}

// ============================================================
// BOSSES
// ============================================================
const BOSS_DEFS = [
  null,
  { name:'ALPHA RAIDER',  hp: 80,  w: 80,  h: 100, color:'#7a1a1a', pattern:'spread',  fireRate: 1.2, dmg: 12, contactDmg: 25 },
  { name:'TWIN DEMONS',   hp: 140, w: 70,  h: 90,  color:'#aa1a3a', pattern:'aimed',   fireRate: 0.7, dmg: 14, contactDmg: 30, twin: true },
  { name:'THE OVERLORD',  hp: 280, w: 110, h: 130, color:'#5a1a8a', pattern:'hellfire',fireRate: 0.4, dmg: 16, contactDmg: 40 },
];
function spawnBoss(tier) {
  const def = BOSS_DEFS[tier] || BOSS_DEFS[1];
  const { x0, x1 } = roadBounds();
  Game.boss = {
    name: def.name,
    x: (x0+x1)/2, y: -def.h,
    targetY: H * 0.22,
    w: def.w, h: def.h,
    hp: def.hp, maxHp: def.hp,
    color: def.color,
    pattern: def.pattern,
    fireRate: def.fireRate,
    dmg: def.dmg,
    contactDmg: def.contactDmg,
    fireT: 1.0,
    moveT: 0,
    vx: 0,
    enrage: false,
    twin: !!def.twin,
    twinX: 80, // offset for twin movement
    phase: 0,
  };
}

function updateBoss(dt) {
  const b = Game.boss; if (!b) return;
  // approach
  if (b.y < b.targetY) {
    b.y += 80 * dt;
    if (b.y >= b.targetY) b.y = b.targetY;
    return;
  }
  b.moveT += dt;
  // movement: sway across road
  const { x0, x1 } = roadBounds();
  const cx = (x0+x1)/2;
  const range = (x1 - x0) * 0.32;
  b.x = cx + Math.sin(b.moveT * 0.6) * range;
  if (b.twin) b.twinX = cx + Math.cos(b.moveT * 0.6) * range;

  // enrage at <30% hp
  if (!b.enrage && b.hp < b.maxHp * 0.3) {
    b.enrage = true;
    b.fireRate *= 0.6;
    SFX.boss();
    Game.shake = Math.max(Game.shake, 0.8);
    emit(b.x, b.y, 30, { color:'#ff5050', speed: 280, life: 0.6, size: 4 });
  }

  // fire patterns
  b.fireT -= dt;
  if (b.fireT <= 0) {
    fireBossPattern(b);
    b.fireT = b.fireRate * (b.enrage ? 0.7 : 1);
  }

  // bullets vs boss
  for (let j = Game.bullets.length - 1; j >= 0; j--) {
    const bu = Game.bullets[j];
    if (Math.abs(bu.x - b.x)*2 < b.w && Math.abs(bu.y - b.y)*2 < b.h) {
      Game.bullets.splice(j,1);
      const dmg = bu.dmg || 1;
      b.hp -= dmg;
      emit(bu.x, bu.y, 5, { color:'#ffd86b', speed:200, life:0.3, size:2 });
      if (b.hp <= 0) {
        SFX.bigBoom();
        emit(b.x, b.y, 60, { color:'#ff6a2b', speed:480, life:1.0, size:5 });
        emit(b.x, b.y, 30, { color:'#ffd86b', speed:360, life:0.8, size:4 });
        shockwave(b.x, b.y, 'rgba(255,180,80,0.7)', 200);
        Game.shake = 1.4;
        Game.score += 1500 * (Game.levelData ? Game.levelData.diff : 1);
        Game.kills += 1;
        Game.boss = null;
        if (Game.levelData && Game.levelData.obj === 'boss') {
          setTimeout(() => endRun('victory'), 800);
        }
        return;
      } else {
        SFX.hit();
      }
    }
  }
  // contact
  if (Math.abs(b.x - Game.player.x)*2 < (b.w + Game.player.w) &&
      Math.abs(b.y - Game.player.y)*2 < (b.h + Game.player.h)) {
    damagePlayer(b.contactDmg * dt * 4);
  }
}

function fireBossPattern(b) {
  const sp = 320;
  const px = Game.player.x, py = Game.player.y;
  const dx = px - b.x, dy = py - b.y;
  const dist = Math.hypot(dx, dy) || 1;
  const dmg = b.dmg;
  if (b.pattern === 'spread') {
    // 3-way + center
    [-0.35, 0, 0.35].forEach(a => {
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*sp, vy = (dx*sn + dy*cs)/dist*sp;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:10, vx, vy, dmg, big:true });
    });
  } else if (b.pattern === 'aimed') {
    // single fast aimed
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:7, h:12, vx:dx/dist*sp*1.3, vy:dy/dist*sp*1.3, dmg, big:true });
    if (b.twin) {
      const tx = b.twinX;
      const tdx = px - tx, td = Math.hypot(tdx, dy)||1;
      Game.enemyBullets.push({ x:tx, y:b.y+b.h/2, w:7, h:12, vx:tdx/td*sp*1.3, vy:dy/td*sp*1.3, dmg, big:true });
    }
  } else if (b.pattern === 'hellfire') {
    // burst 5-way
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.22;
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*sp, vy = (dx*sn + dy*cs)/dist*sp;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:10, vx, vy, dmg, big:true });
    }
    // plus a slow homing-ish burst
    if (b.enrage) {
      for (let k = 0; k < 8; k++) {
        const a = (Math.PI * 2 * k) / 8;
        Game.enemyBullets.push({ x:b.x, y:b.y, w:6, h:6, vx:Math.cos(a)*180, vy:Math.sin(a)*180, dmg:dmg*0.7, big:false });
      }
    }
  }
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  Game.t += dt;
  if (Game.state !== 'playing' || Game.paused) return;
  if (Game.hintTime > 0) Game.hintTime -= dt;

  Game.distance += Game.speed * dt;
  Game.score += Game.speed * dt * 0.05;
  Game.laneOffset = (Game.laneOffset + Game.speed * dt) % 60;
  Game.bgScroll += Game.speed * dt * 0.3;
  Game.shake = Math.max(0, Game.shake - dt * 2.4);
  Game.flash = Math.max(0, Game.flash - dt * 3);

  // difficulty ramp (classic: by distance; gauntlet: fixed per level; timeattack: aggressive)
  if (Game.mode === 'classic') {
    const lvl = 1 + Math.floor(Game.distance / 1500);
    Game.targetSpeed = 280 + Math.min(420, lvl * 28);
  } else if (Game.mode === 'timeattack') {
    Game.targetSpeed = 360 + Math.min(280, Game.t * 4);
  } else if (Game.levelData) {
    Game.targetSpeed = 280 * (0.85 + Game.levelData.diff * 0.15);
  }
  Game.speed += (Game.targetSpeed - Game.speed) * Math.min(1, dt * 0.8);

  readKbd();

  // ---- player movement ----
  const p = Game.player;
  const stats = Game.vehicleStats;
  const accel = stats.accel;
  const maxV = stats.maxV;
  const drag = 6.5;
  if (input.left)  p.vx -= accel * dt;
  if (input.right) p.vx += accel * dt;
  if (!input.left && !input.right) {
    if (input.touchTargetX !== null) {
      const target = clamp(input.touchTargetX, 0, W);
      const dx = target - p.x;
      const desiredV = clamp(dx * 14, -maxV, maxV);
      p.vx += (desiredV - p.vx) * Math.min(1, 18 * dt);
    } else {
      p.vx -= p.vx * Math.min(1, drag * dt);
    }
  }
  p.vx = clamp(p.vx, -maxV, maxV);
  p.x += p.vx * dt;
  const { x0, x1 } = roadBounds();
  if (p.x - p.w/2 < x0 + 4) { p.x = x0 + 4 + p.w/2; p.vx *= -0.4; }
  if (p.x + p.w/2 > x1 - 4) { p.x = x1 - 4 - p.w/2; p.vx *= -0.4; }
  p.y = H - 110;

  // ---- fire ----
  Game.fireCooldown -= dt;
  if (input.fire && Game.fireCooldown <= 0) {
    fireGuns();
    Game.fireCooldown = stats.fireRate;
  }

  // ---- bullets ----
  for (let i = Game.bullets.length - 1; i >= 0; i--) {
    const b = Game.bullets[i];
    b.y += b.vy * dt;
    if (b.y < -20 || b.y > H + 20) Game.bullets.splice(i,1);
  }
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    const b = Game.enemyBullets[i];
    b.y += b.vy * dt; b.x += (b.vx || 0) * dt;
    if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) Game.enemyBullets.splice(i,1);
  }

  // ---- obstacles ----
  for (let i = Game.obstacles.length - 1; i >= 0; i--) {
    const o = Game.obstacles[i];
    o.y += Game.speed * dt;
    if (o.y > H + 80) { Game.obstacles.splice(i,1); continue; }

    if (o.kind === 'barrel') {
      for (let j = Game.bullets.length - 1; j >= 0; j--) {
        const b = Game.bullets[j];
        if (aabb(o, b)) {
          Game.bullets.splice(j,1);
          o.hp -= (b.dmg || 1);
          if (o.hp <= 0) {
            SFX.explode();
            emit(o.x, o.y, 26, { color:'#ff8a3d', speed:320, life:0.7, size:4 });
            emit(o.x, o.y, 12, { color:'#ffd86b', speed:220, life:0.5, size:3 });
            shockwave(o.x, o.y, 'rgba(255,140,60,0.5)', 90);
            Game.shake = Math.max(Game.shake, 0.5);
            Game.score += 50;
            splashDamage(o.x, o.y, 70, 1);
            Game.obstacles.splice(i,1);
            break;
          }
        }
      }
    }
    if (Game.obstacles[i] && aabb(o, Game.player)) {
      damagePlayer(o.kind === 'barrel' ? 18 : 35);
      emit(o.x, o.y, 14, { color:'#aaa', speed:240, life:0.5 });
      if (o.kind === 'barrel') { SFX.explode(); shockwave(o.x, o.y, 'rgba(255,140,60,0.5)', 90); splashDamage(o.x, o.y, 70, 1); }
      Game.obstacles.splice(i,1);
      Game.shake = Math.max(Game.shake, 0.6);
    }
  }

  // ---- enemies ----
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    e.y += (e.vy + Game.speed * 0.15) * dt;
    e.x += e.vx * dt;
    const { x0:rx0, x1:rx1 } = roadBounds();
    if (e.x < rx0 + 24) { e.x = rx0 + 24; e.vx = Math.abs(e.vx); }
    if (e.x > rx1 - 24) { e.x = rx1 - 24; e.vx = -Math.abs(e.vx); }
    e.fireT -= dt;
    if (e.fireT <= 0 && e.y > 0 && e.y < H * 0.7) {
      const dx = Game.player.x - e.x, dy = Game.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const sp = 360;
      Game.enemyBullets.push({ x:e.x, y:e.y+20, w:5, h:10, vx:dx/dist*sp, vy:dy/dist*sp, dmg:8 });
      e.fireT = rand(1.2, 2.2);
    }

    for (let j = Game.bullets.length - 1; j >= 0; j--) {
      const b = Game.bullets[j];
      if (aabb(e, b)) {
        Game.bullets.splice(j,1);
        e.hp -= (b.dmg || 1);
        emit(b.x, b.y, 5, { color:'#ffd86b', speed:200, life:0.3, size:2 });
        if (e.hp <= 0) {
          SFX.explode();
          emit(e.x, e.y, 28, { color:'#ff6a2b', speed:360, life:0.8, size:4 });
          emit(e.x, e.y, 14, { color:'#ffe07a', speed:240, life:0.6, size:3 });
          shockwave(e.x, e.y, 'rgba(255,140,60,0.4)', 70);
          Game.score += 150;
          Game.kills += 1;
          Game.shake = Math.max(Game.shake, 0.5);
          if (Math.random() < 0.4) Game.pickups.push({ kind:'scrap', x:e.x, y:e.y, w:22, h:22, t:0 });
          Game.enemies.splice(i,1);
          break;
        } else { SFX.hit(); }
      }
    }
    if (!Game.enemies[i]) continue;

    if (aabb(e, Game.player)) {
      damagePlayer(40);
      SFX.explode();
      emit(e.x, e.y, 24, { color:'#ff6a2b', speed:320, life:0.7, size:4 });
      Game.enemies.splice(i,1);
      Game.shake = Math.max(Game.shake, 0.7);
    } else if (e.y > H + 60) Game.enemies.splice(i,1);
  }

  // ---- enemy bullets vs player ----
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    const b = Game.enemyBullets[i];
    if (aabb(b, Game.player)) {
      damagePlayer(b.dmg || 8);
      emit(b.x, b.y, 6, { color:'#ff5050', speed:180, life:0.3, size:2 });
      Game.enemyBullets.splice(i,1);
    }
  }

  // ---- pickups ----
  for (let i = Game.pickups.length - 1; i >= 0; i--) {
    const pk = Game.pickups[i];
    pk.y += Game.speed * dt;
    pk.t += dt;
    if (pk.y > H + 40) { Game.pickups.splice(i,1); continue; }
    if (aabb(pk, Game.player)) {
      if (pk.kind === 'scrap') {
        Game.score += 75;
        emit(pk.x, pk.y, 12, { color:'#f5d76e', speed:220, life:0.5, size:3 });
        SFX.scrap();
      } else {
        Game.health = Math.min(Game.maxHealth, Game.health + Game.maxHealth * 0.3);
        emit(pk.x, pk.y, 14, { color:'#7af07a', speed:220, life:0.5, size:3 });
        SFX.pickup();
      }
      Game.pickups.splice(i,1);
    }
  }

  // ---- particles ----
  for (let i = Game.particles.length - 1; i >= 0; i--) {
    const pr = Game.particles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt + Game.speed * dt * 0.4;
    if (pr.gravity) pr.vy += pr.gravity * dt;
    pr.vx *= 0.96; pr.vy *= 0.96;
    pr.life -= dt;
    if (pr.life <= 0) Game.particles.splice(i,1);
  }
  // ---- shockwaves ----
  for (let i = Game.shockwaves.length - 1; i >= 0; i--) {
    const s = Game.shockwaves[i];
    s.life -= dt;
    s.r = s.maxR * (1 - s.life / s.max);
    if (s.life <= 0) Game.shockwaves.splice(i, 1);
  }

  // ---- decor ----
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    const d = Game.decor[i];
    d.y += Game.speed * dt;
    if (d.y > H + 30) Game.decor.splice(i,1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());

  // ---- spawning (skip during boss approach/fight) ----
  if (!Game.boss) {
    Game.spawnTimer -= dt;
    if (Game.spawnTimer <= 0) {
      const baseInterval = Game.mode === 'timeattack' ? 0.35 :
        clamp(1.4 - (Game.levelData ? Game.levelData.diff : 1) * 0.18, 0.45, 1.4);
      // also factor score-based difficulty in classic
      const intervalMul = Game.mode === 'classic' ? Math.max(0.4, 1 - Game.distance / 30000) : 1;
      Game.spawnTimer = rand(baseInterval * 0.7 * intervalMul, baseInterval * 1.2 * intervalMul);
      spawnEnemy();
      // burst spawn in time attack
      if (Game.mode === 'timeattack' && Math.random() < 0.4) spawnEnemy();
    }
    Game.pickupTimer -= dt;
    if (Game.pickupTimer <= 0) {
      spawnPickup();
      Game.pickupTimer = rand(2.6, 4.6);
    }
  }

  // ---- boss ----
  if (Game.boss) updateBoss(dt);

  // ---- exhaust ----
  if (Math.random() < 0.6) {
    const ex = '#a86a2e';
    emit(p.x - 10 + rand(-2,2), p.y + p.h/2 - 4, 1, { color:'rgba(80,60,40,0.6)', speed:30, life:0.5, size:4, spread:Math.PI/4 });
    emit(p.x + 10 + rand(-2,2), p.y + p.h/2 - 4, 1, { color:'rgba(80,60,40,0.6)', speed:30, life:0.5, size:4, spread:Math.PI/4 });
  }

  // ---- objective check ----
  checkObjective();
}

function fireGuns() {
  const p = Game.player;
  const stats = Game.vehicleStats;
  const v = Game.vehicle;
  const guns = stats.guns;
  const dmg = stats.dmg;
  const bigShot = v.base.bigShot;
  const muzzleColor = v.color.glow;
  if (bigShot) {
    Game.bullets.push({ x:p.x, y:p.y - 30, w:8, h:18, vy:-720, owner:'p', dmg, big:true });
    SFX.bigShot();
    emit(p.x, p.y - 32, 6, { color:muzzleColor, speed:120, life:0.2, size:3, spread:Math.PI/3 });
    return;
  }
  if (guns === 1) {
    Game.bullets.push({ x:p.x, y:p.y - 30, w:5, h:14, vy:-780, owner:'p', dmg });
  } else if (guns === 2) {
    Game.bullets.push({ x:p.x - 10, y:p.y - 26, w:4, h:12, vy:-780, owner:'p', dmg });
    Game.bullets.push({ x:p.x + 10, y:p.y - 26, w:4, h:12, vy:-780, owner:'p', dmg });
  } else if (guns === 4) {
    [-16,-6,6,16].forEach(dx =>
      Game.bullets.push({ x:p.x + dx, y:p.y - 26, w:3, h:10, vy:-820, owner:'p', dmg })
    );
  }
  SFX.shoot();
  emit(p.x, p.y - 30, 3, { color:muzzleColor, speed:80, life:0.18, size:2, spread:Math.PI/3 });
}

function damagePlayer(amt) {
  Game.health -= amt;
  Game.flash = 1;
  SFX.hit();
  if (Game.health <= 0) {
    Game.health = 0;
    emit(Game.player.x, Game.player.y, 60, { color:'#ff6a2b', speed:420, life:1.0, size:5 });
    emit(Game.player.x, Game.player.y, 30, { color:'#ffd86b', speed:320, life:0.8, size:4 });
    shockwave(Game.player.x, Game.player.y, 'rgba(255,140,60,0.6)', 140);
    Game.shake = 1.2;
    endRun('death');
  }
}

function splashDamage(x, y, r, dmg) {
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    if (Math.hypot(e.x - x, e.y - y) < r) {
      e.hp -= dmg;
      if (e.hp <= 0) {
        SFX.explode();
        emit(e.x, e.y, 22, { color:'#ff6a2b', speed:320, life:0.7, size:4 });
        Game.score += 120;
        Game.kills += 1;
        Game.enemies.splice(i,1);
      }
    }
  }
  for (let i = Game.obstacles.length - 1; i >= 0; i--) {
    const o = Game.obstacles[i];
    if (!o) continue;
    if (o.kind === 'barrel' && Math.hypot(o.x - x, o.y - y) < r) {
      emit(o.x, o.y, 18, { color:'#ff8a3d', speed:280, life:0.6, size:4 });
      shockwave(o.x, o.y, 'rgba(255,140,60,0.4)', 70);
      Game.obstacles.splice(i,1);
      Game.score += 30;
    }
  }
  if (Math.hypot(Game.player.x - x, Game.player.y - y) < r * 0.7) damagePlayer(10);
  // boss splash? minor
  if (Game.boss && Math.hypot(Game.boss.x - x, Game.boss.y - y) < r * 0.8) {
    Game.boss.hp -= dmg * 0.5;
  }
}

// ============================================================
// RENDER
// ============================================================
function drawBackground() {
  // sky / ground gradient — different at night vs day
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (Game.isNight) {
    g.addColorStop(0, '#0a0a1a');
    g.addColorStop(0.35, '#1a1530');
    g.addColorStop(1, '#2a1f1a');
  } else {
    g.addColorStop(0, '#3a230f');
    g.addColorStop(0.4, '#5a3818');
    g.addColorStop(1, '#6e4621');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // stars at night (parallax-light)
  if (Game.isNight) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const seedY = Math.floor(Game.bgScroll * 0.05);
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + seedY * 23) % W;
      const sy = ((i * 71) % (H * 0.3));
      const tw = Math.sin(Game.t * 2 + i) * 0.5 + 0.5;
      ctx.globalAlpha = 0.3 + tw * 0.5;
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // distant mountains parallax
  ctx.fillStyle = Game.isNight ? '#0a0612' : '#2a1808';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.32);
  const seed = Math.floor(Game.bgScroll * 0.05);
  for (let i = 0; i <= 20; i++) {
    const x = (i / 20) * W;
    const y = H * 0.32 - 30 - Math.abs(Math.sin(i * 1.7 + seed * 0.1)) * 60;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H * 0.32); ctx.lineTo(W, H * 0.36); ctx.lineTo(0, H * 0.36);
  ctx.closePath();
  ctx.fill();

  // mid-distance hills (closer parallax)
  ctx.fillStyle = Game.isNight ? '#1a1020' : '#3a230f';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.42);
  const seed2 = Math.floor(Game.bgScroll * 0.15);
  for (let i = 0; i <= 16; i++) {
    const x = (i / 16) * W;
    const y = H * 0.42 - 20 - Math.abs(Math.sin(i * 2.3 + seed2 * 0.15)) * 40;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H * 0.42); ctx.lineTo(W, H * 0.46); ctx.lineTo(0, H * 0.46);
  ctx.closePath();
  ctx.fill();

  // sun / moon
  if (Game.isNight) {
    ctx.fillStyle = 'rgba(220,220,250,0.7)';
    ctx.beginPath(); ctx.arc(W * 0.7, H * 0.18, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,220,250,0.15)';
    ctx.beginPath(); ctx.arc(W * 0.7, H * 0.18, 60, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(245,180,90,0.18)';
    ctx.beginPath(); ctx.arc(W * 0.7, H * 0.22, 90, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRoad() {
  const { x0, x1, w } = roadBounds();
  // shoulder
  ctx.fillStyle = Game.isNight ? '#1a1208' : '#3d2510';
  ctx.fillRect(0, 0, x0, H);
  ctx.fillRect(x1, 0, W - x1, H);

  // road
  const rg = ctx.createLinearGradient(x0, 0, x1, 0);
  if (Game.isNight) {
    rg.addColorStop(0, '#0a0a08');
    rg.addColorStop(0.5, '#181410');
    rg.addColorStop(1, '#0a0a08');
  } else {
    rg.addColorStop(0, '#1f1610');
    rg.addColorStop(0.5, '#2a1d12');
    rg.addColorStop(1, '#1f1610');
  }
  ctx.fillStyle = rg;
  ctx.fillRect(x0, 0, w, H);

  // road texture cracks (subtle)
  ctx.fillStyle = Game.isNight ? 'rgba(80,70,60,0.08)' : 'rgba(0,0,0,0.15)';
  const crackSeed = Math.floor(Game.laneOffset * 4);
  for (let i = 0; i < 12; i++) {
    const cy = ((i * 73 + crackSeed) % (H + 60)) - 30;
    const cx = x0 + ((i * 37) % w);
    ctx.fillRect(cx, cy, 24, 2);
  }

  // edges
  ctx.fillStyle = '#f5d76e';
  ctx.fillRect(x0 - 2, 0, 3, H);
  ctx.fillRect(x1 - 1, 0, 3, H);

  // dashed center line
  ctx.fillStyle = Game.isNight ? 'rgba(245,215,110,0.85)' : 'rgba(245,215,110,0.65)';
  const cx = (x0 + x1) / 2;
  const dashH = 28, gap = 32;
  for (let y = -gap + Game.laneOffset; y < H + gap; y += dashH + gap) {
    ctx.fillRect(cx - 3, y, 6, dashH);
  }
}

function drawDecor() {
  for (const d of Game.decor) {
    if (d.type === 'rock') {
      const c = Math.floor(60*d.tone), c2 = Math.floor(40*d.tone), c3 = Math.floor(24*d.tone);
      ctx.fillStyle = Game.isNight ? `rgba(${c-20},${c2-15},${c3-5},1)` : `rgba(${c},${c2},${c3},1)`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.size, d.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(d.x + d.size * 0.4, d.y + d.size * 0.3, d.size * 0.6, d.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'cactus') {
      ctx.fillStyle = Game.isNight ? '#1a3a18' : '#3a5a2a';
      ctx.fillRect(d.x - 3, d.y - d.size, 6, d.size);
      ctx.fillRect(d.x - 3 - 7, d.y - d.size * 0.7, 6, d.size * 0.4);
      ctx.fillRect(d.x + 3, d.y - d.size * 0.55, 6, d.size * 0.35);
    } else if (d.type === 'wreck') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = Game.isNight ? '#2a2018' : '#4a3020';
      ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = '#0d0805';
      ctx.fillRect(-10, -6, 4, 4);
      ctx.fillRect(6, -6, 4, 4);
      ctx.restore();
    } else if (d.type === 'skull') {
      ctx.fillStyle = Game.isNight ? '#9a8a78' : '#cabaa8';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 8, 6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#1a0f08';
      ctx.fillRect(d.x - 4, d.y - 1, 2, 3);
      ctx.fillRect(d.x + 2, d.y - 1, 2, 3);
    }
  }
}

function drawWeather() {
  if (Game.isStorm) {
    // sandstorm — diagonal streaks
    ctx.strokeStyle = 'rgba(180,140,90,0.25)';
    ctx.lineWidth = 1;
    const seed = Math.floor(Game.t * 60);
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 47 + seed * 5) % (W + 40)) - 20;
      const sy = ((i * 31 + seed * 8) % (H + 40)) - 20;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 14, sy + 6);
    }
    ctx.stroke();
    // overall haze
    ctx.fillStyle = 'rgba(180,140,90,0.08)';
    ctx.fillRect(0, 0, W, H);
  }
  if (Game.isNight) {
    // headlight cones from player
    const p = Game.player;
    const grad = ctx.createRadialGradient(p.x, p.y - 30, 20, p.x, p.y - 30, 240);
    grad.addColorStop(0, 'rgba(255,235,180,0.20)');
    grad.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p.x - 40, p.y);
    ctx.lineTo(p.x - 100, p.y - 260);
    ctx.lineTo(p.x + 100, p.y - 260);
    ctx.lineTo(p.x + 40, p.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawVehicle(x, y, vehicle, vx = 0, w = 42, h = 64) {
  const c = vehicle.color;
  ctx.save();
  ctx.translate(x, y);
  const tilt = clamp(vx / 460, -1, 1) * 0.18;
  ctx.rotate(tilt);

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(-w/2 + 4, -h/2 + 6, w, h);

  // body
  ctx.fillStyle = c.body;
  ctx.fillRect(-w/2, -h/2, w, h);
  // hood (top section)
  ctx.fillStyle = c.hood;
  ctx.fillRect(-w/2 + 3, -h/2, w - 6, 12);
  // body highlights — vertical streaks for paint look
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(-w/2 + 4, -h/2 + 14, 3, h - 24);
  ctx.fillRect(w/2 - 7, -h/2 + 14, 3, h - 24);
  // cab roof
  ctx.fillStyle = c.cab;
  ctx.fillRect(-w/2 + 6, -h/2 + 16, w - 12, 22);
  // windshield
  ctx.fillStyle = c.windshield;
  ctx.fillRect(-w/2 + 8, -h/2 + 18, w - 16, 6);
  // roof shine
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(-w/2 + 8, -h/2 + 16, w - 16, 2);
  // grille
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(-w/2 + 4, -h/2 - 2, w - 8, 4);
  // bumper bolts
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(-w/2 + 6, -h/2 - 2, 2, 4);
  ctx.fillRect(w/2 - 8, -h/2 - 2, 2, 4);
  // headlights
  ctx.fillStyle = c.glow;
  ctx.fillRect(-w/2 + 2, -h/2 - 4, 6, 4);
  ctx.fillRect( w/2 - 8, -h/2 - 4, 6, 4);
  // wheels
  ctx.fillStyle = '#0d0805';
  ctx.fillRect(-w/2 - 4, -h/2 + 8, 6, 14);
  ctx.fillRect( w/2 - 2, -h/2 + 8, 6, 14);
  ctx.fillRect(-w/2 - 4,  h/2 - 22, 6, 16);
  ctx.fillRect( w/2 - 2,  h/2 - 22, 6, 16);
  // wheel rims
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(-w/2 - 3, -h/2 + 11, 4, 8);
  ctx.fillRect( w/2 - 1, -h/2 + 11, 4, 8);
  ctx.fillRect(-w/2 - 3,  h/2 - 18, 4, 9);
  ctx.fillRect( w/2 - 1,  h/2 - 18, 4, 9);
  // exhaust glow
  ctx.fillStyle = 'rgba(255,140,60,0.6)';
  ctx.fillRect(-10, h/2 - 4, 6, 4);
  ctx.fillRect(  4, h/2 - 4, 6, 4);

  ctx.restore();
}

function drawObstacle(o) {
  if (o.kind === 'wreck') {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-o.w/2 + 3, -o.h/2 + 4, o.w, o.h);
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(-o.w/2 + 4, -o.h/2 + 14, o.w - 8, 22);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(-o.w/2 + 6, -o.h/2 + 4, 8, 6);
    ctx.fillRect( o.w/2 - 14, -o.h/2 + 24, 10, 8);
    ctx.fillStyle = '#0d0805';
    ctx.fillRect(-o.w/2 - 3, -o.h/2 + 10, 5, 12);
    ctx.fillRect( o.w/2 - 2, -o.h/2 + 10, 5, 12);
    // rust streak
    ctx.fillStyle = 'rgba(180,80,40,0.3)';
    ctx.fillRect(-o.w/2 + 2, -o.h/2 + 14, 2, 18);
    ctx.restore();
  } else if (o.kind === 'barrel') {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(o.x - o.w/2 + 2, o.y - o.h/2 + 3, o.w, o.h);
    // body
    const bg = ctx.createLinearGradient(o.x - o.w/2, 0, o.x + o.w/2, 0);
    bg.addColorStop(0, '#8a3a18'); bg.addColorStop(0.5, '#c25a2b'); bg.addColorStop(1, '#8a3a18');
    ctx.fillStyle = bg;
    ctx.fillRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(o.x - o.w/2, o.y - 4, o.w, 2);
    ctx.fillRect(o.x - o.w/2, o.y + 4, o.w, 2);
    ctx.fillStyle = '#ffd86b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', o.x, o.y);
  }
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(-e.w/2 + 3, -e.h/2 + 5, e.w, e.h);
  // body
  const bg = ctx.createLinearGradient(-e.w/2, 0, e.w/2, 0);
  bg.addColorStop(0, '#5a1010'); bg.addColorStop(0.5, '#7a1a1a'); bg.addColorStop(1, '#5a1010');
  ctx.fillStyle = bg;
  ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
  // angled spike front (now points DOWN since enemy faces player)
  ctx.fillStyle = '#1a0f08';
  ctx.beginPath();
  ctx.moveTo(-e.w/2, e.h/2);
  ctx.lineTo(0, e.h/2 + 10);
  ctx.lineTo(e.w/2, e.h/2);
  ctx.closePath(); ctx.fill();
  // cab
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(-e.w/2 + 5, -e.h/2 + 14, e.w - 10, 20);
  // windshield (red glow eyes)
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(-e.w/2 + 8, -e.h/2 + 18, e.w - 16, 5);
  // gun
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(-3, e.h/2 - 4, 6, 10);
  // wheels
  ctx.fillStyle = '#0d0805';
  ctx.fillRect(-e.w/2 - 3, -e.h/2 + 8, 5, 12);
  ctx.fillRect( e.w/2 - 2, -e.h/2 + 8, 5, 12);
  ctx.fillRect(-e.w/2 - 3,  e.h/2 - 18, 5, 14);
  ctx.fillRect( e.w/2 - 2,  e.h/2 - 18, 5, 14);
  // spikes on roof
  ctx.fillStyle = '#aa3030';
  ctx.fillRect(-e.w/2 + 7, -e.h/2 + 10, 2, 4);
  ctx.fillRect(e.w/2 - 9, -e.h/2 + 10, 2, 4);
  ctx.restore();
}

function drawBoss() {
  const b = Game.boss; if (!b) return;
  // big version of enemy with extras
  function drawOne(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(-b.w/2 + 6, -b.h/2 + 8, b.w, b.h);
    // hull
    const bg = ctx.createLinearGradient(-b.w/2, 0, b.w/2, 0);
    bg.addColorStop(0, b.color);
    bg.addColorStop(0.5, '#2a0a0a');
    bg.addColorStop(1, b.color);
    ctx.fillStyle = bg;
    ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
    // armor plates
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(-b.w/2 - 6, -b.h/2 + 10, 6, b.h - 30);
    ctx.fillRect( b.w/2,     -b.h/2 + 10, 6, b.h - 30);
    // cab/turret
    ctx.fillStyle = '#1a0a0a';
    const cw = b.w * 0.5, ch = b.h * 0.4;
    ctx.fillRect(-cw/2, -ch/2, cw, ch);
    // glowing eyes
    ctx.fillStyle = b.enrage ? '#ffaa00' : '#ff3030';
    ctx.fillRect(-cw/2 + 6, -ch/2 + 8, cw/2 - 8, 4);
    ctx.fillRect(2, -ch/2 + 8, cw/2 - 8, 4);
    // spikes
    ctx.fillStyle = '#aa3030';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 14, b.h/2 - 4, 4, 10);
    }
    // gun
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-6, b.h/2 - 2, 12, 18);
    // glow accent
    if (b.enrage) {
      ctx.fillStyle = 'rgba(255,80,80,0.3)';
      ctx.fillRect(-b.w/2 - 3, -b.h/2 - 3, b.w + 6, b.h + 6);
    }
    ctx.restore();
  }
  drawOne(b.x, b.y);
  if (b.twin) drawOne(b.twinX, b.y);
}

function drawPickup(pk) {
  const bob = Math.sin(pk.t * 6) * 2;
  if (pk.kind === 'scrap') {
    ctx.save();
    ctx.translate(pk.x, pk.y + bob);
    ctx.rotate(pk.t * 2);
    // glow halo
    ctx.fillStyle = 'rgba(245,215,110,0.2)';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(10, 0); ctx.lineTo(0, 10); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a8731a';
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(122,240,122,0.2)';
    ctx.beginPath(); ctx.arc(pk.x, pk.y + bob, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(pk.x - 11, pk.y + bob - 11, 22, 22);
    ctx.fillStyle = '#7af07a';
    ctx.fillRect(pk.x - 9, pk.y + bob - 9, 18, 18);
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(pk.x - 2, pk.y + bob - 7, 4, 14);
    ctx.fillRect(pk.x - 7, pk.y + bob - 2, 14, 4);
  }
}

function drawBullets() {
  for (const b of Game.bullets) {
    if (b.big) {
      ctx.fillStyle = 'rgba(255,180,80,0.3)';
      ctx.fillRect(b.x - b.w, b.y - b.h, b.w * 2, b.h * 2);
    }
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    ctx.fillStyle = 'rgba(255,180,80,0.5)';
    ctx.fillRect(b.x - b.w/2 - 1, b.y - b.h/2 - 4, b.w + 2, 4);
  }
  for (const b of Game.enemyBullets) {
    if (b.big) {
      ctx.fillStyle = 'rgba(255,80,80,0.3)';
      ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#ff5050';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    ctx.fillStyle = 'rgba(255,80,80,0.5)';
    ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawParticles() {
  for (const pr of Game.particles) {
    const a = Math.max(0, pr.life / pr.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = pr.color;
    ctx.fillRect(pr.x - pr.size/2, pr.y - pr.size/2, pr.size, pr.size);
  }
  ctx.globalAlpha = 1;
}

function drawShockwaves() {
  for (const s of Game.shockwaves) {
    const a = Math.max(0, s.life / s.max);
    ctx.globalAlpha = a;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

function drawHUD() {
  const hudH = W < 500 ? 48 : 56;
  const fs = W < 500 ? 13 : 16;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, hudH);

  ctx.fillStyle = '#f5d76e';
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  // left: score (and pause btn space, so offset by 50)
  ctx.fillText('SCORE  ' + String(Math.floor(Game.score)).padStart(6, '0'), 50, hudH * 0.32);
  ctx.fillStyle = 'rgba(245,215,110,0.7)';
  ctx.font = `bold ${fs - 2}px "Courier New", monospace`;
  // mode-specific subtitle
  let subL = '';
  if (Game.mode === 'classic') {
    subL = Math.floor(Game.distance) + ' M';
  } else if (Game.mode === 'gauntlet' && Game.levelData) {
    subL = `LV ${Game.levelData.num}/${LEVELS.length}  ${Game.levelData.name}`;
  } else if (Game.mode === 'timeattack') {
    subL = `TIME ATTACK`;
  }
  ctx.fillText(subL, 50, hudH * 0.72);

  // right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f5d76e';
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  let mainR = '';
  if (Game.mode === 'classic') {
    const lvl = 1 + Math.floor(Game.distance / 1500);
    mainR = 'SECTOR ' + lvl;
  } else if (Game.mode === 'timeattack') {
    const remain = Math.max(0, 60 - Game.t);
    mainR = remain.toFixed(1) + 'S';
  } else if (Game.mode === 'gauntlet' && Game.levelData) {
    const L = Game.levelData;
    if (L.obj === 'survive') mainR = Math.max(0, L.target - Game.t).toFixed(1) + 'S';
    else if (L.obj === 'kills') mainR = `${Game.kills}/${L.target}`;
    else if (L.obj === 'distance') mainR = `${Math.floor(Game.distance)}/${L.target}M`;
    else if (L.obj === 'boss') mainR = 'BOSS';
  }
  ctx.fillText(mainR, W - 50, hudH * 0.32);
  ctx.fillStyle = 'rgba(245,215,110,0.7)';
  ctx.font = `bold ${fs - 2}px "Courier New", monospace`;
  ctx.fillText('+' + Math.floor(Game.score / 10) + ' SCRAP', W - 50, hudH * 0.72);

  // hull bar
  const hbW = Math.min(180, W * 0.42), hbH = 10, hbX = (W - hbW) / 2, hbY = hudH * 0.4 - hbH/2;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(hbX - 2, hbY - 2, hbW + 4, hbH + 4);
  ctx.fillStyle = '#3a1a0a';
  ctx.fillRect(hbX, hbY, hbW, hbH);
  const pct = clamp(Game.health / Game.maxHealth, 0, 1);
  const col = pct > 0.5 ? '#7af07a' : pct > 0.25 ? '#f5d76e' : '#ff5050';
  ctx.fillStyle = col;
  ctx.fillRect(hbX, hbY, hbW * pct, hbH);
  ctx.strokeStyle = '#f5d76e'; ctx.lineWidth = 1;
  ctx.strokeRect(hbX, hbY, hbW, hbH);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3b0';
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.fillText('HULL ' + Math.ceil(Game.health) + '/' + Game.maxHealth, W/2, hbY + hbH + 10);

  // boss bar (top)
  if (Game.boss && Game.boss.y >= Game.boss.targetY - 5) {
    const bbW = Math.min(280, W * 0.7), bbH = 12, bbX = (W - bbW)/2, bbY = hudH + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bbX - 3, bbY - 3, bbW + 6, bbH + 18);
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(bbX, bbY, bbW, bbH);
    const bpct = clamp(Game.boss.hp / Game.boss.maxHp, 0, 1);
    ctx.fillStyle = Game.boss.enrage ? '#ff5050' : '#aa1a3a';
    ctx.fillRect(bbX, bbY, bbW * bpct, bbH);
    ctx.strokeStyle = '#ff5050'; ctx.strokeRect(bbX, bbY, bbW, bbH);
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Game.boss.name + (Game.boss.enrage ? ' ★ ENRAGED' : ''), W/2, bbY + bbH + 10);
  }
}

function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillText('PAUSED', W/2, H/2);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = 'rgba(245,215,110,0.7)';
  ctx.fillText(IS_TOUCH ? 'TAP TO RESUME' : 'PRESS P TO RESUME', W/2, H/2 + 32);
}

function drawIdleBackground() {
  // when on menu screens, we still draw scrolling road as backdrop
  Game.bgScroll += 60 * 0.016;
  Game.laneOffset = (Game.laneOffset + 60 * 0.016) % 60;
  drawBackground();
  drawRoad();
  // drift decor
  for (const d of Game.decor) d.y += 60 * 0.016;
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    if (Game.decor[i].y > H + 30) Game.decor.splice(i, 1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());
  drawDecor();
}

function render() {
  if (Game.state === 'playing' || Game.state === 'gameover' || Game.state === 'victory') {
    ctx.save();
    if (Game.shake > 0 && !Game.paused) {
      const s = Game.shake * 14;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    drawBackground();
    drawRoad();
    drawDecor();

    for (const o of Game.obstacles) drawObstacle(o);
    for (const e of Game.enemies) drawEnemy(e);
    for (const pk of Game.pickups) drawPickup(pk);
    if (Game.boss) drawBoss();
    drawBullets();
    if (Game.player) drawVehicle(Game.player.x, Game.player.y, Game.vehicle, Game.player.vx);
    drawParticles();
    drawShockwaves();
    drawWeather();

    if (Game.flash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${Game.flash * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // vignette
    const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    if (Game.state === 'playing') drawHUD();
    if (Game.state === 'playing' && Game.paused) drawPause();
  } else {
    // menu — animated wasteland backdrop
    drawIdleBackground();
    // soft vignette
    const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
}

// ============================================================
// VEHICLE PREVIEW (used in garage/upgrade)
// ============================================================
function renderVehiclePreview(canvas, vehicleId) {
  const v = VEHICLE_BY_ID[vehicleId];
  const c = canvas.getContext('2d');
  const cw = canvas.width = 80;
  const ch = canvas.height = 90;
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, cw, ch);
  // dummy ctx swap — do simplified inline draw
  const cx = cw/2, cy = ch/2;
  const w = 38, h = 60;
  const col = v.color;
  c.fillStyle = 'rgba(0,0,0,0.45)';
  c.fillRect(cx - w/2 + 3, cy - h/2 + 5, w, h);
  c.fillStyle = col.body;     c.fillRect(cx - w/2, cy - h/2, w, h);
  c.fillStyle = col.hood;     c.fillRect(cx - w/2 + 3, cy - h/2, w - 6, 11);
  c.fillStyle = col.cab;      c.fillRect(cx - w/2 + 5, cy - h/2 + 14, w - 10, 20);
  c.fillStyle = col.windshield;c.fillRect(cx - w/2 + 7, cy - h/2 + 16, w - 14, 5);
  c.fillStyle = '#1a0f08';    c.fillRect(cx - w/2 + 4, cy - h/2 - 2, w - 8, 4);
  c.fillStyle = col.glow;     c.fillRect(cx - w/2 + 2, cy - h/2 - 4, 5, 4); c.fillRect(cx + w/2 - 7, cy - h/2 - 4, 5, 4);
  c.fillStyle = '#0d0805';
  c.fillRect(cx - w/2 - 4, cy - h/2 + 8, 5, 12);
  c.fillRect(cx + w/2 - 1, cy - h/2 + 8, 5, 12);
  c.fillRect(cx - w/2 - 4, cy + h/2 - 22, 5, 14);
  c.fillRect(cx + w/2 - 1, cy + h/2 - 22, 5, 14);
}

// ============================================================
// UI / SCREENS
// ============================================================
const UI = {
  current: null,
  hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.current = null;
  },
  show(id) {
    this.hideAllScreens();
    const el = document.getElementById('screen-' + id);
    if (el) {
      el.classList.add('active');
      el.scrollTop = 0;
      this.current = id;
    }
  },
  toast(msg, ms = 1800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), ms);
  },

  // ---- TITLE ----
  showTitle() {
    Game.state = 'menu';
    pauseBtn.classList.remove('show');
    fsBtn.classList.remove('hidden');
    const hasProfile = !!Profile.active();
    const cont = document.querySelector('[data-act="title-continue"]');
    cont.style.display = hasProfile ? '' : 'none';
    cont.textContent = hasProfile ? 'CONTINUE AS ' + Profile.active().name : 'PLAY';
    this.show('title');
  },

  // ---- PROFILES ----
  showProfiles() {
    const list = document.getElementById('profile-list');
    list.innerHTML = '';
    const profiles = Profile.list();
    const activeId = Profile.activeId();
    if (profiles.length === 0) {
      list.innerHTML = '<div class="small center" style="padding:20px 0">NO DRIVERS YET. CREATE ONE TO START.</div>';
    }
    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'profile-card' + (p.id === activeId ? ' active' : '');
      card.innerHTML = `
        <div>
          <div class="pname">${escapeHtml(p.name)}</div>
          <div class="pmeta">SCRAP ${p.scrap} · RUNS ${p.runs} · BEST ${p.bestClassic}</div>
        </div>
        <button class="delbtn" data-pid="${p.id}" aria-label="Delete">×</button>
      `;
      card.addEventListener('click', e => {
        if (e.target.classList.contains('delbtn')) return;
        SFX.click();
        Profile.setActive(p.id);
        UI.showMenu();
      });
      card.querySelector('.delbtn').addEventListener('click', e => {
        e.stopPropagation();
        const pid = e.target.dataset.pid;
        UI.confirm('DELETE DRIVER ' + p.name + '?', () => {
          Profile.delete(pid);
          UI.showProfiles();
        });
      });
      list.appendChild(card);
    });
    this.show('profiles');
  },

  // ---- MENU ----
  showMenu() {
    const p = Profile.active();
    if (!p) return UI.showProfiles();
    document.getElementById('menu-name').textContent = p.name;
    document.getElementById('menu-runs').textContent = `RUNS ${p.runs} · BEST ${p.bestClassic}`;
    document.getElementById('menu-scrap').textContent = p.scrap;
    const v = VEHICLE_BY_ID[p.activeVehicle];
    document.getElementById('menu-garage-sub').textContent = (v ? v.name : '') + ' ◢';
    this.show('menu');
  },

  // ---- GARAGE ----
  showGarage() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('garage-scrap').textContent = p.scrap;
    const list = document.getElementById('vehicle-list');
    list.innerHTML = '';
    VEHICLES.forEach(v => {
      const owned = !!p.ownedVehicles[v.id];
      const selected = p.activeVehicle === v.id;
      const stats = owned ? Profile.effectiveStats(v.id) : v.base;
      const tile = document.createElement('div');
      tile.className = 'vehicle-tile' + (selected ? ' selected' : '') + (!owned ? ' locked' : '');

      // stat values normalized for bar display
      const norm = (val, max) => clamp(val / max, 0, 1) * 100;
      const speedN = norm(stats.maxV, 600);
      const accelN = norm(stats.accel, 2500);
      const armorN = norm(stats.maxHp, 220);
      const fireN  = norm(1 / stats.fireRate, 11);
      const dmgN   = norm(stats.dmg * stats.guns, 4);

      tile.innerHTML = `
        <div class="vt-head">
          <div>
            <div class="vt-name">${v.name}${selected ? ' ◀' : ''}</div>
            <div class="vt-cost">${owned ? (selected ? 'EQUIPPED' : 'OWNED') : 'COST <b>' + v.cost + '</b> SCRAP'}</div>
          </div>
        </div>
        <div class="vt-preview"><canvas></canvas></div>
        <div class="vt-desc">${v.desc}</div>
        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px">
          <div class="stat-bar"><div class="lbl">SPEED</div><div class="bar"><div class="fill" style="width:${speedN}%"></div></div><div class="num">${Math.round(stats.maxV)}</div></div>
          <div class="stat-bar"><div class="lbl">ACCEL</div><div class="bar"><div class="fill" style="width:${accelN}%"></div></div><div class="num">${Math.round(stats.accel/100)}</div></div>
          <div class="stat-bar"><div class="lbl">ARMOR</div><div class="bar"><div class="fill" style="width:${armorN}%"></div></div><div class="num">${Math.round(stats.maxHp)}</div></div>
          <div class="stat-bar"><div class="lbl">FIRE</div><div class="bar"><div class="fill" style="width:${fireN}%"></div></div><div class="num">${(1/stats.fireRate).toFixed(1)}</div></div>
          <div class="stat-bar"><div class="lbl">DAMAGE</div><div class="bar"><div class="fill" style="width:${dmgN}%"></div></div><div class="num">${stats.dmg}×${stats.guns}</div></div>
        </div>
        ${owned
          ? (selected
              ? '<button class="btn primary" data-vact="upgrade" data-vid="'+v.id+'">UPGRADE ▲</button>'
              : '<div class="btn-row"><button class="btn" data-vact="select" data-vid="'+v.id+'">EQUIP</button><button class="btn" data-vact="upgrade" data-vid="'+v.id+'">UPGRADE</button></div>')
          : '<button class="btn primary" data-vact="buy" data-vid="'+v.id+'" '+(p.scrap < v.cost ? 'disabled' : '')+'>UNLOCK · '+v.cost+' SCRAP</button>'}
      `;
      list.appendChild(tile);
      // render preview
      renderVehiclePreview(tile.querySelector('canvas'), v.id);
    });
    this.show('garage');
  },

  // ---- UPGRADE ----
  showUpgrade(vehicleId) {
    const p = Profile.active(); if (!p || !p.ownedVehicles[vehicleId]) return;
    this._upVid = vehicleId;
    const v = VEHICLE_BY_ID[vehicleId];
    document.getElementById('up-vname').textContent = v.name;
    document.getElementById('up-scrap').textContent = p.scrap;
    // preview
    const preview = document.getElementById('up-preview');
    preview.innerHTML = '';
    const c = document.createElement('canvas');
    preview.appendChild(c);
    renderVehiclePreview(c, vehicleId);
    // upgrade rows
    const list = document.getElementById('up-list');
    list.innerHTML = '';
    UPGRADE_TRACKS.forEach(track => {
      const cur = (p.vehicleUpgrades[vehicleId] || {})[track.id] || 0;
      const max = track.tiers.length;
      const nextCost = cur < max ? track.tiers[cur] : null;
      const row = document.createElement('div');
      row.className = 'up-row';
      let pips = '';
      for (let i = 0; i < max; i++) pips += `<div class="pip${i < cur ? ' filled' : ''}"></div>`;
      row.innerHTML = `
        <div class="up-head">
          <div class="up-name">${track.name}</div>
          <div class="up-tier">TIER ${cur} / ${max}</div>
        </div>
        <div class="up-tiers">${pips}</div>
        <div class="up-desc">${track.desc}</div>
        ${nextCost !== null
          ? `<button class="btn primary" data-uact="up" data-track="${track.id}" ${p.scrap < nextCost ? 'disabled' : ''}>UPGRADE TIER ${cur+1} · ${nextCost} SCRAP</button>`
          : `<button class="btn disabled" disabled>MAX TIER</button>`}
      `;
      list.appendChild(row);
    });
    this.show('upgrade');
  },

  // ---- MODE SELECT ----
  showMode() {
    const p = Profile.active(); if (!p) return;
    const v = VEHICLE_BY_ID[p.activeVehicle];
    document.getElementById('mode-vehicle').textContent = v.name;
    const list = document.getElementById('mode-list');
    list.innerHTML = '';
    MODES.forEach(m => {
      const tile = document.createElement('button');
      tile.className = 'mode-tile';
      tile.dataset.mid = m.id;
      tile.innerHTML = `
        <div class="mt-name">${m.name}</div>
        <div class="mt-desc">${m.desc}</div>
      `;
      list.appendChild(tile);
    });
    this.show('mode');
  },

  // ---- GAUNTLET ----
  showGauntlet() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('gauntlet-progress').textContent = `${p.gauntletCleared.length} / ${LEVELS.length}`;
    const grid = document.getElementById('gauntlet-grid');
    grid.innerHTML = '';
    LEVELS.forEach(L => {
      const cleared = p.gauntletCleared.includes(L.num);
      const unlocked = Profile.isLevelUnlocked(L.num);
      const isBoss = L.obj === 'boss';
      const tile = document.createElement('button');
      tile.className = 'level-tile' + (cleared ? ' cleared' : '') + (!unlocked ? ' locked' : '') + (isBoss ? ' boss' : '');
      let objLabel = '';
      if (L.obj === 'survive') objLabel = L.target + 'S';
      else if (L.obj === 'kills') objLabel = L.target + ' KILLS';
      else if (L.obj === 'distance') objLabel = (L.target/1000).toFixed(1) + 'KM';
      else if (L.obj === 'boss') objLabel = 'BOSS';
      tile.innerHTML = `
        <div class="ln">${L.num}</div>
        <div class="lname">${L.name}</div>
        <div class="lobj">${objLabel}</div>
        ${cleared ? '<div class="lcheck">✓</div>' : ''}
        ${isBoss && !cleared ? '<div class="star">★</div>' : ''}
      `;
      tile.dataset.level = L.num;
      grid.appendChild(tile);
    });
    this.show('gauntlet');
  },

  // ---- STATS ----
  showStats() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('stats-name').textContent = p.name;
    const list = document.getElementById('stats-list');
    const created = new Date(p.created).toLocaleDateString();
    const ownedCount = Object.keys(p.ownedVehicles).length;
    const ttlUpgrades = Object.values(p.vehicleUpgrades).reduce(
      (s, ups) => s + (ups.engine||0) + (ups.plating||0) + (ups.weapons||0), 0);
    const rows = [
      ['CREATED', created],
      ['SCRAP CURRENT', p.scrap],
      ['SCRAP LIFETIME', p.lifetimeScrap],
      ['RUNS', p.runs],
      ['BEST CLASSIC', p.bestClassic],
      ['BEST TIME ATK', p.bestTime],
      ['LONGEST RUN', p.bestDistance + ' M'],
      ['VEHICLES OWNED', ownedCount + ' / ' + VEHICLES.length],
      ['UPGRADES BUILT', ttlUpgrades],
      ['GAUNTLET', p.gauntletCleared.length + ' / ' + LEVELS.length],
    ];
    list.innerHTML = rows.map(([l, v]) =>
      `<div class="res-row"><div class="lbl">${l}</div><div class="val">${v}</div></div>`
    ).join('');
    this.show('stats');
  },

  // ---- RESULTS ----
  showResults(reason) {
    const p = Profile.active();
    const titleEl = document.getElementById('res-title');
    const subEl = document.getElementById('res-subtitle');
    if (Game.state === 'victory') {
      titleEl.textContent = 'VICTORY';
      titleEl.className = 'victory';
      subEl.textContent = (Game.levelData ? Game.levelData.name + ' CLEARED' : 'OBJECTIVE CLEARED');
    } else {
      titleEl.textContent = 'YOU DIED';
      titleEl.className = 'defeat';
      subEl.textContent = (Game.mode === 'timeattack' && reason === 'time') ? 'TIME UP' : 'WASTELAND CLAIMS ANOTHER';
      if (reason === 'time') {
        titleEl.textContent = 'TIME UP';
        titleEl.className = '';
      }
    }

    const rows = [];
    rows.push(['SCORE', Math.floor(Game.score), true]);
    if (Game.mode === 'classic') {
      rows.push(['DISTANCE', Math.floor(Game.distance) + ' M', false]);
      rows.push(['BEST', p.bestClassic, false]);
    } else if (Game.mode === 'timeattack') {
      rows.push(['BEST', p.bestTime, false]);
    } else if (Game.mode === 'gauntlet' && Game.levelData) {
      rows.push(['LEVEL', Game.levelData.num + ' · ' + Game.levelData.name, false]);
    }
    rows.push(['KILLS', Game.kills, false]);
    rows.push(['+ SCRAP EARNED', '+' + Game.scrapEarned, false]);

    document.getElementById('res-rows').innerHTML = rows.map(([l,v,big]) =>
      `<div class="res-row${big ? ' big' : ''}"><div class="lbl">${l}</div><div class="val">${v}</div></div>`
    ).join('');

    // next sector button (gauntlet victory)
    const nextBtn = document.getElementById('res-next');
    if (Game.state === 'victory' && Game.mode === 'gauntlet' && Game.levelData) {
      const nextNum = Game.levelData.num + 1;
      const next = LEVELS.find(L => L.num === nextNum);
      if (next && Profile.isLevelUnlocked(nextNum)) {
        nextBtn.style.display = '';
        nextBtn.textContent = 'NEXT: ' + next.name + ' ►';
        nextBtn.dataset.next = nextNum;
      } else nextBtn.style.display = 'none';
    } else nextBtn.style.display = 'none';

    this.show('results');
  },

  // ---- MODAL ----
  prompt(title, cb) {
    const m = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    const inp = document.getElementById('modal-input');
    const err = document.getElementById('modal-err');
    inp.value = ''; err.textContent = '';
    m.classList.add('show');
    this._modalCb = cb;
    setTimeout(() => inp.focus(), 50);
  },
  confirm(title, cb) {
    const m = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    const inp = document.getElementById('modal-input');
    inp.style.display = 'none';
    document.getElementById('modal-err').textContent = '';
    m.classList.add('show');
    this._modalCb = (val) => { cb(); };
    this._isConfirm = true;
  },

  // ---- ACTION ROUTER ----
  act(action, data) {
    SFX.click();
    switch (action) {
      case 'title-continue':
        if (Profile.active()) UI.showMenu();
        else UI.showProfiles();
        break;
      case 'title-profiles':
        UI.showProfiles();
        break;
      case 'back-title':
        UI.showTitle();
        break;
      case 'back-menu':
        UI.showMenu();
        break;
      case 'back-mode':
        UI.showMode();
        break;
      case 'back-garage':
        UI.showGarage();
        break;
      case 'profile-new':
        UI.prompt('NEW DRIVER NAME', name => {
          try {
            Profile.create(name);
            UI.showMenu();
            UI.toast('DRIVER ' + name.toUpperCase() + ' CREATED');
          } catch (e) {
            UI.toast(e.message);
          }
        });
        break;
      case 'menu-play':
        UI.showMode();
        break;
      case 'menu-garage':
        UI.showGarage();
        break;
      case 'menu-stats':
        UI.showStats();
        break;
      case 'menu-switch':
        UI.showProfiles();
        break;
      case 'mode-select': {
        const m = data;
        if (m === 'gauntlet') UI.showGauntlet();
        else startRun(m);
        break;
      }
      case 'gauntlet-start': {
        const num = data;
        if (Profile.isLevelUnlocked(num)) startRun('gauntlet', num);
        else UI.toast('LOCKED');
        break;
      }
      case 'res-again': {
        const m = Game.mode, lvl = Game.level;
        UI.hideAllScreens();
        startRun(m, lvl);
        break;
      }
      case 'res-next': {
        const next = parseInt(document.getElementById('res-next').dataset.next, 10);
        UI.hideAllScreens();
        startRun('gauntlet', next);
        break;
      }
      case 'modal-cancel':
        UI.modalClose();
        break;
      case 'modal-ok':
        if (this._isConfirm) {
          UI.modalClose();
          this._modalCb && this._modalCb(true);
        } else {
          const v = document.getElementById('modal-input').value;
          UI.modalClose();
          this._modalCb && this._modalCb(v);
        }
        break;
    }
  },

  modalClose() {
    document.getElementById('modal').classList.remove('show');
    document.getElementById('modal-input').style.display = '';
    this._isConfirm = false;
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============================================================
// EVENT DELEGATION FOR DATA-ACT
// ============================================================
document.addEventListener('click', e => {
  ensureAudio();
  const t = e.target.closest('[data-act]');
  if (t) {
    UI.act(t.dataset.act, t.dataset.data);
    return;
  }
  // mode tile
  const mt = e.target.closest('.mode-tile');
  if (mt) { UI.act('mode-select', mt.dataset.mid); return; }
  // gauntlet tile
  const lt = e.target.closest('.level-tile');
  if (lt && !lt.classList.contains('locked')) {
    UI.act('gauntlet-start', parseInt(lt.dataset.level, 10));
    return;
  }
  // garage actions
  const va = e.target.closest('[data-vact]');
  if (va) {
    SFX.click();
    const vid = va.dataset.vid;
    const act = va.dataset.vact;
    if (act === 'buy') {
      if (Profile.unlock(vid)) { UI.toast('UNLOCKED ' + VEHICLE_BY_ID[vid].name); UI.showGarage(); }
      else UI.toast('NOT ENOUGH SCRAP');
    } else if (act === 'select') {
      if (Profile.selectVehicle(vid)) { UI.toast('EQUIPPED ' + VEHICLE_BY_ID[vid].name); UI.showGarage(); }
    } else if (act === 'upgrade') {
      UI.showUpgrade(vid);
    }
    return;
  }
  // upgrade actions
  const ua = e.target.closest('[data-uact]');
  if (ua) {
    SFX.click();
    const vid = UI._upVid;
    const trackId = ua.dataset.track;
    if (Profile.upgrade(vid, trackId)) {
      SFX.levelUp();
      UI.toast('UPGRADED');
      UI.showUpgrade(vid);
    } else UI.toast('NOT ENOUGH SCRAP');
    return;
  }
});

// keyboard support for modal
document.getElementById('modal-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') UI.act('modal-ok');
  if (e.key === 'Escape') UI.act('modal-cancel');
});

// ============================================================
// HINT
// ============================================================
const hintEl = document.getElementById('hint');
let hintShown = false;
function updateHint() {
  if (Game.state === 'playing' && Game.hintTime > 0 && IS_TOUCH) {
    if (!hintShown) { hintEl.classList.add('show'); hintShown = true; }
  } else {
    if (hintShown) { hintEl.classList.remove('show'); hintShown = false; }
  }
}

// ============================================================
// LOOP
// ============================================================
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (Game.state === 'playing') update(dt);
  render();
  updateHint();
  requestAnimationFrame(frame);
}

// ============================================================
// BOOT
// ============================================================
function boot() {
  resize();
  Profile.load();
  // seed decor for menu backdrop
  Game.player = { x: W * 0.5, y: H - 110, w: 42, h: 64, vx: 0 };
  for (let i = 0; i < 36; i++) Game.decor.push(makeDecor(Math.random() * H));
  // first-time -> profiles screen
  if (Profile.list().length === 0) UI.showProfiles();
  else UI.showTitle();
  requestAnimationFrame(frame);

  ['pointerdown','keydown','touchstart'].forEach(ev =>
    document.addEventListener(ev, ensureAudio, { once:false, passive:true })
  );
}
boot();

})();
