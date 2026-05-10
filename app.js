/* MOJAVE RUN — full game
 * v2.0: profiles, garage, upgrades, modes, gauntlet, bosses
 */
(() => {
'use strict';

// ============================================================
// FEATURE DETECT
// ============================================================
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const HAS_COARSE_POINTER = (() => {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches;
  } catch (_) { return false; }
})();
const IS_MOBILE = HAS_COARSE_POINTER || (IS_TOUCH && Math.min(window.innerWidth, window.innerHeight) < 1100);

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
  {
    id: 'sandviper', name: 'SAND VIPER',
    desc: 'Nitro-tuned interceptor. Fast, sharp, unforgiving.',
    cost: 6200,
    base: { maxHp: 85, accel: 2700, maxV: 640, fireRate: 0.12, dmg: 1, guns: 3, bigShot: false },
    color: { body:'#d27b2a', hood:'#8f4418', cab:'#3e1c0b', windshield:'#9fe6ff', glow:'#ffd16f' },
  },
  {
    id: 'ironclad', name: 'IRONCLAD',
    desc: 'Armored convoy breaker. Brutal burst damage.',
    cost: 8800,
    base: { maxHp: 260, accel: 1250, maxV: 340, fireRate: 0.34, dmg: 4, guns: 2, bigShot: true },
    color: { body:'#4c5358', hood:'#31373c', cab:'#181d22', windshield:'#88a8b8', glow:'#ff9d66' },
  },
  {
    id: 'warlordking', name: 'WARLORD KING',
    desc: 'The boss car itself. Full mastery of campaign and gauntlet unlocks this armored war machine.',
    cost: 0,
    masteryUnlock: true,
    base: { maxHp: 320, accel: 1600, maxV: 440, fireRate: 0.20, dmg: 5, guns: 3, bigShot: true },
    color: { body:'#1a1a3a', hood:'#0e0e28', cab:'#060614', windshield:'#ff4040', glow:'#ff2020' },
  },
  {
    id: 'cemeterytank', name: 'CEMETERY TANK',
    desc: 'Death incarnate on treads. Rolls out of the grave and into your enemies. Nothing survives.',
    cost: 100000,
    master: true,
    shape: 'tank',
    base: { maxHp: 650, accel: 900, maxV: 290, fireRate: 0.08, dmg: 9, guns: 2, bigShot: true },
    color: { body:'#1a1a12', hood:'#0d0d08', cab:'#23231a', windshield:'#3a6a3a', glow:'#7aff5a' },
  },
];
const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]));

const COSMETICS = {
  paint: [
    { id:'paint-factory', name:'FACTORY RUST', desc:'Original wasteland steel.', cost:0, color:null },
    { id:'paint-sunfire', name:'SUNFIRE ORANGE', desc:'Hot canyon enamel with brighter headlamps.', cost:250, color:{ body:'#d9822f', hood:'#b4561e', cab:'#3f1b08', windshield:'#b9ecff', glow:'#ffe66d' } },
    { id:'paint-blacktop', name:'BLACKTOP MATTE', desc:'Charcoal bodywork for night road hunters.', cost:600, color:{ body:'#2d3032', hood:'#181b1f', cab:'#0a0c10', windshield:'#86d6ff', glow:'#90f0ff' } },
    { id:'paint-rift', name:'MIDNIGHT RIFT', desc:'Neon violet panels unlocked by Inferno badge.', unlock:{ kind:'achievement', id:'inferno' }, color:{ body:'#37205f', hood:'#251047', cab:'#120820', windshield:'#c99cff', glow:'#f070ff' } },
    { id:'paint-warlord', name:'WARLORD RED', desc:'Boss-slayer crimson with brutal amber lamps.', unlock:{ kind:'achievement', id:'boss_slayer' }, color:{ body:'#7f1d1d', hood:'#4f1010', cab:'#1a0707', windshield:'#ffb38a', glow:'#ff8a3d' } },
  ],
  trail: [
    { id:'trail-dust', name:'DUST PLUME', desc:'Classic brown exhaust smoke.', cost:0, colors:['rgba(120,90,60,0.5)'], flameColors:[[255,220,80],[255,115,25]], size:5, speed:50, life:0.45 },
    { id:'trail-neon', name:'NEON WAKE', desc:'Blue reactor vapor that pops in night runs.', cost:350, colors:['rgba(80,220,255,0.62)','rgba(160,120,255,0.5)'], flameColors:[[80,220,255],[160,120,255]], size:4, speed:70, life:0.5 },
    { id:'trail-sparks', name:'SPARK SHOWER', desc:'Hot chrome fragments from overloaded pipes.', cost:650, colors:['rgba(255,210,80,0.85)','rgba(255,120,40,0.7)'], flameColors:[[255,210,80],[255,120,40]], size:3, speed:95, life:0.38 },
    { id:'trail-ghost', name:'GHOST LINE', desc:'Spectral exhaust for proven pathfinders.', unlock:{ kind:'achievement', id:'pathfinder' }, colors:['rgba(170,240,255,0.45)','rgba(210,255,240,0.35)'], flameColors:[[170,240,255],[210,255,240]], size:6, speed:55, life:0.62 },
  ],
  horn: [
    { id:'horn-classic', name:'RUST HORN', desc:'The original busted relay chirp.', cost:0, sfx:'click' },
    { id:'horn-warcry', name:'WAR CRY', desc:'A harsher launch bark for arena show-offs.', cost:300, sfx:'combo' },
    { id:'horn-raider', name:'RAIDER SIREN', desc:'Boss Rush clears unlock this intimidation blast.', unlock:{ kind:'achievement', id:'boss_slayer' }, sfx:'boss' },
    { id:'horn-ghost', name:'PIRATE RADIO', desc:'Hidden station static for campaign pathfinders.', unlock:{ kind:'achievement', id:'pathfinder' }, sfx:'pickup' },
  ],
};
const COSMETIC_CATEGORIES = ['paint', 'trail', 'horn'];
const COSMETIC_LABELS = { paint:'PAINTJOB', trail:'EXHAUST TRAIL', horn:'SPAWN HORN' };
const DEFAULT_PAINT_COLOR = { body:'#a86a2e', hood:'#8a4f1f', cab:'#3a2410', windshield:'#a8d8e8', glow:'#ffe07a' };
const COSMETIC_BY_ID = Object.fromEntries(COSMETIC_CATEGORIES.flatMap(cat => COSMETICS[cat].map(c => [c.id, Object.assign({ category: cat }, c)])));
const COSMETIC_ALIASES = { 'paint-stock': 'paint-factory' };

function canonicalCosmeticId(id) {
  return COSMETIC_ALIASES[id] || id;
}

function defaultCosmetics() {
  return {
    owned: ['paint-factory', 'trail-dust', 'horn-classic'],
    equippedPaint: 'paint-factory',
    equippedTrail: 'trail-dust',
    equippedHorn: 'horn-classic',
  };
}

function normalizeCosmetics(p, returnChanged = false) {
  const d = defaultCosmetics();
  let changed = false;
  if (!p.cosmetics || typeof p.cosmetics !== 'object') { p.cosmetics = d; changed = true; }
  if (!Array.isArray(p.cosmetics.owned)) { p.cosmetics.owned = []; changed = true; }
  const previousOwnedLength = p.cosmetics.owned.length;
  const ownedSet = new Set();
  p.cosmetics.owned.forEach(rawId => {
    const id = canonicalCosmeticId(rawId);
    if (COSMETIC_BY_ID[id]) ownedSet.add(id);
    if (id !== rawId) changed = true;
  });
  if (ownedSet.size !== previousOwnedLength) changed = true;
  for (const id of d.owned) {
    if (!ownedSet.has(id)) { ownedSet.add(id); changed = true; }
  }
  p.cosmetics.owned = Array.from(ownedSet);
  const normalizeEquipped = (key, fallback) => {
    const id = canonicalCosmeticId(p.cosmetics[key]);
    if (id !== p.cosmetics[key]) changed = true;
    if (!COSMETIC_BY_ID[id] || !ownedSet.has(id)) {
      p.cosmetics[key] = fallback;
      changed = true;
    } else {
      p.cosmetics[key] = id;
    }
  };
  normalizeEquipped('equippedPaint', d.equippedPaint);
  normalizeEquipped('equippedTrail', d.equippedTrail);
  normalizeEquipped('equippedHorn', d.equippedHorn);
  return returnChanged ? changed : p.cosmetics;
}

function cosmeticBuyLabel(c, unlockedByCondition) {
  if (!unlockedByCondition) return 'LOCKED';
  const cost = c.cost || 0;
  return cost > 0 ? `UNLOCK · ${cost} SCRAP` : 'CLAIM FREE';
}

function cosmeticUnlockText(c) {
  if (!c.unlock) return c.cost ? `${c.cost} SCRAP` : 'FREE';
  if (c.unlock.kind === 'achievement') {
    const a = ACHIEVEMENT_BY_ID[c.unlock.id];
    return 'BADGE: ' + (a ? a.name : c.unlock.id).toUpperCase();
  }
  return 'LOCKED';
}

function isCosmeticConditionMet(c, p) {
  if (!c.unlock) return true;
  if (c.unlock.kind === 'achievement') return !!(p.achievements || []).includes(c.unlock.id);
  return false;
}

function getVehiclePaint(vehicle, paintId) {
  const paint = COSMETIC_BY_ID[canonicalCosmeticId(paintId || 'paint-factory')];
  if (!paint || paint.category !== 'paint' || !paint.color) return vehicle.color;
  return Object.assign({}, vehicle.color, paint.color);
}

function getTrailDef(trailId) {
  return COSMETIC_BY_ID[trailId || 'trail-dust'] || COSMETIC_BY_ID['trail-dust'];
}

function cosmeticSwatchStyle(c) {
  if (c.category === 'paint') {
    const col = c.color || DEFAULT_PAINT_COLOR;
    return `linear-gradient(90deg, ${col.body}, ${col.hood}, ${col.cab}, ${col.glow})`;
  }
  if (c.category === 'trail') return `linear-gradient(90deg, ${c.colors.join(', ')})`;
  return 'linear-gradient(90deg, #1a0f08, #f5d76e, #ff8a3d)';
}

function cloneCosmeticsState(cosmetics) {
  const d = defaultCosmetics();
  const src = cosmetics || d;
  return {
    owned: Array.isArray(src.owned) ? src.owned.slice() : d.owned.slice(),
    equippedPaint: src.equippedPaint || d.equippedPaint,
    equippedTrail: src.equippedTrail || d.equippedTrail,
    equippedHorn: src.equippedHorn || d.equippedHorn,
  };
}

const VEHICLE_BRANCHES = {
  rustbucket: [
    {
      id: 'scrapper',
      name: 'SCRAPPER',
      desc: 'Salvage-tuned guns. Better economy and steadier fire.',
      unlockTotal: 8,
      statMods: { fireRate: 0.90, dmg: 1.08 },
      effects: { scrapMul: 1.15, pickupScoreMul: 1.20 },
    },
    {
      id: 'bulwark',
      name: 'BULWARK',
      desc: 'Armor-first setup. More hull with lighter incoming damage.',
      unlockTotal: 8,
      statMods: { maxHp: 1.20, maxV: 0.94 },
      effects: { damageTakenMul: 0.88 },
    },
  ],
  junker: [
    {
      id: 'hauler',
      name: 'HAULER',
      desc: 'Heavy scavenger rig. Extra scrap with pickup pull.',
      unlockTotal: 8,
      statMods: { maxHp: 1.15, accel: 0.95 },
      effects: { scrapMul: 1.22, pickupRadius: 60 },
    },
    {
      id: 'crusher',
      name: 'CRUSHER',
      desc: 'Close-range bruiser. Bigger shells and stronger contact pressure.',
      unlockTotal: 8,
      statMods: { dmg: 1.18, fireRate: 0.95 },
      effects: { contactDamageMul: 1.35, damageTakenMul: 0.92 },
    },
  ],
  roadrunner: [
    {
      id: 'interceptor',
      name: 'INTERCEPTOR',
      desc: 'Pure speed line. Faster top end and sharper crit bursts.',
      unlockTotal: 8,
      statMods: { accel: 1.14, maxV: 1.10 },
      effects: { critChance: 0.12, critMul: 1.8 },
    },
    {
      id: 'raider',
      name: 'RAIDER',
      desc: 'Aggressive skirmisher. Better pickups, better kill score.',
      unlockTotal: 8,
      statMods: { fireRate: 0.92, dmg: 1.05 },
      effects: { pickupRadius: 90, killScoreMul: 1.12 },
    },
  ],
  goliath: [
    {
      id: 'siege',
      name: 'SIEGE',
      desc: 'Boss-breaking cannon package with heavier direct hits.',
      unlockTotal: 8,
      statMods: { dmg: 1.22, fireRate: 0.94 },
      effects: { bossDamageMul: 1.22 },
    },
    {
      id: 'bastion',
      name: 'BASTION',
      desc: 'Fortress conversion. Thick hull and reduced incoming damage.',
      unlockTotal: 8,
      statMods: { maxHp: 1.24, maxV: 0.92 },
      effects: { damageTakenMul: 0.84 },
    },
  ],
  phantom: [
    {
      id: 'specter',
      name: 'SPECTER',
      desc: 'High-risk burst. Faster shots with stronger crit chance.',
      unlockTotal: 8,
      statMods: { fireRate: 0.86, dmg: 1.06 },
      effects: { critChance: 0.16, critMul: 1.9 },
    },
    {
      id: 'ghostline',
      name: 'GHOSTLINE',
      desc: 'Momentum build. Faster pickup control and lighter damage intake.',
      unlockTotal: 8,
      statMods: { accel: 1.08, maxV: 1.04 },
      effects: { pickupRadius: 100, damageTakenMul: 0.90 },
    },
  ],
  sandviper: [
    {
      id: 'sunlance',
      name: 'SUNLANCE',
      desc: 'Nitro addict. More speed and harder boost-fueled kills.',
      unlockTotal: 8,
      statMods: { accel: 1.10, maxV: 1.08 },
      effects: { nitroDamageMul: 1.35, critChance: 0.08, critMul: 1.7 },
    },
    {
      id: 'dustfox',
      name: 'DUST FOX',
      desc: 'Fast looter. Wider pickup reach with bonus score conversion.',
      unlockTotal: 8,
      statMods: { fireRate: 0.94, dmg: 1.04 },
      effects: { pickupRadius: 110, pickupScoreMul: 1.25, scrapMul: 1.12 },
    },
  ],
  ironclad: [
    {
      id: 'juggernaut',
      name: 'JUGGERNAUT',
      desc: 'Rolling bunker. More hull with punishing contact pressure.',
      unlockTotal: 8,
      statMods: { maxHp: 1.22, dmg: 1.10, maxV: 0.92 },
      effects: { damageTakenMul: 0.82, contactDamageMul: 1.45 },
    },
    {
      id: 'arsenal',
      name: 'ARSENAL',
      desc: 'Ordnance platform. Stronger bursts and better boss damage.',
      unlockTotal: 8,
      statMods: { fireRate: 0.92, dmg: 1.14 },
      effects: { bossDamageMul: 1.18, critChance: 0.08, critMul: 1.7 },
    },
  ],
  warlordking: [
    {
      id: 'warcrown',
      name: 'WAR CROWN',
      desc: 'Throne weaponry. Heavier hits and devastating boss damage.',
      unlockTotal: 8,
      statMods: { dmg: 1.25, fireRate: 0.88 },
      effects: { bossDamageMul: 1.30, critChance: 0.12, critMul: 2.0 },
    },
    {
      id: 'ironfortress',
      name: 'IRON FORTRESS',
      desc: 'Bulletproof shell. More hull and greatly reduced incoming damage.',
      unlockTotal: 8,
      statMods: { maxHp: 1.30, maxV: 0.90 },
      effects: { damageTakenMul: 0.75, contactDamageMul: 1.50 },
    },
  ],
  cemeterytank: [
    {
      id: 'gravedigger',
      name: 'GRAVEDIGGER',
      desc: 'Digs deeper graves. Boosted hull and crushing contact damage.',
      unlockTotal: 10,
      statMods: { maxHp: 1.30, dmg: 1.12 },
      effects: { damageTakenMul: 0.75, contactDamageMul: 1.60 },
    },
    {
      id: 'reaper',
      name: 'REAPER',
      desc: 'Death cannon overclocked. Obliterates bosses and crits harder.',
      unlockTotal: 10,
      statMods: { fireRate: 0.88, dmg: 1.20 },
      effects: { bossDamageMul: 1.35, critChance: 0.20, critMul: 2.2 },
    },
  ],
};

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
  {
    id: 'reactor', name: 'REACTOR',
    desc: 'Overclocked payload output. More damage.',
    apply: (st, tier) => {
      const m = [1, 1.08, 1.16, 1.26, 1.38, 1.52][tier];
      st.dmg *= m;
    },
    tiers: [250, 500, 950, 1800, 3200],
  },
];

function totalUpgradeTiers(ups) {
  return Object.values(ups || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
}

function getVehicleBranches(vehicleId) {
  return VEHICLE_BRANCHES[vehicleId] || [];
}

function getVehicleBranchDef(vehicleId, branchId) {
  return getVehicleBranches(vehicleId).find(b => b.id === branchId) || null;
}

function applyVehicleBranchStats(st, branchDef) {
  if (!branchDef || !branchDef.statMods) return;
  const m = branchDef.statMods;
  if (typeof m.maxHp === 'number') st.maxHp *= m.maxHp;
  if (typeof m.accel === 'number') st.accel *= m.accel;
  if (typeof m.maxV === 'number') st.maxV *= m.maxV;
  if (typeof m.fireRate === 'number') st.fireRate *= m.fireRate;
  if (typeof m.dmg === 'number') st.dmg *= m.dmg;
  if (typeof m.gunsAdd === 'number') st.guns += m.gunsAdd;
}

const MODES = [
  { id: 'classic',    name: 'CLASSIC',     desc: 'Endless run. Survive as long as you can. Difficulty climbs forever.' },
  { id: 'campaign',   name: 'CAMPAIGN',    desc: 'Drive coast to coast. 18 US locations, 72 levels, story, bosses & sidekicks.' },
  { id: 'gauntlet',   name: 'GAUNTLET',    desc: '18 tiered sectors. Clear objectives. Multi-biome bosses every 4-6 levels.' },
  { id: 'timeattack', name: 'TIME ATTACK', desc: '60 seconds. Frenzy spawns. Highest score wins.' },
  { id: 'daily',      name: 'DAILY CHALLENGE', desc: 'Seeded run. Same world for everyone today. Share your score.' },
  { id: 'bossrush',   name: 'BOSS RUSH',   desc: 'Five boss tiers back-to-back. Clear the convoy gauntlet without stopping.' },
  { id: 'zombie',      name: 'ZOMBIE HORDE',     desc: 'The dead walk the Mojave. No bullets — just claws, teeth, and numbers. Survive the endless shamble.' },
  { id: 'ironthrone',  name: 'IRON THRONE',      desc: 'Full mastery unlocks the boss campaign. Eight Warlords with different weapons and armored rigs. No survivors.' },
];

// Zombie enemy definitions for ZOMBIE HORDE mode
const ZOMBIE_DEFS = [
  { id:'walker',  w:20, h:30, hp:3, vy:50,  vxRange:18, contact:12, score:80,  color:'#3a4a28', goreColor:'#2a3a18', accent:'#1a1a10' },
  { id:'runner',  w:16, h:26, hp:1, vy:110, vxRange:40, contact:8,  score:120, color:'#2a3a1c', goreColor:'#1a2a0e', accent:'#141410' },
  { id:'bruiser', w:32, h:38, hp:7, vy:30,  vxRange:8,  contact:22, score:220, color:'#4a3828', goreColor:'#3a2818', accent:'#1a1210' },
];

// ============================================================
// IRON THRONE — 8-stage boss campaign (unlocked by full mastery)
// Each stage is a unique boss car with a named weapon loadout
// and a distinct fire pattern. diff scales with stage number.
// ============================================================
const IRON_THRONE_STAGES = [
  { num:1, name:'THE IRON HERALD',  weapon:'SPREAD CANNONS',    hp:140,  w:88,  h:108, color:'#7a1818', pattern:'spread',    fireRate:1.0,  dmg:14, contactDmg:28, twin:false, map:'wastes',    night:false, storm:false, diff:3.5, reward:600,  story:'The Herald guards the first gate. He has never lost a road fight. He has never faced you.' },
  { num:2, name:'THE TWIN WRAITHS', weapon:'TWIN SEEKERS',      hp:230,  w:72,  h:92,  color:'#aa1838', pattern:'aimed',     fireRate:0.58, dmg:16, contactDmg:32, twin:true,  map:'saltflats', night:false, storm:false, diff:4.0, reward:800,  story:'They hunt in pairs. Two cars, two minds, one kill streak. Split their fire — or be halved.' },
  { num:3, name:'THE HELLBRINGER',  weapon:'HELLFIRE LAUNCHERS',hp:340,  w:112, h:132, color:'#8a1848', pattern:'hellfire',  fireRate:0.40, dmg:18, contactDmg:38, twin:false, map:'redcanyon', night:false, storm:true,  diff:4.5, reward:1000, story:'The canyons remember every volley she has fired. The rocks are still warm from the last one.' },
  { num:4, name:'THE LANCE WARDEN', weapon:'RAIL LANCE',        hp:480,  w:122, h:142, color:'#184888', pattern:'lance',     fireRate:0.34, dmg:22, contactDmg:45, twin:false, map:'ash',       night:true,  storm:false, diff:5.0, reward:1200, story:'He invented the rail lance. He has had years to perfect it. You have seconds to survive it.' },
  { num:5, name:'THE MAELSTROM',    weapon:'CHAOS MORTARS',     hp:640,  w:130, h:150, color:'#383898', pattern:'maelstrom', fireRate:0.27, dmg:26, contactDmg:52, twin:true,  map:'midnight',  night:true,  storm:true,  diff:5.5, reward:1500, story:'Two rigs, twelve mortars, no pattern. The Maelstrom does not aim — it fills the sky.' },
  { num:6, name:'THE PHANTOM CZAR', weapon:'GHOST CANNONS',     hp:820,  w:132, h:152, color:'#28186a', pattern:'phantom',   fireRate:0.22, dmg:28, contactDmg:56, twin:false, map:'midnight',  night:true,  storm:false, diff:6.0, reward:1800, story:'Faster than anything you have outrun. His ghost cannons fire where you are going, not where you are.' },
  { num:7, name:'THE WAR MACHINE',  weapon:'SIEGE CANNON',      hp:1050, w:142, h:162, color:'#3a1808', pattern:'cannon',    fireRate:0.50, dmg:42, contactDmg:64, twin:false, map:'ash',       night:true,  storm:true,  diff:6.5, reward:2200, story:'The siege cannon takes a full second to charge. In that second it can punch through a convoy wall. Or you.' },
  { num:8, name:'THE IRON THRONE',  weapon:'THRONE ARRAY',      hp:1400, w:152, h:168, color:'#1a0818', pattern:'throne',    fireRate:0.19, dmg:34, contactDmg:72, twin:true,  map:'midnight',  night:true,  storm:true,  diff:7.5, reward:3600, story:'Everything the wasteland could forge. Every weapon ever mounted on a war rig, loaded and aimed at you. This is the end.' },
];

// Story chapters shown during classic mode as milestones
const STORY_CHAPTERS = [
  { distance: 0,     title: 'THE LAST ROAD',    text: 'The Mojave never forgave anyone who stopped moving. You keep driving.' },
  { distance: 2000,  title: 'PAST THE WIRE',    text: 'The old checkpoints are gone. Past here the law gave up. You didn\'t.' },
  { distance: 5000,  title: 'DEAD RECKONING',   text: 'Fuel\'s getting low but the raiders are thicker. Kill more. Take theirs.' },
  { distance: 9000,  title: 'THE HOLLOW MILES', text: 'Three hundred kilometers of nothing but heat and the dead. You\'ve driven every one.' },
  { distance: 14000, title: 'VOID REACH',        text: 'No signal. No signs. Just the engine and whatever comes over the hill.' },
  { distance: 20000, title: 'LEGEND',            text: 'They\'ll carve your name on the mile markers. If anyone\'s left to do the carving.' },
];

// 18 gauntlet levels. obj: 'survive' (seconds), 'kills' (count), 'distance' (meters), 'boss' (boss tier)
const LEVELS = [
  { num:1,  name:'OUTSKIRTS',       obj:'survive',  target:30,   reward:75,   diff:1.0,  map:'wastes',    story:'The highway out of the settlement is already burning. You don\'t look back.' },
  { num:2,  name:'BROKEN HIGHWAY',  obj:'kills',    target:8,    reward:100,  diff:1.1,  map:'wastes',    story:'Raider scouts have been tracking your dust trail for two days. Time to thin the pack.' },
  { num:3,  name:'DUST FIELDS',     obj:'distance', target:1500, reward:125,  diff:1.2,  map:'wastes',    story:'The flats stretch forever. Nothing to do but drive and let the engine decide who lives.' },
  { num:4,  name:'ALPHA RAIDER',    obj:'boss',     target:1,    reward:300,  diff:1.4,  boss:1, map:'wastes',    story:'They say the Alpha Raider controls every pass west of the ridge. They say wrong.' },
  { num:5,  name:'SCORCHED FLATS',  obj:'survive',  target:45,   reward:175,  diff:1.5,  map:'saltflats', story:'Salt and bone. The Scorched Flats have swallowed whole convoys. You keep your foot down.' },
  { num:6,  name:'CANYON RUN',      obj:'kills',    target:14,   reward:225,  diff:1.7,  map:'saltflats', story:'Canyon walls funnel traffic into kill zones. The gangs know this. Now so do you.' },
  { num:7,  name:'THE BONEYARD',    obj:'distance', target:2500, reward:275,  diff:1.9,  map:'saltflats', story:'Thousands of rusted hulks mark the miles. You navigate the maze they left behind.' },
  { num:8,  name:'TWIN DEMONS',     obj:'boss',     target:1,    reward:500,  diff:2.1,  boss:2, map:'saltflats', story:'The Twin Demons operate in sync — no one survives taking both on. Until now.' },
  { num:9,  name:'NIGHT WATCH',     obj:'survive',  target:60,   reward:325,  diff:2.3,  map:'ash', night:true,  story:'In the ash sector darkness is their weapon. Your headlights make you a target. Drive anyway.' },
  { num:10, name:'STORM FRONT',     obj:'kills',    target:22,   reward:425,  diff:2.6,  map:'ash', storm:true,  story:'The storm rolled in off the Deadlands. The raiders use it for cover. So will you.' },
  { num:11, name:'DEAD ZONE',       obj:'distance', target:3500, reward:550,  diff:3.0,  map:'ash', night:true, storm:true, story:'Forty kilometers of dead air and dead men. Your radio went silent three sectors back. Keep driving.' },
  { num:12, name:'THE OVERLORD',    obj:'boss',     target:1,    reward:1500, diff:3.5,  boss:3, map:'ash', night:true, story:'The Overlord hasn\'t lost a road fight in six years. The highway is watching.' },
  { num:13, name:'SUNSCAR BASIN',   obj:'survive',  target:70,   reward:650,  diff:3.7,  map:'redcanyon', storm:true, story:'The Basin burns red at noon and blood-black by dusk. The canyon walls trap sound. And screaming.' },
  { num:14, name:'IRON SPINE',      obj:'kills',    target:30,   reward:760,  diff:4.0,  map:'redcanyon', night:true, story:'The Iron Spine corridor: a hundred kilometers of ambush points. You stop counting kills.' },
  { num:15, name:'RAVEN CHASM',     obj:'distance', target:4600, reward:900,  diff:4.4,  map:'redcanyon', night:true, storm:true, story:'The Chasm drops four hundred meters on both sides. One slip and even the ravens won\'t find you.' },
  { num:16, name:'WARLORD TITAN',   obj:'boss',     target:1,    reward:1900, diff:4.8,  boss:4, map:'redcanyon', storm:true, story:'The Titan commands three hundred fighters and seventeen armored vehicles. He commands them from the front.' },
  { num:17, name:'VOID MILE',       obj:'survive',  target:85,   reward:1150, diff:5.2,  map:'midnight', night:true, storm:true, story:'The Void Mile. No maps. No signals. The last driver who came through left their boots on the median.' },
  { num:18, name:'THE CHIMERA',     obj:'boss',     target:1,    reward:3000, diff:6.0,  boss:5, map:'midnight', night:true, storm:true, story:'Endpoint. The Chimera is what the Mojave dreamed up when it got tired of killing people slowly.' },
  // BOSS HORDE LEVELS — survive a 30–60s wall of mixed enemies and zombies
  // while siege mode is active (super-laser + miniguns). Horde-clearer
  // nukes drop periodically. Two of them to round the gauntlet out.
  { num:19, name:'SCRAP STORM',     obj:'horde',    target:35,   reward:2200, diff:3.0,  map:'wastes',    story:'A signal flare drops the entire wasteland on top of you. Salvage every gun you ever pulled — you\'ll need them all at once.' },
  { num:20, name:'DEAD TIDE',       obj:'horde',    target:50,   reward:3200, diff:5.0,  map:'midnight', night:true, storm:true, story:'Every raider, every drone, every walking corpse from here to the coast. Siege mode active. Drive into the meatgrinder.' },
];
// Gauntlet sectors are the 18 tiered sectors (nums 1-18); levels 19-20 are boss horde levels, not sectors.
const GAUNTLET_SECTORS = LEVELS.filter(L => L.obj !== 'horde');

// ============================================================
// CAMPAIGN — US road-trip story mode (LA → New York, 18 locations)
// Each location has 4 levels: 3 objective tiers + 1 boss.
// mapPos: [x, y] in the 300×185 SVG coordinate space.
// ============================================================
const CAMPAIGN_LOCATIONS = [
  {
    id:'la', name:'LA OUTSKIRTS', state:'CALIFORNIA', biome:'wastes', reward:400,
    sidekickUnlock:null, mapPos:[30,128],
    intro:'The city burns in the rearview. The highway stretches east — broken and beautiful.',
    outro:'LA fades to dust. The Mojave waits ahead, vast and indifferent.',
    levels:[
      {num:1,name:'FREEWAY ZERO',  obj:'survive', target:30,  diff:1.0,reward:75},
      {num:2,name:'JUNCTION BLAZE',obj:'kills',   target:8,   diff:1.1,reward:100},
      {num:3,name:'SMOG CORRIDOR', obj:'distance',target:1200,diff:1.2,reward:125},
      {num:4,name:'THE WARDEN',    obj:'boss',    target:1,   diff:1.4,reward:300,boss:1},
    ],
  },
  {
    id:'mojave', name:'MOJAVE DESERT', state:'CALIFORNIA', biome:'wastes', reward:480,
    sidekickUnlock:null, mapPos:[52,118],
    intro:'Flat. Burning. The road shimmers. Raiders haunt the Joshua trees.',
    outro:'The Mojave is behind you. You survived the most honest desert in America.',
    levels:[
      {num:1,name:'DEAD CHANNEL',  obj:'survive', target:35,  diff:1.2,reward:100},
      {num:2,name:'BUZZARD ALLEY', obj:'kills',   target:10,  diff:1.3,reward:130},
      {num:3,name:'HEAT GRAVE',    obj:'distance',target:1500,diff:1.4,reward:160},
      {num:4,name:'DUST KING',     obj:'boss',    target:1,   diff:1.6,reward:350,boss:1},
    ],
  },
  {
    id:'vegas', name:'LAS VEGAS STRIP', state:'NEVADA', biome:'midnight', reward:560,
    sidekickUnlock:null, mapPos:[65,103],
    intro:'Dead neon, shattered casinos. The Strip runs on generator fumes and old debts.',
    outro:'Vegas paid out in scrap and blood. The desert highway continues east.',
    levels:[
      {num:1,name:'STRIP RAID',    obj:'survive', target:35,  diff:1.4,reward:120,night:true},
      {num:2,name:'NEON GRAVEYARD',obj:'kills',   target:12,  diff:1.5,reward:160,night:true},
      {num:3,name:'CASINO ROW',    obj:'distance',target:1800,diff:1.6,reward:190,night:true},
      {num:4,name:'THE HOUSE',     obj:'boss',    target:1,   diff:1.8,reward:400,boss:2,night:true},
    ],
  },
  {
    id:'hoover', name:'HOOVER DAM', state:'NEVADA/ARIZONA', biome:'redcanyon', reward:640,
    sidekickUnlock:'diesel', mapPos:[78,114],
    intro:'The dam still holds. So do the gangs that claimed it. Cross if you can.',
    outro:'The dam falls behind. DIESEL joins your crew — a grease-stained guardian angel.',
    levels:[
      {num:1,name:'DAM APPROACH',  obj:'survive', target:40,  diff:1.7,reward:150},
      {num:2,name:'SPILLWAY',      obj:'kills',   target:14,  diff:1.8,reward:190},
      {num:3,name:'POWERLINE RUN', obj:'distance',target:2000,diff:2.0,reward:230},
      {num:4,name:'GATE KEEPER',   obj:'boss',    target:1,   diff:2.2,reward:480,boss:2},
    ],
  },
  {
    id:'arizona', name:'ARIZONA BADLANDS', state:'ARIZONA', biome:'redcanyon', reward:700,
    sidekickUnlock:null, mapPos:[95,130],
    intro:'Red rock and red blood. The canyon roads were built for ambush.',
    outro:'Arizona bleeds into New Mexico. The elevation climbs. So does the danger.',
    levels:[
      {num:1,name:'SAGUARO MILE',  obj:'survive', target:40,  diff:2.0,reward:175},
      {num:2,name:'CANYON CRAWL',  obj:'kills',   target:16,  diff:2.1,reward:220},
      {num:3,name:'RED RIDGE',     obj:'distance',target:2400,diff:2.3,reward:265},
      {num:4,name:'CRIMSON TITAN', obj:'boss',    target:1,   diff:2.5,reward:560,boss:3},
      {num:5,name:'CANYON HORDE',  obj:'horde',   target:30,  diff:2.6,reward:780},
    ],
  },
  {
    id:'santafe', name:'SANTA FE', state:'NEW MEXICO', biome:'ash', reward:760,
    sidekickUnlock:null, mapPos:[115,122],
    intro:'Ancient walls, new war. The high desert hides its killers in the cold.',
    outro:'Santa Fe endures. You leave richer in scrap and shorter on patience.',
    levels:[
      {num:1,name:'PLAZA SIEGE',   obj:'survive', target:45,  diff:2.2,reward:200},
      {num:2,name:'ARROYO DRIVE',  obj:'kills',   target:18,  diff:2.4,reward:250},
      {num:3,name:'HIGH ROAD',     obj:'distance',target:2800,diff:2.6,reward:290},
      {num:4,name:'THE ELDER',     obj:'boss',    target:1,   diff:2.8,reward:640,boss:3},
    ],
  },
  {
    id:'amarillo', name:'AMARILLO FLATLANDS', state:'TEXAS', biome:'saltflats', reward:820,
    sidekickUnlock:null, mapPos:[140,118],
    intro:'Flat as a grave, twice as quiet. Speed is your only armor on the Texas plain.',
    outro:'The panhandle fades. Oklahoma lies ahead — just as flat, twice as hostile.',
    levels:[
      {num:1,name:'CATTLE RUN',    obj:'survive', target:45,  diff:2.5,reward:220},
      {num:2,name:'TUMBLEWEED WAR',obj:'kills',   target:20,  diff:2.7,reward:270},
      {num:3,name:'PANHANDLE PUSH',obj:'distance',target:3200,diff:2.9,reward:320},
      {num:4,name:'LONGHORN',      obj:'boss',    target:1,   diff:3.1,reward:700,boss:3},
    ],
  },
  {
    id:'okc', name:'OKLAHOMA CITY', state:'OKLAHOMA', biome:'saltflats', reward:880,
    sidekickUnlock:'ratchet', mapPos:[162,110],
    intro:'The oil fields burned. What\'s left runs on fury and cheap metal.',
    outro:'Oklahoma breaks. RATCHET hops in — extra firepower for the road ahead.',
    levels:[
      {num:1,name:'OIL BELT',      obj:'survive', target:50,  diff:2.8,reward:250,storm:true},
      {num:2,name:'TURNPIKE TRAP', obj:'kills',   target:22,  diff:3.0,reward:300,storm:true},
      {num:3,name:'FLINT HILLS',   obj:'distance',target:3600,diff:3.2,reward:360},
      {num:4,name:'IRON GOVERNOR', obj:'boss',    target:1,   diff:3.5,reward:800,boss:4,storm:true},
    ],
  },
  {
    id:'stlouis', name:'ST. LOUIS BRIDGE', state:'MISSOURI', biome:'wastes', reward:940,
    sidekickUnlock:null, mapPos:[193,100],
    intro:'The arch fell years ago. The river crossing is a kill zone now.',
    outro:'The bridge holds — barely. You cross the Mississippi into the eastern theater.',
    levels:[
      {num:1,name:'RIVER APPROACH',obj:'survive', target:50,  diff:3.0,reward:280},
      {num:2,name:'BRIDGE GUARD',  obj:'kills',   target:24,  diff:3.2,reward:330},
      {num:3,name:'LEVEE BREAK',   obj:'distance',target:4000,diff:3.4,reward:390},
      {num:4,name:'ARCH BREAKER',  obj:'boss',    target:1,   diff:3.7,reward:880,boss:4},
    ],
  },
  {
    id:'memphis', name:'MEMPHIS BLUES', state:'TENNESSEE', biome:'ash', reward:1000,
    sidekickUnlock:null, mapPos:[205,118],
    intro:'The Delta runs south. The highway runs through it, knee-deep in ash and old music.',
    outro:'Memphis goes quiet behind you. You carry its scrap and its scars.',
    levels:[
      {num:1,name:'DELTA HEAT',    obj:'survive', target:55,  diff:3.2,reward:310,night:true},
      {num:2,name:'BLUFF CITY RUN',obj:'kills',   target:26,  diff:3.4,reward:360,night:true},
      {num:3,name:'BEALE STREET',  obj:'distance',target:4400,diff:3.6,reward:420},
      {num:4,name:'BIG MUDDY',     obj:'boss',    target:1,   diff:3.9,reward:960,boss:4,night:true},
    ],
  },
  {
    id:'nashville', name:'NASHVILLE CROSSROADS', state:'TENNESSEE', biome:'ash', reward:1060,
    sidekickUnlock:null, mapPos:[217,108],
    intro:'Music Row is a weapons market now. The bands play for bullets.',
    outro:'Nashville\'s song changes every season. Yours is still "drive or die."',
    levels:[
      {num:1,name:'BROADWAY BLITZ', obj:'survive', target:55,  diff:3.5,reward:340},
      {num:2,name:'COUNTRY ROAD',   obj:'kills',   target:28,  diff:3.7,reward:390},
      {num:3,name:'CUMBERLAND RUN', obj:'distance',target:4800,diff:4.0,reward:460},
      {num:4,name:'GRAND OLE WRATH',obj:'boss',    target:1,   diff:4.2,reward:1020,boss:5},
    ],
  },
  {
    id:'atlanta', name:'ATLANTA RUINS', state:'GEORGIA', biome:'redcanyon', reward:1120,
    sidekickUnlock:'mirage', mapPos:[225,130],
    intro:'The city of the phoenix — burned again, risen as something worse.',
    outro:'Atlanta falls behind in embers. MIRAGE slips into the passenger seat — silent, useful.',
    levels:[
      {num:1,name:'PEACH GRIDLOCK',obj:'survive', target:60,  diff:3.8,reward:380,storm:true},
      {num:2,name:'PONCE AMBUSH',  obj:'kills',   target:30,  diff:4.0,reward:440,storm:true},
      {num:3,name:'95 NORTH',      obj:'distance',target:5200,diff:4.3,reward:510},
      {num:4,name:'RED DOG',       obj:'boss',    target:1,   diff:4.6,reward:1080,boss:5,storm:true},
    ],
  },
  {
    id:'charlotte', name:'CHARLOTTE PINES', state:'NORTH CAROLINA', biome:'wastes', reward:1180,
    sidekickUnlock:null, mapPos:[240,118],
    intro:'The pines close in. The racing gangs of Charlotte call this home.',
    outro:'Charlotte behind you. The eastern seaboard is close. So is the end.',
    levels:[
      {num:1,name:'SPEEDWAY SIEGE', obj:'survive', target:60,  diff:4.0,reward:420},
      {num:2,name:'PIEDMONT PUSH',  obj:'kills',   target:32,  diff:4.2,reward:480},
      {num:3,name:'CROSSING RIDGE', obj:'distance',target:5600,diff:4.5,reward:550},
      {num:4,name:'NASCAR REAPER',  obj:'boss',    target:1,   diff:4.8,reward:1140,boss:5},
    ],
  },
  {
    id:'richmond', name:'RICHMOND WALL', state:'VIRGINIA', biome:'midnight', reward:1240,
    sidekickUnlock:null, mapPos:[255,100],
    intro:'Richmond built its wall before the war ended. They never finished it.',
    outro:'The wall is behind you. DC is close — and DC is the worst of all.',
    levels:[
      {num:1,name:'WALL PATROL',   obj:'survive', target:65,  diff:4.3,reward:460,night:true},
      {num:2,name:'TOBACCO ROW',   obj:'kills',   target:34,  diff:4.5,reward:520,night:true},
      {num:3,name:'CAPITAL TRAIL', obj:'distance',target:6000,diff:4.8,reward:600,night:true},
      {num:4,name:'IRON CURTAIN',  obj:'boss',    target:1,   diff:5.1,reward:1200,boss:5,night:true},
    ],
  },
  {
    id:'dc', name:'DC NO-MAN\'S LAND', state:'DISTRICT OF COLUMBIA', biome:'ash', reward:1320,
    sidekickUnlock:null, mapPos:[262,90],
    intro:'The Mall is a crater. The monuments are sniper perches. Welcome to the capital.',
    outro:'DC is behind you. You drove through history — and history tried to kill you.',
    levels:[
      {num:1,name:'MONUMENT RUN',  obj:'survive', target:65,  diff:4.7,reward:500,night:true,storm:true},
      {num:2,name:'BELTWAY SIEGE', obj:'kills',   target:36,  diff:5.0,reward:570,storm:true},
      {num:3,name:'POTOMAC DASH',  obj:'distance',target:6500,diff:5.3,reward:650,night:true},
      {num:4,name:'THE SENATOR',   obj:'boss',    target:1,   diff:5.6,reward:1280,boss:5,night:true,storm:true},
    ],
  },
  {
    id:'philly', name:'PHILADELPHIA DOCKS', state:'PENNSYLVANIA', biome:'saltflats', reward:1400,
    sidekickUnlock:'vulture', mapPos:[270,80],
    intro:'The docks run on smuggled scrap and old grudges. The city of brotherly love — and brutal war.',
    outro:'Philly pays. VULTURE arrives — strips the dead clean so you don\'t have to.',
    levels:[
      {num:1,name:'DOCK WAR',       obj:'survive', target:70,  diff:5.0,reward:540},
      {num:2,name:'MARKET BLITZ',   obj:'kills',   target:38,  diff:5.3,reward:610},
      {num:3,name:'SCHUYLKILL BURN',obj:'distance',target:7000,diff:5.6,reward:690},
      {num:4,name:'LIBERTY WRECKER',obj:'boss',    target:1,   diff:5.9,reward:1360,boss:5},
    ],
  },
  {
    id:'newark', name:'NEWARK RAIL', state:'NEW JERSEY', biome:'midnight', reward:1480,
    sidekickUnlock:null, mapPos:[277,68],
    intro:'The rail yards are a labyrinth of killing ground. One more push.',
    outro:'Newark falls. The skyline of New York — dark, massive, waiting — fills the windshield.',
    levels:[
      {num:1,name:'YARD BREACH',   obj:'survive', target:70,  diff:5.4,reward:580,night:true},
      {num:2,name:'FREIGHT AMBUSH',obj:'kills',   target:40,  diff:5.7,reward:650,night:true},
      {num:3,name:'TRANSIT WAR',   obj:'distance',target:7500,diff:6.0,reward:740,night:true},
      {num:4,name:'THE CONDUCTOR', obj:'boss',    target:1,   diff:6.2,reward:1440,boss:5,night:true},
    ],
  },
  {
    id:'nyc', name:'NEW YORK CITY', state:'NEW YORK', biome:'midnight', reward:2000,
    sidekickUnlock:null, mapPos:[284,60],
    intro:'The last city. The last run. Whatever made you start this drive — it ends here.',
    outro:'You drove the country end to end, through fire and ruin. No one owns this road. Now they know your name.',
    levels:[
      {num:1,name:'BRIDGE BREACH',  obj:'survive', target:75,  diff:5.8,reward:650,night:true,storm:true},
      {num:2,name:'MIDTOWN SIEGE',  obj:'kills',   target:42,  diff:6.0,reward:720,night:true,storm:true},
      {num:3,name:'AVENUE OF WAR',  obj:'distance',target:8000,diff:6.3,reward:820,night:true,storm:true},
      {num:4,name:'THE CHIMERA II', obj:'boss',    target:1,   diff:6.8,reward:2400,boss:5,night:true,storm:true},
      {num:5,name:'NYC LAST STAND',  obj:'horde',   target:60,  diff:7.0,reward:3600,night:true,storm:true},
    ],
  },
];

// Flat lookup: 'la-1' -> { loc, lvl, locIdx, levelIdx }
const CAMPAIGN_LEVEL_MAP = {};
CAMPAIGN_LOCATIONS.forEach((loc, locIdx) => {
  loc.levels.forEach((lvl, levelIdx) => {
    CAMPAIGN_LEVEL_MAP[loc.id + '-' + lvl.num] = { loc, lvl, locIdx, levelIdx };
  });
});
const CAMPAIGN_LEVEL_TOTAL = CAMPAIGN_LOCATIONS.reduce((sum, loc) => sum + loc.levels.length, 0);
const ZOMBIE_UNLOCK_CAMPAIGN_LEVELS = Math.ceil(CAMPAIGN_LEVEL_TOTAL / 2);

function getCampaignLevelsCleared(profile) {
  return Object.values((profile && profile.campaignCleared) || {}).reduce(
    (sum, entry) => sum + ((entry.levelsCleared || []).length), 0
  );
}

function getZombieUnlockLevelsRemaining(profile) {
  return Math.max(0, ZOMBIE_UNLOCK_CAMPAIGN_LEVELS - getCampaignLevelsCleared(profile));
}

function campaignLevelLabel(count) {
  return 'CAMPAIGN LEVEL' + (count === 1 ? '' : 'S');
}

function zombieLockedMessage(prefix, remaining) {
  return `${prefix} — CLEAR ${remaining} MORE ${campaignLevelLabel(remaining)}`;
}

// ============================================================
// SIDEKICKS — passive companions unlocked through campaign
// ============================================================
const SIDEKICKS = [
  {
    id:'diesel',  name:'DIESEL',  title:'WRENCH MONKEY',
    bio:'Never met a wreck he couldn\'t patch. Keeps the engine running when everything else is on fire.',
    perk:'+5 HP AUTO-REPAIR EVERY 20S', unlockLoc:'hoover', color:'#ff9d66',
  },
  {
    id:'ratchet', name:'RATCHET', title:'GUN HAND',
    bio:'Knows every weapon in the wasteland by sound. Rides shotgun and keeps the barrels hot.',
    perk:'+15% BULLET DAMAGE', unlockLoc:'okc', color:'#ffd86b',
  },
  {
    id:'mirage',  name:'MIRAGE',  title:'DESERT GHOST',
    bio:'Sees things in the heat shimmer. Knows where the supply drops fall before they land.',
    perk:'PICKUP MAGNET RANGE +30%', unlockLoc:'atlanta', color:'#7af0ff',
  },
  {
    id:'vulture', name:'VULTURE', title:'SCRAP HUNTER',
    bio:'Circles every kill zone like he was born for it. Takes a cut of everything.',
    perk:'+20% SCRAP FROM KILLS', unlockLoc:'philly', color:'#f070ff',
  },
];
const SIDEKICK_BY_ID = Object.fromEntries(SIDEKICKS.map(s => [s.id, s]));

const BIOME_THEMES = {
  wastes: {
    skyDayTop:'#3a230f', skyDayMid:'#5a3818', skyDayBottom:'#6e4621',
    skyStormTop:'#2a1a18', skyStormMid:'#4a2a18',
    skyNightTop:'#0a0a1a', skyNightMid:'#1a1530', skyNightBottom:'#2a1f1a',
    skyNightStormTop:'#1a0a1a', skyNightStormMid:'#2a1530',
    farDay:'rgba(70,42,18,0.55)', farNight:'rgba(15,10,28,0.75)',
    mountainDay:'#2a1808', mountainNight:'#0a0612',
    hillsDay:'#3a230f', hillsNight:'#1a1020',
    shoulderDay:'#3d2510', shoulderNight:'#1a1208',
    crackDay:'rgba(0,0,0,0.15)', crackNight:'rgba(80,70,60,0.08)',
    lineDay:'rgba(245,215,110,0.65)', lineNight:'rgba(245,215,110,0.85)',
    roadDayA:'#1f1610', roadDayB:'#2a1d12',
    roadNightA:'#0a0a08', roadNightB:'#181410',
    cactusDay:'#3a5a2a', cactusNight:'#1a3a18',
    wreckDay:'#4a3020', wreckNight:'#2a2018',
    skullDay:'#cabaa8', skullNight:'#9a8a78',
    stormLine:'rgba(180,140,90,0.25)', stormHaze:'rgba(180,140,90,0.08)',
    cloudDay:'rgba(255,232,185,1)', fogDay:'rgba(220,155,85,0.24)', fogNight:'rgba(28,18,38,0.32)',
  },
  saltflats: {
    skyDayTop:'#564f3f', skyDayMid:'#8a7c64', skyDayBottom:'#c0b39b',
    skyStormTop:'#4b4637', skyStormMid:'#796e57',
    skyNightTop:'#141822', skyNightMid:'#263140', skyNightBottom:'#2f2c35',
    skyNightStormTop:'#1d2530', skyNightStormMid:'#38404f',
    farDay:'rgba(88,82,72,0.58)', farNight:'rgba(30,34,45,0.78)',
    mountainDay:'#5e5648', mountainNight:'#1a1f2b',
    hillsDay:'#7e725e', hillsNight:'#2a3342',
    shoulderDay:'#8c7f68', shoulderNight:'#3a3c40',
    crackDay:'rgba(70,60,45,0.18)', crackNight:'rgba(130,120,110,0.10)',
    lineDay:'rgba(245,232,190,0.7)', lineNight:'rgba(245,232,190,0.9)',
    roadDayA:'#5a554b', roadDayB:'#6b665b',
    roadNightA:'#1f2128', roadNightB:'#2d3138',
    cactusDay:'#5f6c54', cactusNight:'#404b3e',
    wreckDay:'#6d6252', wreckNight:'#423e3b',
    skullDay:'#efe4d2', skullNight:'#b8b0a2',
    stormLine:'rgba(230,220,200,0.18)', stormHaze:'rgba(230,220,200,0.06)',
    cloudDay:'rgba(255,252,242,1)', fogDay:'rgba(195,186,162,0.20)', fogNight:'rgba(32,40,52,0.28)',
  },
  ash: {
    skyDayTop:'#35241f', skyDayMid:'#4a332c', skyDayBottom:'#5f4a3d',
    skyStormTop:'#2a1d1b', skyStormMid:'#3f2d29',
    skyNightTop:'#140f1a', skyNightMid:'#221a2e', skyNightBottom:'#2e2530',
    skyNightStormTop:'#1a1322', skyNightStormMid:'#2d2138',
    farDay:'rgba(52,38,34,0.62)', farNight:'rgba(22,18,28,0.82)',
    mountainDay:'#2f2522', mountainNight:'#15111c',
    hillsDay:'#433230', hillsNight:'#221a2a',
    shoulderDay:'#342923', shoulderNight:'#1f1818',
    crackDay:'rgba(20,18,18,0.2)', crackNight:'rgba(95,85,90,0.12)',
    lineDay:'rgba(214,171,120,0.68)', lineNight:'rgba(214,171,120,0.88)',
    roadDayA:'#251d1b', roadDayB:'#2d2523',
    roadNightA:'#100d10', roadNightB:'#171218',
    cactusDay:'#50594d', cactusNight:'#343a34',
    wreckDay:'#3f332d', wreckNight:'#241f21',
    skullDay:'#b6a99c', skullNight:'#8f8378',
    stormLine:'rgba(140,120,115,0.24)', stormHaze:'rgba(140,120,115,0.08)',
    cloudDay:'rgba(200,180,170,1)', fogDay:'rgba(110,90,95,0.28)', fogNight:'rgba(22,15,32,0.38)',
  },
  redcanyon: {
    skyDayTop:'#4a1f16', skyDayMid:'#79331f', skyDayBottom:'#aa5830',
    skyStormTop:'#381a14', skyStormMid:'#5a281d',
    skyNightTop:'#1b0f16', skyNightMid:'#2f1526', skyNightBottom:'#3d2228',
    skyNightStormTop:'#24111c', skyNightStormMid:'#3f1f30',
    farDay:'rgba(95,36,24,0.6)', farNight:'rgba(34,14,24,0.8)',
    mountainDay:'#3a1a12', mountainNight:'#180913',
    hillsDay:'#592718', hillsNight:'#271221',
    shoulderDay:'#4d2416', shoulderNight:'#241211',
    crackDay:'rgba(38,16,10,0.2)', crackNight:'rgba(120,70,50,0.12)',
    lineDay:'rgba(255,196,120,0.72)', lineNight:'rgba(255,196,120,0.9)',
    roadDayA:'#2c1711', roadDayB:'#3c2118',
    roadNightA:'#130b0d', roadNightB:'#1d1015',
    cactusDay:'#5a4a2f', cactusNight:'#3b2f24',
    wreckDay:'#5b3323', wreckNight:'#322025',
    skullDay:'#d8b8a0', skullNight:'#aa8975',
    stormLine:'rgba(200,110,72,0.25)', stormHaze:'rgba(200,110,72,0.08)',
    cloudDay:'rgba(255,198,152,1)', fogDay:'rgba(170,82,45,0.30)', fogNight:'rgba(28,10,18,0.38)',
  },
  midnight: {
    skyDayTop:'#25253a', skyDayMid:'#303658', skyDayBottom:'#3b4472',
    skyStormTop:'#202338', skyStormMid:'#2a3152',
    skyNightTop:'#060712', skyNightMid:'#0f1430', skyNightBottom:'#1b203a',
    skyNightStormTop:'#0a0e1a', skyNightStormMid:'#151d38',
    farDay:'rgba(32,36,76,0.62)', farNight:'rgba(10,12,35,0.82)',
    mountainDay:'#161a3d', mountainNight:'#090d24',
    hillsDay:'#242956', hillsNight:'#12183c',
    shoulderDay:'#1d2142', shoulderNight:'#121426',
    crackDay:'rgba(0,0,0,0.18)', crackNight:'rgba(120,140,220,0.10)',
    lineDay:'rgba(153,206,255,0.68)', lineNight:'rgba(153,206,255,0.92)',
    roadDayA:'#141a30', roadDayB:'#1a223d',
    roadNightA:'#060812', roadNightB:'#0f1425',
    cactusDay:'#304a60', cactusNight:'#1f3142',
    wreckDay:'#2d3652', wreckNight:'#1b2439',
    skullDay:'#c0d7ee', skullNight:'#8fa6c2',
    stormLine:'rgba(110,140,255,0.22)', stormHaze:'rgba(110,140,255,0.06)',
    cloudDay:'rgba(175,192,255,1)', fogDay:'rgba(48,68,140,0.28)', fogNight:'rgba(6,10,30,0.48)',
  },
};

// ============================================================
// CHARACTERS — choosable badlands warriors
// ============================================================
const CHARACTERS = [
  {
    id: 'opal',
    name: 'OPAL',
    title: 'THE CIVILIAN DESTROYER',
    bio: 'No badge, no banner, no rules of engagement — just a flatbed full of grudges. The Mojave learned to clear the road when her headlights crested the dunes.',
    perk: '+5% STARTING SCRAP',
    palette: { skin:'#c89770', skinDark:'#7a4a2a', hair:'#1a0f08', hairHi:'#3a230f', accent:'#ff5050', cloth:'#5a2a18', metal:'#a86a2e', bg1:'#3a1410', bg2:'#1a0808' },
  },
  {
    id: 'ophelia',
    name: 'OPHELIA',
    title: 'THE BONE QUEEN',
    bio: 'Speaks to the bones the highway leaves behind. The Mojave hounds answer when she whistles. They say she walked out of the Dead Zone alone.',
    perk: '+1 NIGHT VISION RANGE',
    palette: { skin:'#d8b08c', skinDark:'#8a5a3a', hair:'#e8d8b8', hairHi:'#fffbe0', accent:'#7ae0c8', cloth:'#1e2a2c', metal:'#bfb8a0', bg1:'#0e2424', bg2:'#050f10' },
  },
  {
    id: 'abigail',
    name: 'ABIGAIL',
    title: 'DUSTHOWLER',
    bio: 'Born in a shotgun shack at mile 88. Hasn’t lost a duel since she could see over a steering wheel. The wasteland flinches when she laughs.',
    perk: '+5% SCORE FROM KILLS',
    palette: { skin:'#caa07a', skinDark:'#7d4a28', hair:'#a86a2e', hairHi:'#f5d76e', accent:'#f5d76e', cloth:'#3a2410', metal:'#8a4f1f', bg1:'#3a230f', bg2:'#180c04' },
  },
  {
    id: 'nox',
    name: 'NOX',
    title: 'THE SIGNAL GHOST',
    bio: 'Used to jam convoy radios for sport. Now she makes wrecks sing in perfect static.',
    perk: '+8% SCORE FROM KILLS',
    palette: { skin:'#9f7f67', skinDark:'#5e3f2c', hair:'#101318', hairHi:'#496180', accent:'#7ad0ff', cloth:'#1b2230', metal:'#8ea8c5', bg1:'#121826', bg2:'#060b12' },
  },
  {
    id: 'ram',
    name: 'RAM',
    title: 'THE CONVOY HAMMER',
    bio: 'Ex-war rig mechanic with a welded grin and no reverse gear in his vocabulary.',
    perk: '+10% SCRAP PAYOUT',
    palette: { skin:'#b18462', skinDark:'#6d442d', hair:'#3d2417', hairHi:'#7d543b', accent:'#ff9d66', cloth:'#38261c', metal:'#74615a', bg1:'#301812', bg2:'#120907' },
  },
  {
    id: 'vega',
    name: 'VEGA',
    title: 'THE DESERT HAWK',
    bio: 'Came out of the Smoke Flats alone, silver-haired and grinning. Nobody knows where she was before. Nobody asks twice.',
    perk: '–12% DAMAGE TAKEN',
    palette: { skin:'#c4a882', skinDark:'#7a5c3c', hair:'#d8dde4', hairHi:'#ffffff', accent:'#e8c84a', cloth:'#2c2c1e', metal:'#b0a888', bg1:'#1e1c10', bg2:'#0c0b06' },
  },
];
const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const DEFAULT_CHARACTER_ID = 'opal';

// Build an animated SVG headshot portrait for a character.
// Returns an SVG string. Animations are CSS-driven (see index.html keyframes).
function characterPortraitSVG(charId) {
  const c = CHARACTER_BY_ID[charId] || CHARACTER_BY_ID[DEFAULT_CHARACTER_ID];
  const p = c.palette;
  // Shared dust particles — drift across the frame
  const dust = `
    <circle class="dust"    cx="6"  cy="80" r="1.4" fill="${p.accent}" opacity=".7"/>
    <circle class="dust d2" cx="2"  cy="60" r="1"   fill="${p.metal}"  opacity=".5"/>
    <circle class="dust d3" cx="10" cy="92" r="1.6" fill="${p.accent}" opacity=".55"/>`;
  // Each character: distinct silhouette, hair, war paint, accessories
  let face = '';
  if (c.id === 'opal') {
    // OPAL — buzzed hair, red war-paint stripe across eyes, cheek scar, dog tags
    face = `
      <!-- ember glow background -->
      <radialGradient id="g-opal" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-opal)"/>
      <circle class="ember" cx="78" cy="22" r="14" fill="${p.accent}" opacity=".55"/>
      <!-- shoulders / collar -->
      <g class="breath">
        <path d="M8 100 L8 86 Q22 70 40 70 L60 70 Q78 70 92 86 L92 100 Z" fill="${p.cloth}"/>
        <path d="M40 70 L60 70 L58 78 L42 78 Z" fill="${p.skinDark}"/>
        <!-- dog-tag chain -->
        <path d="M44 70 Q50 80 56 70" stroke="${p.metal}" stroke-width="1" fill="none"/>
        <rect x="48" y="76" width="4" height="6" fill="${p.metal}"/>
        <!-- neck -->
        <rect x="44" y="60" width="12" height="14" fill="${p.skin}"/>
      </g>
      <!-- head -->
      <ellipse cx="50" cy="46" rx="22" ry="26" fill="${p.skin}"/>
      <!-- jaw shadow -->
      <path d="M30 52 Q50 70 70 52 L70 60 Q50 72 30 60 Z" fill="${p.skinDark}" opacity=".35"/>
      <!-- buzzed hair cap -->
      <path d="M28 32 Q50 18 72 32 L72 40 Q50 28 28 40 Z" fill="${p.hair}"/>
      <path d="M30 34 Q50 24 70 34" stroke="${p.hairHi}" stroke-width=".6" fill="none" opacity=".7"/>
      <!-- ear -->
      <ellipse cx="27" cy="48" rx="3" ry="5" fill="${p.skinDark}"/>
      <circle cx="26" cy="50" r="1" fill="${p.metal}"/>
      <!-- red war-paint stripe across eyes -->
      <rect x="26" y="42" width="48" height="6" fill="${p.accent}" opacity=".75"/>
      <!-- eyes -->
      <g>
        <ellipse cx="42" cy="46" rx="3" ry="2" fill="#fff"/>
        <circle cx="42" cy="46" r="1.3" fill="${p.hair}"/>
        <ellipse cx="58" cy="46" rx="3" ry="2" fill="#fff"/>
        <circle cx="58" cy="46" r="1.3" fill="${p.hair}"/>
        <!-- eyelids (animated blink) -->
        <rect class="eyelid"   x="39" y="44" width="6" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="55" y="44" width="6" height="4" fill="${p.skinDark}"/>
      </g>
      <!-- brow -->
      <rect x="38" y="40" width="8" height="1.4" fill="${p.hair}"/>
      <rect x="54" y="40" width="8" height="1.4" fill="${p.hair}"/>
      <!-- cheek scar -->
      <path d="M62 52 L66 60" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".8"/>
      <path d="M62 52 L60 56" stroke="${p.accent}" stroke-width=".8" fill="none" opacity=".6"/>
      <!-- nose -->
      <path d="M50 48 L48 56 L52 56 Z" fill="${p.skinDark}" opacity=".4"/>
      <!-- mouth — set jaw -->
      <rect x="44" y="60" width="12" height="1.6" fill="${p.skinDark}"/>
      <!-- spark (gun ember) -->
      <circle class="spark" cx="22" cy="74" r="1.6" fill="${p.accent}"/>
      ${dust}
    `;
  } else if (c.id === 'ophelia') {
    // OPHELIA — long ash dreadlocks, kohl eyes, bone necklace, jagged jaw paint
    face = `
      <radialGradient id="g-oph" cx="50%" cy="55%" r="70%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-oph)"/>
      <circle class="ember" cx="22" cy="24" r="14" fill="${p.accent}" opacity=".4"/>
      <!-- back hair (long) -->
      <g class="hair s">
        <path d="M18 30 Q14 70 22 100 L40 100 Q34 70 36 30 Z" fill="${p.hair}"/>
        <path d="M82 30 Q86 70 78 100 L60 100 Q66 70 64 30 Z" fill="${p.hair}"/>
        <!-- highlights -->
        <path d="M20 38 L22 92" stroke="${p.hairHi}" stroke-width=".6" opacity=".6"/>
        <path d="M80 38 L78 92" stroke="${p.hairHi}" stroke-width=".6" opacity=".6"/>
        <path d="M30 36 L32 90" stroke="${p.hairHi}" stroke-width=".4" opacity=".4"/>
        <path d="M70 36 L68 90" stroke="${p.hairHi}" stroke-width=".4" opacity=".4"/>
      </g>
      <!-- shoulders / shawl -->
      <g class="breath">
        <path d="M10 100 L14 84 Q30 74 40 74 L60 74 Q70 74 86 84 L90 100 Z" fill="${p.cloth}"/>
        <!-- bone necklace -->
        <path d="M40 74 Q50 84 60 74" stroke="${p.hairHi}" stroke-width="1" fill="none"/>
        <rect x="44" y="78" width="2" height="5" fill="${p.hairHi}"/>
        <rect x="49" y="80" width="2" height="6" fill="${p.hairHi}"/>
        <rect x="54" y="78" width="2" height="5" fill="${p.hairHi}"/>
        <!-- neck -->
        <rect x="44" y="62" width="12" height="14" fill="${p.skin}"/>
      </g>
      <!-- head -->
      <ellipse cx="50" cy="46" rx="21" ry="25" fill="${p.skin}"/>
      <!-- front hair fringe -->
      <path d="M30 32 Q50 22 70 32 L70 40 L62 36 L58 42 L50 36 L42 42 L38 36 L30 40 Z" fill="${p.hair}"/>
      <!-- ear -->
      <ellipse cx="29" cy="48" rx="2.5" ry="4" fill="${p.skinDark}"/>
      <!-- kohl eye paint -->
      <rect x="34" y="42" width="12" height="6" fill="${p.cloth}" opacity=".85"/>
      <rect x="54" y="42" width="12" height="6" fill="${p.cloth}" opacity=".85"/>
      <!-- eyes (pale, piercing) -->
      <g>
        <ellipse cx="40" cy="46" rx="3" ry="2" fill="#f4f6f0"/>
        <circle cx="40" cy="46" r="1.3" fill="${p.accent}"/>
        <ellipse cx="60" cy="46" rx="3" ry="2" fill="#f4f6f0"/>
        <circle cx="60" cy="46" r="1.3" fill="${p.accent}"/>
        <rect class="eyelid"   x="37" y="44" width="6" height="4" fill="${p.cloth}"/>
        <rect class="eyelid b" x="57" y="44" width="6" height="4" fill="${p.cloth}"/>
      </g>
      <!-- jagged jaw war paint (down chin) -->
      <path d="M46 60 L48 70 L46 70 L48 64 Z M52 60 L54 70 L52 70 L54 64 Z" fill="${p.cloth}"/>
      <path d="M44 64 L40 72" stroke="${p.cloth}" stroke-width="1.2" opacity=".9"/>
      <path d="M56 64 L60 72" stroke="${p.cloth}" stroke-width="1.2" opacity=".9"/>
      <!-- nose -->
      <path d="M50 48 L48 56 L52 56 Z" fill="${p.skinDark}" opacity=".4"/>
      <!-- mouth -->
      <rect x="44" y="60" width="12" height="1.4" fill="${p.cloth}"/>
      <!-- temple beads -->
      <circle cx="32" cy="38" r="1.2" fill="${p.hairHi}"/>
      <circle cx="68" cy="38" r="1.2" fill="${p.hairHi}"/>
      <!-- spark -->
      <circle class="spark" cx="78" cy="74" r="1.4" fill="${p.accent}"/>
      ${dust}
    `;
  } else if (c.id === 'abigail') {
    // ABIGAIL — goggles on forehead, side braid, hood, oil smudge
    face = `
      <radialGradient id="g-abi" cx="50%" cy="55%" r="65%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-abi)"/>
      <circle class="ember" cx="50" cy="20" r="18" fill="${p.accent}" opacity=".35"/>
      <!-- hood / leather collar -->
      <g class="breath">
        <path d="M6 100 L10 80 Q22 64 40 64 L60 64 Q78 64 90 80 L94 100 Z" fill="${p.cloth}"/>
        <path d="M22 70 Q50 56 78 70 L78 78 Q50 66 22 78 Z" fill="${p.metal}"/>
        <!-- buckle -->
        <rect x="46" y="74" width="8" height="4" fill="${p.accent}"/>
        <rect x="48" y="75" width="4" height="2" fill="${p.cloth}"/>
        <!-- neck -->
        <rect x="44" y="60" width="12" height="12" fill="${p.skin}"/>
      </g>
      <!-- head -->
      <ellipse cx="50" cy="46" rx="22" ry="26" fill="${p.skin}"/>
      <!-- side braid (right side, swaying) -->
      <g class="hair">
        <path d="M70 40 Q80 56 76 78 L70 78 Q72 56 64 42 Z" fill="${p.hair}"/>
        <path d="M71 46 L73 52 M70 54 L74 60 M71 62 L73 68 M70 70 L73 76"
              stroke="${p.hairHi}" stroke-width=".7" fill="none" opacity=".8"/>
      </g>
      <!-- swept top hair under goggles -->
      <path d="M28 34 Q50 22 72 34 L72 38 Q50 30 28 40 Z" fill="${p.hair}"/>
      <path d="M30 36 Q50 28 70 36" stroke="${p.hairHi}" stroke-width=".6" fill="none" opacity=".7"/>
      <!-- goggles strap -->
      <rect x="26" y="34" width="48" height="3" fill="${p.cloth}"/>
      <!-- goggles lenses (on forehead) -->
      <circle cx="38" cy="34" r="6" fill="${p.cloth}" stroke="${p.metal}" stroke-width="1.4"/>
      <circle cx="62" cy="34" r="6" fill="${p.cloth}" stroke="${p.metal}" stroke-width="1.4"/>
      <circle cx="36" cy="32" r="1.6" fill="${p.hairHi}" opacity=".9"/>
      <circle cx="60" cy="32" r="1.6" fill="${p.hairHi}" opacity=".9"/>
      <rect x="43" y="33" width="14" height="2" fill="${p.metal}"/>
      <!-- ear -->
      <ellipse cx="27" cy="48" rx="3" ry="5" fill="${p.skinDark}"/>
      <!-- eyes -->
      <g>
        <ellipse cx="42" cy="48" rx="3" ry="2" fill="#fff"/>
        <circle cx="42" cy="48" r="1.3" fill="${p.cloth}"/>
        <ellipse cx="58" cy="48" rx="3" ry="2" fill="#fff"/>
        <circle cx="58" cy="48" r="1.3" fill="${p.cloth}"/>
        <rect class="eyelid"   x="39" y="46" width="6" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="55" y="46" width="6" height="4" fill="${p.skinDark}"/>
      </g>
      <!-- brow -->
      <rect x="38" y="42" width="8" height="1.4" fill="${p.hair}"/>
      <rect x="54" y="42" width="8" height="1.4" fill="${p.hair}"/>
      <!-- oil smudge on cheek -->
      <ellipse cx="36" cy="56" rx="4" ry="2" fill="${p.cloth}" opacity=".8"/>
      <ellipse cx="34" cy="58" rx="2" ry="1" fill="${p.cloth}" opacity=".6"/>
      <!-- nose -->
      <path d="M50 50 L48 58 L52 58 Z" fill="${p.skinDark}" opacity=".4"/>
      <!-- mouth — half-smirk with gold tooth glint -->
      <path d="M44 62 Q50 65 56 62" stroke="${p.skinDark}" stroke-width="1.2" fill="none"/>
      <rect class="spark" x="49" y="62" width="1.6" height="1.6" fill="${p.accent}"/>
      ${dust}
    `;
  } else if (c.id === 'nox') {
    // NOX — shaved sides, long top swept back into a wild mohawk, signal-ghost punk.
    // Tactical headset on left ear, dark tinted wraparound visor pushed up on forehead,
    // sharp cheekbones, thin lips set in focus.
    face = `
      <radialGradient id="g-nox" cx="50%" cy="58%" r="72%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-nox)"/>
      <!-- signal-blue ember glow top-right -->
      <circle class="ember" cx="76" cy="18" r="16" fill="${p.accent}" opacity=".38"/>
      <!-- tech static grid lines (very faint) -->
      <line x1="0" y1="70" x2="100" y2="70" stroke="${p.accent}" stroke-width=".3" opacity=".12"/>
      <line x1="0" y1="80" x2="100" y2="80" stroke="${p.accent}" stroke-width=".3" opacity=".1"/>
      <!-- shaved sides — dark stubble on temples -->
      <ellipse cx="28" cy="44" rx="8" ry="14" fill="${p.hair}" opacity=".5"/>
      <ellipse cx="72" cy="44" rx="8" ry="14" fill="${p.hair}" opacity=".5"/>
      <!-- shoulders / tactical jacket collar -->
      <g class="breath">
        <path d="M8 100 L10 82 Q24 66 40 66 L60 66 Q76 66 90 82 L92 100 Z" fill="${p.cloth}"/>
        <!-- collar detail / comm cable -->
        <path d="M40 68 Q50 76 60 68" stroke="${p.accent}" stroke-width=".8" fill="none" opacity=".65"/>
        <rect x="48" y="66" width="4" height="5" fill="${p.metal}"/>
        <!-- neck -->
        <rect x="44" y="60" width="12" height="12" fill="${p.skin}"/>
      </g>
      <!-- head -->
      <ellipse cx="50" cy="46" rx="21" ry="24" fill="${p.skin}"/>
      <!-- jaw shadow — sharp angle for high cheekbones -->
      <path d="M32 52 Q50 68 68 52 L68 60 Q50 74 32 60 Z" fill="${p.skinDark}" opacity=".3"/>
      <!-- mohawk — tall swept-back spikes, animated sway -->
      <g class="hair">
        <path d="M38 28 Q40 6 50 2 Q60 6 62 28 Q56 18 50 14 Q44 18 38 28 Z" fill="${p.hair}"/>
        <!-- mohawk highlight streaks -->
        <path d="M47 28 Q49 12 50 4 Q51 12 53 28" stroke="${p.hairHi}" stroke-width=".7" fill="none" opacity=".65"/>
        <!-- side tufts of the mohawk -->
        <path d="M36 30 Q34 16 42 12 Q44 22 40 32 Z" fill="${p.hair}" opacity=".8"/>
        <path d="M64 30 Q66 16 58 12 Q56 22 60 32 Z" fill="${p.hair}" opacity=".8"/>
      </g>
      <!-- visor band pushed up on forehead -->
      <rect x="29" y="34" width="42" height="5" rx="2.5" fill="${p.metal}" opacity=".9"/>
      <rect x="31" y="35" width="38" height="2.5" rx="1.2" fill="${p.hairHi}" opacity=".35"/>
      <!-- ear -->
      <ellipse cx="29" cy="48" rx="3" ry="5" fill="${p.skinDark}"/>
      <!-- tactical headset on left ear -->
      <circle cx="26" cy="46" r="4" fill="${p.cloth}" stroke="${p.metal}" stroke-width=".8"/>
      <circle cx="26" cy="46" r="2" fill="${p.metal}" opacity=".8"/>
      <line x1="26" y1="42" x2="26" y2="36" stroke="${p.metal}" stroke-width=".9"/>
      <!-- mic arm curving from headset -->
      <path d="M24 44 Q18 46 20 52" stroke="${p.accent}" stroke-width=".7" fill="none"/>
      <circle cx="20" cy="52" r="1.2" fill="${p.accent}" opacity=".85"/>
      <!-- eyes — narrow, focused, dark tinted -->
      <g>
        <ellipse cx="40" cy="47" rx="3.5" ry="2.1" fill="#b0cce0"/>
        <circle cx="40" cy="47" r="1.4" fill="${p.hair}"/>
        <ellipse cx="60" cy="47" rx="3.5" ry="2.1" fill="#b0cce0"/>
        <circle cx="60" cy="47" r="1.4" fill="${p.hair}"/>
        <rect class="eyelid"   x="37" y="45" width="7" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="57" y="45" width="7" height="4" fill="${p.skinDark}"/>
      </g>
      <!-- thin sharp brows -->
      <rect x="37" y="42" width="7" height="1.2" fill="${p.hair}" transform="rotate(-4,40,42)"/>
      <rect x="56" y="42" width="7" height="1.2" fill="${p.hair}" transform="rotate(4,60,42)"/>
      <!-- nose — sharp aquiline -->
      <path d="M50 49 L48 57 L52 57 Z" fill="${p.skinDark}" opacity=".38"/>
      <!-- set mouth — slight smirk -->
      <path d="M44 62 Q52 66 58 62" stroke="${p.skinDark}" stroke-width="1" fill="none"/>
      <!-- signal spark at collar -->
      <circle class="spark" cx="72" cy="74" r="1.5" fill="${p.accent}"/>
      ${dust}
    `;
  } else if (c.id === 'ram') {
    // RAM — thick shaggy wavy hair, heavy stubble/beard, rugged mechanic. No-nonsense face.
    // Bandana around neck, cracked lip, mechanic grease on brow, chain scar.
    face = `
      <radialGradient id="g-ram" cx="50%" cy="52%" r="68%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-ram)"/>
      <!-- ember warm glow — ember orange for ram -->
      <circle class="ember" cx="22" cy="22" r="18" fill="${p.accent}" opacity=".42"/>
      <!-- back of hair — wide, thick, wavy -->
      <g class="hair s">
        <path d="M24 30 Q16 50 20 88 L36 88 Q28 55 34 32 Z" fill="${p.hair}"/>
        <path d="M76 30 Q84 50 80 88 L64 88 Q72 55 66 32 Z" fill="${p.hair}"/>
        <!-- wave highlights -->
        <path d="M25 42 Q22 58 24 74" stroke="${p.hairHi}" stroke-width=".7" fill="none" opacity=".5"/>
        <path d="M75 42 Q78 58 76 74" stroke="${p.hairHi}" stroke-width=".7" fill="none" opacity=".5"/>
        <path d="M32 38 Q29 54 31 68" stroke="${p.hairHi}" stroke-width=".4" fill="none" opacity=".35"/>
        <path d="M68 38 Q71 54 69 68" stroke="${p.hairHi}" stroke-width=".4" fill="none" opacity=".35"/>
      </g>
      <!-- shoulders / heavy canvas jacket -->
      <g class="breath">
        <path d="M6 100 L8 78 Q20 60 40 60 L60 60 Q80 60 92 78 L94 100 Z" fill="${p.cloth}"/>
        <!-- collar chain welded on -->
        <path d="M40 62 Q50 72 60 62" stroke="${p.metal}" stroke-width="1.4" fill="none" opacity=".8"/>
        <!-- bandana fold at collar -->
        <path d="M38 66 Q50 74 62 66 L60 70 Q50 78 40 70 Z" fill="${p.accent}" opacity=".6"/>
        <!-- neck -->
        <rect x="43" y="58" width="14" height="10" fill="${p.skin}"/>
      </g>
      <!-- wide head — broader jaw for the convoy hammer build -->
      <ellipse cx="50" cy="46" rx="24" ry="25" fill="${p.skin}"/>
      <!-- jaw square shadow -->
      <path d="M28 56 Q50 74 72 56 L72 64 Q50 80 28 64 Z" fill="${p.skinDark}" opacity=".4"/>
      <!-- thick shaggy hair top — animated waves -->
      <g class="hair">
        <!-- main mass -->
        <path d="M26 32 Q28 12 50 8 Q72 12 74 32 Q64 22 50 18 Q36 22 26 32 Z" fill="${p.hair}"/>
        <!-- wavy locks falling over brow -->
        <path d="M28 32 Q32 24 30 38 Z" fill="${p.hair}" opacity=".9"/>
        <path d="M35 28 Q38 18 36 36 Z" fill="${p.hair}" opacity=".85"/>
        <path d="M60 28 Q64 18 62 36 Z" fill="${p.hair}" opacity=".85"/>
        <path d="M68 30 Q72 22 70 38 Z" fill="${p.hair}" opacity=".8"/>
        <!-- wave highlights in hair -->
        <path d="M36 30 Q44 16 50 10" stroke="${p.hairHi}" stroke-width=".7" fill="none" opacity=".55"/>
        <path d="M58 28 Q52 16 50 10" stroke="${p.hairHi}" stroke-width=".6" fill="none" opacity=".45"/>
      </g>
      <!-- ear — slightly hidden by hair -->
      <ellipse cx="26" cy="48" rx="3.5" ry="5.5" fill="${p.skinDark}"/>
      <!-- stubble beard — heavy coverage over jaw -->
      <ellipse cx="50" cy="62" rx="16" ry="8" fill="${p.skinDark}" opacity=".55"/>
      <!-- stubble dots scattered across jaw for texture -->
      <circle cx="40" cy="60" r="1" fill="${p.hair}" opacity=".45"/>
      <circle cx="44" cy="64" r="1" fill="${p.hair}" opacity=".4"/>
      <circle cx="50" cy="66" r="1.2" fill="${p.hair}" opacity=".45"/>
      <circle cx="56" cy="64" r="1" fill="${p.hair}" opacity=".4"/>
      <circle cx="60" cy="60" r="1" fill="${p.hair}" opacity=".45"/>
      <circle cx="36" cy="58" r=".9" fill="${p.hair}" opacity=".4"/>
      <circle cx="64" cy="58" r=".9" fill="${p.hair}" opacity=".4"/>
      <!-- upper-lip mustache line -->
      <path d="M42 59 Q50 62 58 59" stroke="${p.hair}" stroke-width="1.4" fill="none" opacity=".6"/>
      <!-- eyes — deep set, heavy brow -->
      <g>
        <ellipse cx="41" cy="47" rx="3.2" ry="2" fill="#e8d0b8"/>
        <circle cx="41" cy="47" r="1.4" fill="${p.cloth}"/>
        <ellipse cx="59" cy="47" rx="3.2" ry="2" fill="#e8d0b8"/>
        <circle cx="59" cy="47" r="1.4" fill="${p.cloth}"/>
        <rect class="eyelid"   x="38" y="45" width="6" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="56" y="45" width="6" height="4" fill="${p.skinDark}"/>
      </g>
      <!-- heavy brows — bushy -->
      <path d="M36 42 Q41 39 46 42" stroke="${p.hair}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M54 42 Q59 39 64 42" stroke="${p.hair}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <!-- brow grease smudge -->
      <ellipse cx="42" cy="41" rx="3" ry=".8" fill="${p.cloth}" opacity=".55" transform="rotate(-6,42,41)"/>
      <!-- nose — broad, mechanic's nose -->
      <path d="M50 49 L47 57 L53 57 Z" fill="${p.skinDark}" opacity=".42"/>
      <!-- cracked-lip set jaw -->
      <path d="M43 62 Q50 65 57 62" stroke="${p.skinDark}" stroke-width="1.3" fill="none"/>
      <path d="M50 62 L50 64" stroke="${p.accent}" stroke-width=".7" opacity=".6"/>
      <!-- knuckle scar line across cheek -->
      <path d="M30 54 L26 60" stroke="${p.metal}" stroke-width="1" opacity=".5"/>
      <path d="M28 56 L30 60" stroke="${p.metal}" stroke-width=".7" opacity=".35"/>
      <!-- spark at jaw — welding ember -->
      <circle class="spark" cx="24" cy="70" r="1.6" fill="${p.accent}"/>
      ${dust}
    `;
  } else if (c.id === 'vega') {
    // VEGA — The Desert Hawk. Wild flowing silver-white hair, sharp eye-wrap,
    // sun-bronzed skin, crescent scar at brow, hawk feather braided in hair.
    face = `
      <radialGradient id="g-vega" cx="50%" cy="55%" r="70%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-vega)"/>
      <!-- desert gold ember -->
      <circle class="ember" cx="68" cy="18" r="20" fill="${p.accent}" opacity=".4"/>
      <circle class="ember" cx="24" cy="28" r="10" fill="${p.metal}" opacity=".3"/>
      <!-- wild hair flowing behind — wide animated mass -->
      <g class="hair s">
        <path d="M22 28 Q10 50 14 90 L32 90 Q24 56 30 30 Z" fill="${p.hair}"/>
        <path d="M78 28 Q90 50 86 90 L68 90 Q76 56 70 30 Z" fill="${p.hair}"/>
        <!-- silver highlight streaks -->
        <path d="M23 36 Q18 56 22 76" stroke="${p.hairHi}" stroke-width=".9" fill="none" opacity=".65"/>
        <path d="M77 36 Q82 56 78 76" stroke="${p.hairHi}" stroke-width=".9" fill="none" opacity=".65"/>
        <path d="M29 32 Q25 52 28 70" stroke="${p.hairHi}" stroke-width=".5" fill="none" opacity=".45"/>
        <path d="M71 32 Q75 52 72 70" stroke="${p.hairHi}" stroke-width=".5" fill="none" opacity=".45"/>
      </g>
      <!-- shoulders / desert wrap -->
      <g class="breath">
        <path d="M8 100 L10 82 Q22 66 40 66 L60 66 Q78 66 90 82 L92 100 Z" fill="${p.cloth}"/>
        <!-- shoulder wrap trim in gold accent -->
        <path d="M14 86 Q50 76 86 86" stroke="${p.accent}" stroke-width=".7" fill="none" opacity=".5"/>
        <rect x="44" y="62" width="12" height="10" fill="${p.skin}"/>
      </g>
      <!-- head -->
      <ellipse cx="50" cy="45" rx="22" ry="25" fill="${p.skin}"/>
      <!-- jaw shadow — angular, hawk-like -->
      <path d="M30 52 Q50 70 70 52 L70 60 Q50 74 30 60 Z" fill="${p.skinDark}" opacity=".32"/>
      <!-- wild silver hair top — sweeping, layered -->
      <g class="hair">
        <!-- main swept mass -->
        <path d="M28 30 Q30 8 50 4 Q70 8 72 30 Q62 16 50 12 Q38 16 28 30 Z" fill="${p.hair}"/>
        <!-- windswept locks fanning left -->
        <path d="M30 28 Q22 14 26 6 Q30 16 34 28 Z" fill="${p.hair}" opacity=".85"/>
        <path d="M26 32 Q14 18 18 8 Q24 18 28 34 Z" fill="${p.hair}" opacity=".7"/>
        <!-- windswept locks fanning right -->
        <path d="M70 28 Q78 14 74 6 Q70 16 66 28 Z" fill="${p.hair}" opacity=".85"/>
        <path d="M74 32 Q86 18 82 8 Q76 18 72 34 Z" fill="${p.hair}" opacity=".7"/>
        <!-- bright silver highlights -->
        <path d="M42 28 Q46 14 50 6 Q52 14 56 28" stroke="${p.hairHi}" stroke-width=".9" fill="none" opacity=".7"/>
        <path d="M36 30 Q38 18 42 10" stroke="${p.hairHi}" stroke-width=".6" fill="none" opacity=".5"/>
        <path d="M64 30 Q62 18 58 10" stroke="${p.hairHi}" stroke-width=".6" fill="none" opacity=".5"/>
        <!-- hawk feather braid on right side -->
        <path d="M68 28 Q74 34 72 44 Q68 36 64 28 Z" fill="${p.accent}" opacity=".7"/>
        <path d="M69 30 L71 38" stroke="${p.hairHi}" stroke-width=".4" fill="none" opacity=".7"/>
      </g>
      <!-- ear -->
      <ellipse cx="28" cy="47" rx="3" ry="5" fill="${p.skinDark}"/>
      <!-- ear cuff — gold ring -->
      <circle cx="27" cy="44" r="2" fill="none" stroke="${p.accent}" stroke-width="1.2"/>
      <!-- eye-wrap scar line across bridge / tactical eyewrap half-bar on right -->
      <path d="M54 42 L76 40" stroke="${p.cloth}" stroke-width="3.5" stroke-linecap="round" opacity=".82"/>
      <path d="M55 42 L75 40" stroke="${p.accent}" stroke-width=".6" stroke-linecap="round" opacity=".5"/>
      <!-- crescent scar at brow left -->
      <path d="M32 38 Q36 34 40 38" stroke="${p.accent}" stroke-width=".9" fill="none" opacity=".7"/>
      <!-- eyes — hawk yellow-gold irises -->
      <g>
        <ellipse cx="40" cy="47" rx="3.5" ry="2.2" fill="#f0e0a0"/>
        <circle cx="40" cy="47" r="1.4" fill="${p.cloth}"/>
        <ellipse cx="60" cy="47" rx="3.5" ry="2.2" fill="#f0e0a0"/>
        <circle cx="60" cy="47" r="1.4" fill="${p.cloth}"/>
        <rect class="eyelid"   x="37" y="45" width="7" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="57" y="45" width="7" height="4" fill="${p.skinDark}"/>
      </g>
      <!-- sharp brows — arched -->
      <path d="M36 42 Q40 38 45 42" stroke="${p.hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M55 42 Q60 38 64 42" stroke="${p.hair}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <!-- nose — straight and proud -->
      <path d="M50 49 L48 57 L52 57 Z" fill="${p.skinDark}" opacity=".4"/>
      <!-- half-smile — confident -->
      <path d="M44 62 Q52 67 58 62" stroke="${p.skinDark}" stroke-width="1.1" fill="none"/>
      <!-- desert sun burn flush on cheek -->
      <ellipse cx="36" cy="54" rx="4" ry="2" fill="${p.accent}" opacity=".22"/>
      <ellipse cx="64" cy="54" rx="4" ry="2" fill="${p.accent}" opacity=".22"/>
      <!-- hawk feather spark accent -->
      <circle class="spark" cx="76" cy="72" r="1.5" fill="${p.accent}"/>
      ${dust}
    `;
  } else {
    // Generic fallback portrait — used for any future characters without bespoke art.
    face = `
      <radialGradient id="g-generic" cx="50%" cy="55%" r="68%">
        <stop offset="0%" stop-color="${p.bg1}"/>
        <stop offset="100%" stop-color="${p.bg2}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g-generic)"/>
      <circle class="ember" cx="24" cy="20" r="14" fill="${p.accent}" opacity=".4"/>
      <circle class="ember" cx="74" cy="24" r="10" fill="${p.metal}" opacity=".35"/>
      <g class="breath">
        <path d="M8 100 L12 82 Q26 66 40 66 L60 66 Q74 66 88 82 L92 100 Z" fill="${p.cloth}"/>
        <rect x="44" y="60" width="12" height="12" fill="${p.skin}"/>
      </g>
      <ellipse cx="50" cy="46" rx="22" ry="25" fill="${p.skin}"/>
      <path d="M30 34 Q50 20 70 34 L70 40 Q50 30 30 40 Z" fill="${p.hair}"/>
      <path d="M32 36 Q50 28 68 36" stroke="${p.hairHi}" stroke-width=".8" fill="none" opacity=".7"/>
      <g>
        <ellipse cx="42" cy="47" rx="3.2" ry="2.1" fill="#fff"/>
        <circle cx="42" cy="47" r="1.3" fill="${p.cloth}"/>
        <ellipse cx="58" cy="47" rx="3.2" ry="2.1" fill="#fff"/>
        <circle cx="58" cy="47" r="1.3" fill="${p.cloth}"/>
        <rect class="eyelid" x="39" y="45" width="6" height="4" fill="${p.skinDark}"/>
        <rect class="eyelid b" x="55" y="45" width="6" height="4" fill="${p.skinDark}"/>
      </g>
      <rect x="38" y="42" width="8" height="1.2" fill="${p.hair}"/>
      <rect x="54" y="42" width="8" height="1.2" fill="${p.hair}"/>
      <path d="M50 49 L48 57 L52 57 Z" fill="${p.skinDark}" opacity=".35"/>
      <path d="M44 62 Q50 65 56 62" stroke="${p.skinDark}" stroke-width="1.1" fill="none"/>
      <path d="M34 55 Q50 60 66 55" stroke="${p.accent}" stroke-width="1.3" fill="none" opacity=".5"/>
      ${dust}
    `;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" shape-rendering="geometricPrecision" preserveAspectRatio="xMidYMid slice">${face}</svg>`;
}

// ============================================================
// ACHIEVEMENTS — per-profile badge definitions
// ============================================================
const ACHIEVEMENTS = [
  { id:'first_blood',    icon:'\u{1F525}',     name:'FIRST BLOOD',     desc:'Complete your first run' },
  { id:'survivor',       icon:'\u{1F480}',     name:'SURVIVOR',         desc:'Complete 10 runs' },
  { id:'road_warrior',   icon:'\u{1F3C1}',     name:'ROAD WARRIOR',     desc:'Complete 50 runs' },
  { id:'legend',         icon:'\u26A1\uFE0F',  name:'LEGEND',            desc:'Complete 100 runs' },
  { id:'scorched',       icon:'\u{1F3AF}',     name:'SCORCHED',          desc:'Score 5,000 in Classic' },
  { id:'inferno',        icon:'\u{1F30B}',     name:'INFERNO',           desc:'Score 25,000 in Classic' },
  { id:'nuclear',        icon:'\u2622\uFE0F',  name:'NUCLEAR',           desc:'Score 75,000 in Classic' },
  { id:'drifter',        icon:'\u{1F6E3}\uFE0F', name:'DRIFTER',        desc:'Travel 2,000 m in one Classic run' },
  { id:'road_king',      icon:'\u{1F451}',     name:'ROAD KING',         desc:'Travel 5,000 m in one Classic run' },
  { id:'boss_slayer',    icon:'\u{1F534}',     name:'BOSS SLAYER',       desc:'Score in Boss Rush' },
  { id:'apex',           icon:'\u{1F4A5}',     name:'APEX PREDATOR',     desc:'Score 25,000 in Boss Rush' },
  { id:'forged',         icon:'\u2694\uFE0F',  name:'FORGED',            desc:'Clear the first Gauntlet sector' },
  { id:'iron_run',       icon:'\u{1F3C6}',     name:'IRON RUN',          desc:'Clear all Gauntlet sectors' },
  { id:'pathfinder',     icon:'\u{1F5FA}\uFE0F', name:'PATHFINDER',     desc:'Clear any Campaign location' },
  { id:'coast_to_coast', icon:'\u{1F305}',     name:'COAST TO COAST',    desc:'Clear all Campaign locations' },
  { id:'gearhead',       icon:'\u{1F527}',     name:'GEARHEAD',          desc:'Apply 10 upgrades to vehicles' },
  { id:'fully_loaded',   icon:'\u{1F529}',     name:'FULLY LOADED',      desc:'Max out all upgrades on one vehicle' },
  { id:'fleet',          icon:'\u{1F697}',     name:'FLEET OPERATOR',    desc:'Own 3 vehicles' },
  { id:'collector',      icon:'\u{1F3CE}\uFE0F', name:'COLLECTOR',      desc:'Own all vehicles' },
  { id:'wingman',        icon:'\u{1F91D}',     name:'WINGMAN',           desc:'Unlock any sidekick' },
  { id:'scrap_hound',    icon:'\u{1F4B0}',     name:'SCRAP HOUND',       desc:'Earn 10,000 lifetime scrap' },
  { id:'scrap_baron',    icon:'\u{1F48E}',     name:'SCRAP BARON',       desc:'Earn 50,000 lifetime scrap' },
  { id:'wild_wasteland', icon:'\u{1F3B2}',     name:'WILD WASTELAND',    desc:'Hit a 15-kill combo in a single run', hidden:true, hint:'Get weird enough, and the Mojave answers back.' },
  { id:'big_iron',       icon:'\u{1F920}',     name:'BIG IRON',          desc:'Score 30 kills in a single run', hidden:true, hint:'There is a certain swagger to solving everything with violence.' },
  { id:'junk_jet',       icon:'\u{1F9F0}',     name:'JUNK JET',          desc:'Earn 1,500 scrap in a single run', hidden:true, hint:'One driver’s roadside trash is another driver’s fortune.' },
  { id:'lonesome_road',  icon:'\u{1F6E3}\uFE0F', name:'LONESOME ROAD',   desc:'Travel 8,000 m in a single run', hidden:true, hint:'Just keep the motor hot and the ghosts in the rearview.' },
  { id:'old_world_blues',icon:'\u{1F9E0}',     name:'OLD WORLD BLUES',   desc:'Score 15,000 in Zombie Horde', hidden:true, hint:'The apocalypse can always get sillier.' },
  { id:'desert_survivalist', icon:'\u{1F343}', name:'DESERT SURVIVALIST', desc:'Finish a run without hitting a single innocent', hidden:true, hint:'Try acting like somebody raised you right.' },
  { id:'ncr_poster_child', icon:'\u{1F396}\uFE0F', name:'NCR POSTER CHILD', desc:'Finish 5 runs without hitting a single innocent', hidden:true, hint:'Keep your fenders clean long enough and the NCR notices.' },
  { id:'goodsprings_butcher', icon:'\u{1F62C}', name:'GOODSPRINGS BUTCHER', desc:'Hit 5 innocents in a single run', hidden:true, hint:'Even the raiders think that was low.' },
  { id:'full_mastery',   icon:'\u{1F4AA}',     name:'FULL MASTERY',      desc:'Clear all Campaign locations and all Gauntlet sectors', hidden:true, hint:'The road is yours. Every mile of it.' },
  { id:'throne_claimed', icon:'\u{1F451}',     name:'THRONE CLAIMED',    desc:'Complete the Iron Throne boss campaign', hidden:true, hint:'Eight warlords fall. The wasteland bows.' },
];
const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

function checkAchievementCondition(id, p) {
  switch (id) {
    case 'first_blood':    return p.runs >= 1;
    case 'survivor':       return p.runs >= 10;
    case 'road_warrior':   return p.runs >= 50;
    case 'legend':         return p.runs >= 100;
    case 'scorched':       return p.bestClassic >= 5000;
    case 'inferno':        return p.bestClassic >= 25000;
    case 'nuclear':        return p.bestClassic >= 75000;
    case 'drifter':        return (p.bestDistance || 0) >= 2000;
    case 'road_king':      return (p.bestDistance || 0) >= 5000;
    case 'boss_slayer':    return (p.bestBossRush || 0) > 0;
    case 'apex':           return (p.bestBossRush || 0) >= 25000;
    case 'forged':         return (p.gauntletCleared || []).length >= 1;
    case 'iron_run':       return (p.gauntletCleared || []).length >= LEVELS.length;
    case 'pathfinder':
      return CAMPAIGN_LOCATIONS.some(loc => {
        const cleared = ((p.campaignCleared || {})[loc.id] || {}).levelsCleared || [];
        return cleared.length >= loc.levels.length;
      });
    case 'coast_to_coast':
      return CAMPAIGN_LOCATIONS.every(loc => {
        const cleared = ((p.campaignCleared || {})[loc.id] || {}).levelsCleared || [];
        return cleared.length >= loc.levels.length;
      });
    case 'gearhead': {
      const total = Object.values(p.vehicleUpgrades || {}).reduce(
        (s, ups) => s + totalUpgradeTiers(ups), 0);
      return total >= 10;
    }
    case 'fully_loaded':
      return Object.keys(p.ownedVehicles || {}).some(vid => {
        if (!p.ownedVehicles[vid]) return false;
        const ups = p.vehicleUpgrades[vid] || {};
        return UPGRADE_TRACKS.every(t => (ups[t.id] || 0) >= t.tiers.length);
      });
    case 'fleet':
      return Object.values(p.ownedVehicles || {}).filter(Boolean).length >= 3;
    case 'collector':
      return Object.values(p.ownedVehicles || {}).filter(Boolean).length >= VEHICLES.length;
    case 'wingman':
      return SIDEKICKS.some(sk => {
        const loc = CAMPAIGN_LOCATIONS.find(l => l.id === sk.unlockLoc);
        if (!loc) return false;
        const cleared = ((p.campaignCleared || {})[loc.id] || {}).levelsCleared || [];
        return cleared.length >= loc.levels.length;
      });
    case 'scrap_hound':  return (p.lifetimeScrap || 0) >= 10000;
    case 'scrap_baron':  return (p.lifetimeScrap || 0) >= 50000;
    case 'wild_wasteland': return (p.bestCombo || 0) >= 15;
    case 'big_iron':       return (p.bestKills || 0) >= 30;
    case 'junk_jet':       return (p.bestScrapRun || 0) >= 1500;
    case 'lonesome_road':  return (p.bestDistance || 0) >= 8000;
    case 'old_world_blues': return (p.bestZombie || 0) >= 15000;
    case 'desert_survivalist': return (p.cleanRuns || 0) >= 1;
    case 'ncr_poster_child': return (p.cleanRuns || 0) >= 5;
    case 'goodsprings_butcher': return (p.maxCivilianHits || 0) >= CIVILIAN_INFAMY_HITS;
    case 'full_mastery':
      return Profile.isFullMasteryUnlocked();
    case 'throne_claimed': return (p.ironThroneCleared || []).length >= IRON_THRONE_STAGES.length;
    default: return false;
  }
}

// ============================================================
// PROFILE STORE
// ============================================================
const STORAGE_KEY = 'mojaveRun_profiles_v2';
const ACTIVE_KEY  = 'mojaveRun_activeProfile_v2';
const LEGACY_BEST = 'mojaveRunBest';
const UPGRADE_TRACK_DEFAULTS = Object.fromEntries(UPGRADE_TRACKS.map(t => [t.id, 0]));

const Profile = {
  _data: null,
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : { profiles: [] };
    } catch (e) { this._data = { profiles: [] }; }
    // migrate: ensure every profile has a characterId and complete upgrade keys
    if (this._data && Array.isArray(this._data.profiles)) {
      let dirty = false;
      this._data.profiles.forEach(p => {
        if (!p.characterId || !CHARACTER_BY_ID[p.characterId]) {
          p.characterId = DEFAULT_CHARACTER_ID;
          dirty = true;
        }
        if (typeof p.bestBossRush !== 'number') {
          p.bestBossRush = 0;
          dirty = true;
        }
        p.ownedVehicles = p.ownedVehicles || { rustbucket: true };
        p.vehicleUpgrades = p.vehicleUpgrades || {};
        p.vehicleBranches = p.vehicleBranches || {};
        Object.keys(p.ownedVehicles).forEach(vid => {
          if (!p.ownedVehicles[vid]) return;
          if (!p.vehicleUpgrades[vid]) {
            p.vehicleUpgrades[vid] = Object.assign({}, UPGRADE_TRACK_DEFAULTS);
            dirty = true;
            return;
          }
          for (const tid of Object.keys(UPGRADE_TRACK_DEFAULTS)) {
            if (typeof p.vehicleUpgrades[vid][tid] !== 'number') {
              p.vehicleUpgrades[vid][tid] = 0;
              dirty = true;
            }
          }
          if (!(vid in p.vehicleBranches)) {
            p.vehicleBranches[vid] = null;
            dirty = true;
          }
          const branchId = p.vehicleBranches[vid];
          if (branchId && !getVehicleBranchDef(vid, branchId)) {
            p.vehicleBranches[vid] = null;
            dirty = true;
          }
        });
        if (!p.campaignCleared) { p.campaignCleared = {}; dirty = true; }
        if (p.activeSidekick === undefined) { p.activeSidekick = null; dirty = true; }
        if (!Array.isArray(p.achievements)) { p.achievements = []; dirty = true; }
        if (typeof p.bestKills !== 'number') { p.bestKills = 0; dirty = true; }
        if (typeof p.bestCombo !== 'number') { p.bestCombo = 0; dirty = true; }
        if (typeof p.bestScrapRun !== 'number') { p.bestScrapRun = 0; dirty = true; }
        if (typeof p.totalCivilianHits !== 'number') { p.totalCivilianHits = 0; dirty = true; }
        if (typeof p.maxCivilianHits !== 'number') { p.maxCivilianHits = 0; dirty = true; }
        if (typeof p.cleanRuns !== 'number') { p.cleanRuns = 0; dirty = true; }
        if (typeof p.bestIronThrone !== 'number') { p.bestIronThrone = 0; dirty = true; }
        if (!Array.isArray(p.ironThroneCleared)) { p.ironThroneCleared = []; dirty = true; }
        if (!('bankedPowerup' in p)) { p.bankedPowerup = null; dirty = true; }
        if (normalizeCosmetics(p, true)) dirty = true;
      });
      if (dirty) this.save();
    }
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
  create(name, characterId) {
    name = (name || '').trim().toUpperCase().slice(0, 14);
    if (!name) throw new Error('Name required');
    if (this._data.profiles.some(p => p.name === name)) throw new Error('Name already used');
    if (this._data.profiles.length >= 6) throw new Error('Max 6 drivers');
    const cid = (characterId && CHARACTER_BY_ID[characterId]) ? characterId : DEFAULT_CHARACTER_ID;
    const p = {
      id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      characterId: cid,
      created: Date.now(),
      scrap: 100, // starter scrap
      lifetimeScrap: 0,
      runs: 0,
      bestClassic: 0,
      bestTime: 0,
      bestBossRush: 0,
      bestDistance: 0,
      bestZombie: 0,
      bestIronThrone: 0,
      bestKills: 0,
      bestCombo: 0,
      bestScrapRun: 0,
      totalCivilianHits: 0,
      maxCivilianHits: 0,
      cleanRuns: 0,
      ownedVehicles: { rustbucket: true },
      vehicleUpgrades: { rustbucket: { engine: 0, plating: 0, weapons: 0, reactor: 0 } },
      vehicleBranches: { rustbucket: null },
      activeVehicle: 'rustbucket',
      gauntletCleared: [], // array of cleared level numbers
      ironThroneCleared: [], // array of cleared Iron Throne stage numbers
      achievements: [],    // array of earned achievement IDs
      cosmetics: defaultCosmetics(),
      bankedPowerup: null, // power-up id to activate at the start of next run
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
    p.vehicleUpgrades[vehicleId] = { engine: 0, plating: 0, weapons: 0, reactor: 0 };
    p.vehicleBranches[vehicleId] = null;
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
  setCharacter(characterId) {
    const p = this.active(); if (!p) return false;
    if (!CHARACTER_BY_ID[characterId]) return false;
    p.characterId = characterId;
    this.save();
    return true;
  },
  selectBranch(vehicleId, branchId) {
    const p = this.active(); if (!p) return false;
    if (!p.ownedVehicles[vehicleId]) return false;
    const branch = getVehicleBranchDef(vehicleId, branchId); if (!branch) return false;
    const ups = p.vehicleUpgrades[vehicleId] || UPGRADE_TRACK_DEFAULTS;
    if (totalUpgradeTiers(ups) < (branch.unlockTotal || 8)) return false;
    p.vehicleBranches[vehicleId] = branchId;
    this.save();
    return true;
  },
  buyCosmetic(id) {
    const p = this.active(); if (!p) return false;
    const c = COSMETIC_BY_ID[id]; if (!c) return false;
    normalizeCosmetics(p);
    if (p.cosmetics.owned.includes(id)) return false;
    if (!isCosmeticConditionMet(c, p)) return false;
    const cost = c.cost || 0;
    if (p.scrap < cost) return false;
    p.scrap -= cost;
    p.cosmetics.owned.push(id);
    this.save();
    return true;
  },
  equipCosmetic(id) {
    const p = this.active(); if (!p) return false;
    const c = COSMETIC_BY_ID[id]; if (!c) return false;
    normalizeCosmetics(p);
    if (!p.cosmetics.owned.includes(id)) return false;
    if (c.category === 'paint') p.cosmetics.equippedPaint = id;
    else if (c.category === 'trail') p.cosmetics.equippedTrail = id;
    else if (c.category === 'horn') p.cosmetics.equippedHorn = id;
    else return false;
    this.save();
    return true;
  },
  checkCosmetics() {
    const p = this.active(); if (!p) return [];
    normalizeCosmetics(p);
    const newly = [];
    for (const c of Object.values(COSMETIC_BY_ID)) {
      if (p.cosmetics.owned.includes(c.id)) continue;
      if (c.unlock && isCosmeticConditionMet(c, p)) {
        p.cosmetics.owned.push(c.id);
        newly.push(c);
      }
    }
    if (newly.length) this.save();
    return newly;
  },
  equippedCosmetics() {
    const p = this.active(); if (!p) return defaultCosmetics();
    return normalizeCosmetics(p);
  },
  character() {
    const p = this.active();
    return p ? (CHARACTER_BY_ID[p.characterId] || CHARACTER_BY_ID[DEFAULT_CHARACTER_ID]) : null;
  },
  // Compute effective stats for a vehicle including upgrades
  effectiveStats(vehicleId) {
    const v = VEHICLE_BY_ID[vehicleId]; if (!v) return null;
    const p = this.active();
    const ups = (p && p.vehicleUpgrades && p.vehicleUpgrades[vehicleId]) || {engine:0,plating:0,weapons:0};
    const branchId = p && p.vehicleBranches ? p.vehicleBranches[vehicleId] : null;
    const branch = getVehicleBranchDef(vehicleId, branchId);
    const st = Object.assign({}, v.base);
    UPGRADE_TRACKS.forEach(t => t.apply(st, ups[t.id] || 0));
    applyVehicleBranchStats(st, branch);
    st.branchId = branch ? branch.id : null;
    st.branchName = branch ? branch.name : null;
    st.branchDesc = branch ? branch.desc : '';
    st.branchEffects = Object.assign({}, branch ? branch.effects : null);
    return st;
  },
  recordRunResult(result) {
    const p = this.active(); if (!p) return;
    p.runs += 1;
    if (result.mode === 'classic' && result.score > p.bestClassic) p.bestClassic = result.score;
    if (result.mode === 'timeattack' && result.score > p.bestTime) p.bestTime = result.score;
    if (result.mode === 'bossrush' && result.score > (p.bestBossRush || 0)) p.bestBossRush = result.score;
    if (result.mode === 'classic' && result.distance > p.bestDistance) p.bestDistance = result.distance;
    if (result.mode === 'zombie' && result.score > (p.bestZombie || 0)) p.bestZombie = result.score;
    if ((result.kills || 0) > (p.bestKills || 0)) p.bestKills = result.kills || 0;
    if ((result.comboBest || 0) > (p.bestCombo || 0)) p.bestCombo = result.comboBest || 0;
    if ((result.scrapEarned || 0) > (p.bestScrapRun || 0)) p.bestScrapRun = result.scrapEarned || 0;
    p.totalCivilianHits = (p.totalCivilianHits || 0) + (result.civiliansHit || 0);
    if ((result.civiliansHit || 0) > (p.maxCivilianHits || 0)) p.maxCivilianHits = result.civiliansHit || 0;
    if ((result.civiliansHit || 0) === 0) p.cleanRuns = (p.cleanRuns || 0) + 1;
    if (result.mode === 'daily' && result.dailySeedKey) {
      p.dailyBest = p.dailyBest || {};
      const prev = p.dailyBest[result.dailySeedKey] || 0;
      if (result.score > prev) p.dailyBest[result.dailySeedKey] = result.score;
    }
    if (result.mode === 'gauntlet' && result.victory && result.level && !p.gauntletCleared.includes(result.level)) {
      p.gauntletCleared.push(result.level);
      p.gauntletCleared.sort((a,b)=>a-b);
    }
    if (result.mode === 'ironthrone' && result.score > (p.bestIronThrone || 0)) p.bestIronThrone = result.score;
    if (result.mode === 'ironthrone' && result.victory && result.ironThroneStage) {
      if (!p.ironThroneCleared) p.ironThroneCleared = [];
      if (!p.ironThroneCleared.includes(result.ironThroneStage)) {
        p.ironThroneCleared.push(result.ironThroneStage);
        p.ironThroneCleared.sort((a, b) => a - b);
      }
    }
    this.save();
  },
  isLevelUnlocked(num) {
    if (num === 1) return true;
    const p = this.active(); if (!p) return false;
    return p.gauntletCleared.includes(num - 1);
  },
  // ---- CAMPAIGN ----
  isCampaignLevelUnlocked(locId, levelNum) {
    const locIdx = CAMPAIGN_LOCATIONS.findIndex(l => l.id === locId);
    if (locIdx < 0) return false;
    const p = this.active(); if (!p) return false;
    p.campaignCleared = p.campaignCleared || {};
    if (levelNum === 1) {
      if (locIdx === 0) return true;
      const prevLoc = CAMPAIGN_LOCATIONS[locIdx - 1];
      return this.isCampaignLocationCleared(prevLoc.id);
    }
    const cleared = (p.campaignCleared[locId] || {}).levelsCleared || [];
    return cleared.includes(levelNum - 1);
  },
  isCampaignLocationCleared(locId) {
    const loc = CAMPAIGN_LOCATIONS.find(l => l.id === locId);
    if (!loc) return false;
    const p = this.active(); if (!p) return false;
    const cleared = ((p.campaignCleared || {})[locId] || {}).levelsCleared || [];
    return cleared.length >= loc.levels.length;
  },
  campaignLevelsCleared() {
    return getCampaignLevelsCleared(this.active());
  },
  isZombieModeUnlocked() {
    return this.campaignLevelsCleared() >= ZOMBIE_UNLOCK_CAMPAIGN_LEVELS;
  },
  isFullMasteryUnlocked() {
    const p = this.active(); if (!p) return false;
    const allCampaign = CAMPAIGN_LOCATIONS.every(loc => {
      const cleared = ((p.campaignCleared || {})[loc.id] || {}).levelsCleared || [];
      return cleared.length >= loc.levels.length;
    });
    const allGauntlet = GAUNTLET_SECTORS.length > 0 && GAUNTLET_SECTORS.every(L => (p.gauntletCleared || []).includes(L.num));
    return allCampaign && allGauntlet;
  },
  // Grant the WARLORD KING vehicle automatically when full mastery is first achieved.
  // Returns true if the vehicle was newly granted.
  checkMasteryVehicleGrant() {
    const p = this.active(); if (!p) return false;
    if (!this.isFullMasteryUnlocked()) return false;
    if (p.ownedVehicles['warlordking']) return false;
    p.ownedVehicles['warlordking'] = true;
    p.vehicleUpgrades['warlordking'] = Object.assign({}, UPGRADE_TRACK_DEFAULTS);
    p.vehicleBranches['warlordking'] = null;
    this.save();
    return true;
  },
  isIronThroneStageUnlocked(stageNum) {
    if (stageNum === 1) return this.isFullMasteryUnlocked();
    const p = this.active(); if (!p) return false;
    return (p.ironThroneCleared || []).includes(stageNum - 1);
  },
  recordIronThroneStage(stageNum) {
    const p = this.active(); if (!p) return;
    if (!p.ironThroneCleared) p.ironThroneCleared = [];
    if (!p.ironThroneCleared.includes(stageNum)) {
      p.ironThroneCleared.push(stageNum);
      p.ironThroneCleared.sort((a, b) => a - b);
    }
    this.save();
  },
  recordCampaignLevel(locId, levelNum) {
    const p = this.active(); if (!p) return null;
    p.campaignCleared = p.campaignCleared || {};
    if (!p.campaignCleared[locId]) p.campaignCleared[locId] = { levelsCleared: [] };
    const arr = p.campaignCleared[locId].levelsCleared;
    if (!arr.includes(levelNum)) { arr.push(levelNum); arr.sort((a, b) => a - b); }
    this.save();
    const loc = CAMPAIGN_LOCATIONS.find(l => l.id === locId);
    if (loc && loc.sidekickUnlock && arr.length >= loc.levels.length) {
      if (!p.activeSidekick) { p.activeSidekick = loc.sidekickUnlock; this.save(); }
      return loc.sidekickUnlock;
    }
    return null;
  },
  setSidekick(id) {
    const p = this.active(); if (!p) return false;
    if (id !== null && !SIDEKICK_BY_ID[id]) return false;
    p.activeSidekick = id;
    this.save();
    return true;
  },
  isSidekickUnlocked(id) {
    const sk = SIDEKICK_BY_ID[id]; if (!sk) return false;
    return this.isCampaignLocationCleared(sk.unlockLoc);
  },
  // Bank a power-up id to be activated at the start of the next run.
  bankPowerup(id) {
    const p = this.active(); if (!p) return;
    p.bankedPowerup = id;
    this.save();
  },
  // Consume and return the banked power-up id (or null). Clears the slot.
  consumeBankedPowerup() {
    const p = this.active(); if (!p || !p.bankedPowerup) return null;
    const id = p.bankedPowerup;
    p.bankedPowerup = null;
    this.save();
    return id;
  },
  // Check all achievements and award any not yet earned. Returns newly earned array.
  checkAchievements() {
    const p = this.active(); if (!p) return [];
    if (!Array.isArray(p.achievements)) p.achievements = [];
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (!p.achievements.includes(a.id) && checkAchievementCondition(a.id, p)) {
        p.achievements.push(a.id);
        newly.push(a);
      }
    }
    if (newly.length) this.save();
    return newly;
  },
};

// ============================================================
// SETTINGS — user-tunable UX/accessibility/audio preferences
// ============================================================
// Persisted across sessions. Sensible defaults so first-run "just works".
// Used by the SFX layer (volume), render (shake), emit() (particle count),
// haptics, and the menu DOM (large-touch-target body class).
const SETTINGS_KEY = 'mojaveRun_settings_v1';
const Settings = {
  // master volume multiplier 0..1
  master: 1.0,
  // SFX volume multiplier 0..1 (combines with master)
  sfx: 1.0,
  // screen-shake intensity multiplier 0..1.5
  shake: 1.0,
  // particle density multiplier 0..1.5 (gameplay-cosmetic only)
  particles: 1.0,
  // navigator.vibrate-based haptic feedback on key events
  haptics: true,
  // 1.5x hit areas for menu buttons (accessibility)
  bigButtons: false,
  // always fire while driving (assist)
  autoFire: false,
  // show incoming/outgoing damage numbers
  damageNumbers: true,
  // darker HUD backing + brighter labels for readability
  hudContrast: false,
  load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (typeof o.master === 'number')    this.master    = clampSet(o.master, 0, 1);
      if (typeof o.sfx === 'number')       this.sfx       = clampSet(o.sfx, 0, 1);
       if (typeof o.shake === 'number')     this.shake     = clampSet(o.shake, 0, 1.5);
       if (typeof o.particles === 'number') this.particles = clampSet(o.particles, 0, 1.5);
       if (typeof o.haptics === 'boolean')  this.haptics   = o.haptics;
       if (typeof o.bigButtons === 'boolean') this.bigButtons = o.bigButtons;
       if (typeof o.autoFire === 'boolean') this.autoFire = o.autoFire;
       if (typeof o.damageNumbers === 'boolean') this.damageNumbers = o.damageNumbers;
       if (typeof o.hudContrast === 'boolean') this.hudContrast = o.hudContrast;
    } catch (_) {}
  },
  save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        master: this.master, sfx: this.sfx, shake: this.shake,
        particles: this.particles, haptics: this.haptics, bigButtons: this.bigButtons,
        autoFire: this.autoFire, damageNumbers: this.damageNumbers, hudContrast: this.hudContrast,
      }));
    } catch (_) {}
    this.applyBodyClass();
  },
  applyBodyClass() {
    document.body.classList.toggle('big-touch', !!this.bigButtons);
  },
};
// local clamp (real `clamp` is defined later in HELPERS section)
function clampSet(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// ============================================================
// HAPTICS — opt-in vibration patterns for key events
// ============================================================
// All calls are no-ops on devices without `navigator.vibrate` or when the
// player has disabled haptics in Settings. Patterns are short to respect
// battery & UX (no buzz spam during heavy combat).
const Haptics = {
  _can: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
  vibrate(pattern) {
    if (!this._can || !Settings.haptics) return;
    try { navigator.vibrate(pattern); } catch (_) {}
  },
  hit()      { this.vibrate(40); },         // player took damage
  kill()     { this.vibrate(15); },         // small confirmation
  pickup()   { this.vibrate([0, 12, 18, 12]); },
  scrap()    { this.vibrate(10); },
  death()    { this.vibrate([0, 80, 60, 120, 60, 200]); },
  bossWarn() { this.vibrate([0, 60, 40, 60, 40, 60]); },
  victory()  { this.vibrate([0, 30, 30, 30, 30, 80]); },
};

// ============================================================
// SEEDED RNG — used by Daily Challenge so the run is identical for
// everyone playing on the same calendar day. Wraps Math.random for the
// duration of the run, then restores the original on endRun.
// ============================================================
const _origMathRandom = Math.random;
let _seededActive = false;
function todaySeedString() {
  const d = new Date();
  // use UTC date so the daily flips at the same instant for all players
  return d.getUTCFullYear() + '-' +
         String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
         String(d.getUTCDate()).padStart(2, '0');
}
function seedFromString(str) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function makeMulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function activateSeededRng(seed) {
  if (_seededActive) return;
  Math.random = makeMulberry32(seed);
  _seededActive = true;
}
function restoreRng() {
  if (!_seededActive) return;
  Math.random = _origMathRandom;
  _seededActive = false;
}

const BIOME_KEYS = Object.keys(BIOME_THEMES);
function pickBiome(mode, levelData, dailySeedKey) {
  if (levelData && levelData.map && BIOME_THEMES[levelData.map]) return levelData.map;
  if (mode === 'daily' && dailySeedKey) {
    const seeded = seedFromString('biome-' + dailySeedKey);
    const idx = ((seeded % BIOME_KEYS.length) + BIOME_KEYS.length) % BIOME_KEYS.length;
    return BIOME_KEYS[idx];
  }
  if (mode === 'timeattack') return 'redcanyon';
  return 'wastes';
}
function getCharacterPerkState(characterId) {
  const perks = {
    opal:    { scrapMul: 1.05, killScoreMul: 1.00, nightVisionMul: 1.00 },
    ophelia: { scrapMul: 1.00, killScoreMul: 1.00, nightVisionMul: 1.20 },
    abigail: { scrapMul: 1.00, killScoreMul: 1.05, nightVisionMul: 1.00 },
    nox:     { scrapMul: 1.00, killScoreMul: 1.08, nightVisionMul: 1.10 },
    ram:     { scrapMul: 1.10, killScoreMul: 1.00, nightVisionMul: 1.00 },
    vega:    { scrapMul: 1.00, killScoreMul: 1.00, nightVisionMul: 1.00, damageTakenMul: 0.88 },
  };
  return perks[characterId] ?? perks[DEFAULT_CHARACTER_ID];
}

const RUN_MUTATOR_DEFS = {
  scavenger: { id:'scavenger', name:'SCAVENGER', desc:'More scrap and supply drops.' },
  blackout:  { id:'blackout',  name:'BLACKOUT',  desc:'Night conditions linger longer.' },
  volatile:  { id:'volatile',  name:'VOLATILE',  desc:'Explosive hazards and pulse drops.' },
  hotstreak: { id:'hotstreak', name:'HOT STREAK', desc:'Bonus chains in Time Attack.' },
  bosschain: { id:'bosschain', name:'BOSS CHAIN', desc:'Bosses arrive without rest.' },
};

const BOSS_RUSH_STAGES = [1, 2, 3, 4, 5];

function pickDailyMutator(seedKey) {
  const ids = ['scavenger', 'blackout', 'volatile'];
  const seeded = seedFromString('daily-mutator-' + seedKey);
  return ids[((seeded % ids.length) + ids.length) % ids.length];
}

function getRunMutators(mode, levelData, dailySeedKey) {
  const mutators = [];
  if (mode === 'daily' && dailySeedKey) {
    mutators.push(RUN_MUTATOR_DEFS[pickDailyMutator(dailySeedKey)]);
  }
  if (mode === 'timeattack') {
    mutators.push(RUN_MUTATOR_DEFS.hotstreak);
  }
  if (mode === 'bossrush') {
    mutators.push(RUN_MUTATOR_DEFS.bosschain);
  }
  if (mode === 'gauntlet' && levelData) {
    if (levelData.map === 'midnight' || levelData.night) mutators.push(RUN_MUTATOR_DEFS.blackout);
    if (levelData.map === 'ash' || levelData.storm) mutators.push(RUN_MUTATOR_DEFS.volatile);
  }
  return mutators.filter(Boolean);
}

function announceEvent(text, color = '#ffe07a') {
  addPopup(text, W * 0.5, H * 0.24, color, 18);
  Game.eventBanner = { text, color, t: 2.2, max: 2.2 };
}

// ============================================================
// CANVAS
// ============================================================
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1;
const DPR_CAP = IS_MOBILE ? 1.5 : 2;
// Keep mobile floor lower for thermal/battery headroom; keep desktop floor
// higher so text/HUD stay sharp on larger screens.
const MIN_RENDER_SCALE = IS_MOBILE ? 0.7 : 0.85;
const MIN_DPR = IS_MOBILE ? 0.75 : 1;
const DPR_CHANGE_THRESHOLD = 0.01;
const ORIENTATION_CHANGE_DELAY_MS = 160;
const SCALE_PENALTY_LOW_MEMORY = 0.15;
const SCALE_PENALTY_LOW_CORES = 0.1;
let renderScale = (() => {
  let scale = IS_MOBILE ? 0.95 : 1;
  const mem = Number(navigator.deviceMemory || 0);
  const cores = Number(navigator.hardwareConcurrency || 0);
  const memPenalty = (mem && mem <= 2) ? SCALE_PENALTY_LOW_MEMORY : 0;
  const corePenalty = (cores && cores <= 4) ? SCALE_PENALTY_LOW_CORES : 0;
  scale -= Math.max(memPenalty, corePenalty);
  return Math.min(1, Math.max(MIN_RENDER_SCALE, scale));
})();
let _resizeRaf = 0;
let _resizeTimer = 0;

// Cached gradients — rebuilt only when their inputs change (size or sky state)
// so we don't allocate per frame. The sky/road gradients are also keyed by
// isNight/isStorm and lazily rebuilt from drawBackground / drawRoad when those
// flags change mid-run (e.g. day -> night transition between gauntlet sectors).
let VIGNETTE_PLAY = null;
let VIGNETTE_MENU = null;
let SKY_GRAD = null;
let ROAD_GRAD = null;
let _skyKey = '';
let _roadKey = '';
function activeBiomeTheme() {
  const id = (Game && Game.biome) || 'wastes';
  return BIOME_THEMES[id] || BIOME_THEMES.wastes;
}
function rebuildGradients() {
  VIGNETTE_PLAY = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
  VIGNETTE_PLAY.addColorStop(0, 'rgba(0,0,0,0)');
  VIGNETTE_PLAY.addColorStop(1, 'rgba(0,0,0,0.55)');
  VIGNETTE_MENU = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
  VIGNETTE_MENU.addColorStop(0, 'rgba(0,0,0,0)');
  VIGNETTE_MENU.addColorStop(1, 'rgba(0,0,0,0.7)');
  // invalidate sky/road caches so they rebuild against the new W/H
  _skyKey = ''; _roadKey = '';
}
function getSkyGradient() {
  const biome = (Game && Game.biome) || 'wastes';
  const key = `${W}x${H}|${Game.isNight?1:0}|${Game.isStorm?1:0}|${biome}`;
  if (key === _skyKey && SKY_GRAD) return SKY_GRAD;
  const t = activeBiomeTheme();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (Game.isNight) {
    g.addColorStop(0, Game.isStorm ? t.skyNightStormTop : t.skyNightTop);
    g.addColorStop(0.35, Game.isStorm ? t.skyNightStormMid : t.skyNightMid);
    g.addColorStop(1, t.skyNightBottom);
  } else {
    g.addColorStop(0, Game.isStorm ? t.skyStormTop : t.skyDayTop);
    g.addColorStop(0.4, Game.isStorm ? t.skyStormMid : t.skyDayMid);
    g.addColorStop(1, t.skyDayBottom);
  }
  SKY_GRAD = g; _skyKey = key;
  return g;
}
function getRoadGradient(x0, x1) {
  const biome = (Game && Game.biome) || 'wastes';
  const key = `${x0}|${x1}|${Game.isNight?1:0}|${biome}`;
  if (key === _roadKey && ROAD_GRAD) return ROAD_GRAD;
  const t = activeBiomeTheme();
  const rg = ctx.createLinearGradient(x0, 0, x1, 0);
  if (Game.isNight) {
    rg.addColorStop(0, t.roadNightA);
    rg.addColorStop(0.5, t.roadNightB);
    rg.addColorStop(1, t.roadNightA);
  } else {
    rg.addColorStop(0, t.roadDayA);
    rg.addColorStop(0.5, t.roadDayB);
    rg.addColorStop(1, t.roadDayA);
  }
  ROAD_GRAD = rg; _roadKey = key;
  return rg;
}

function resize() {
  const vv = window.visualViewport;
  const nextW = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
  const nextH = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
  const wantedDpr = (window.devicePixelRatio || 1) * renderScale;
  const nextDpr = Math.round(Math.min(DPR_CAP, Math.max(MIN_DPR, wantedDpr)) * 100) / 100;
  const sameSize = (nextW === W && nextH === H);
  const tinyDprChange = Math.abs(nextDpr - DPR) < DPR_CHANGE_THRESHOLD;
  if (sameSize && tinyDprChange) return;
  DPR = nextDpr;
  W = nextW;
  H = nextH;
  cvs.width  = Math.floor(W * DPR);
  cvs.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  rebuildGradients();
  if (Game.player) {
    const { x0, x1 } = roadBounds();
    Game.player.x = clamp(Game.player.x, x0 + Game.player.w/2 + 4, x1 - Game.player.w/2 - 4);
    Game.player.y = H - 110;
  }
}
function queueResize(delay = 0) {
  if (delay > 0) {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => queueResize(0), delay);
    return;
  }
  if (_resizeRaf) return;
  _resizeRaf = requestAnimationFrame(() => {
    _resizeRaf = 0;
    resize();
  });
}
window.addEventListener('resize', () => queueResize());
window.addEventListener('orientationchange', () => queueResize(ORIENTATION_CHANGE_DELAY_MS));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => queueResize());
  window.visualViewport.addEventListener('scroll', () => queueResize());
}

// ============================================================
// AUDIO
// ============================================================
let audioCtx = null;
const GUNSHOT_PITCH_JITTER_WIDTH = 32;
const GUNSHOT_CRACK_MIN_SAMPLES = 64;
const GUNSHOT_CRACK_FILTER_BASE_FREQ = 2600;
const GUNSHOT_CRACK_FILTER_FREQ_VARIANCE = 500;
const GUNSHOT_CRACK_FILTER_Q = 0.7;
const gunshotCrackBufferCache = new Map();
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
}
function getGunshotCrackBuffer(length) {
  if (!audioCtx || length <= 0) return null;
  let buf = gunshotCrackBufferCache.get(length);
  if (buf) return buf;
  buf = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let sampleIndex = 0; sampleIndex < data.length; sampleIndex++) data[sampleIndex] = (Math.random() * 2 - 1) * (1 - sampleIndex / data.length);
  gunshotCrackBufferCache.set(length, buf);
  return buf;
}
function blip(freq, dur, type='square', vol=0.08, slide=0) {
  if (!audioCtx) return;
  vol *= Settings.master * Settings.sfx;
  if (vol <= 0.0001) return;
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
  vol *= Settings.master * Settings.sfx;
  if (vol <= 0.0001) return;
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
function gunShot(baseFreq=140, dur=0.07, vol=0.1, crackVol=0.5) {
  if (!audioCtx) return;
  const outVol = vol * Settings.master * Settings.sfx;
  if (outVol <= 0.0001) return;
  const t = audioCtx.currentTime;

  // Low-frequency thump — sub-200 Hz punch felt as impact, not heard as a beep
  const kick = audioCtx.createOscillator();
  const kickEnv = audioCtx.createGain();
  kick.type = 'sine';
  const kickFreq = baseFreq * (1 + (Math.random() - 0.5) * 0.14);
  kick.frequency.setValueAtTime(kickFreq, t);
  kick.frequency.exponentialRampToValueAtTime(Math.max(24, kickFreq * 0.2), t + 0.038);
  kickEnv.gain.setValueAtTime(outVol, t);
  kickEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  kick.connect(kickEnv).connect(audioCtx.destination);
  kick.start(t); kick.stop(t + 0.045);

  // High-frequency noise crack — crisp, non-tonal shot character
  const crackDur = Math.max(0.022, dur * 0.5);
  const crackSamples = Math.max(GUNSHOT_CRACK_MIN_SAMPLES, Math.floor(audioCtx.sampleRate * crackDur));
  const crackBuf = getGunshotCrackBuffer(crackSamples);
  if (crackBuf) {
    const crack = audioCtx.createBufferSource();
    crack.buffer = crackBuf;
    const crackFilter = audioCtx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(GUNSHOT_CRACK_FILTER_BASE_FREQ + Math.random() * GUNSHOT_CRACK_FILTER_FREQ_VARIANCE, t);
    crackFilter.Q.value = GUNSHOT_CRACK_FILTER_Q;
    const crackGain = audioCtx.createGain();
    crackGain.gain.setValueAtTime(outVol * crackVol, t);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, t + crackDur);
    crack.connect(crackFilter).connect(crackGain).connect(audioCtx.destination);
    crack.start(t);
  }
}
const SFX = {
  shoot: () => gunShot(140, 0.07, 0.1, 0.5),
  bigShot: () => { gunShot(100, 0.12, 0.15, 0.65); noise(0.18, 0.09, 900); },
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
  powerUp:() => { [523,659,880,1175].forEach((f,i)=>setTimeout(()=>blip(f,0.09,'triangle',0.08),i*60)); },
  shieldOn:() => { blip(330,0.18,'sine',0.1); setTimeout(()=>blip(660,0.22,'sine',0.08),80); },
  nitroOn:() => { noise(0.35,0.18,2200); blip(180,0.25,'sawtooth',0.1,400); },
  combo:  (tier) => { const f = 440 + Math.min(tier,12) * 80; blip(f, 0.08, 'square', 0.06); blip(f*1.5, 0.05, 'triangle', 0.04); },
  mortar: () => { blip(60,0.5,'sawtooth',0.08,-20); noise(0.35,0.12,500); },
  rocket: () => { blip(140,0.35,'square',0.07,-60); noise(0.22,0.1,1800); },
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
  n = Math.max(1, Math.round(n * PARTICLE_SCALE * Settings.particles));
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
// POWER-UPS, COMBOS, WEAPON MODES
// ============================================================
// Power-up definitions: id -> { name, color, dur, glyph }
const POWERUPS = {
  shield: { name:'SHIELD',     color:'#7aaaff', dur:6.0,  glyph:'◉' },
  triple: { name:'TRIPLE FIRE',color:'#ff8a3d', dur:9.0,  glyph:'⊻' },
  rapid:  { name:'RAPID FIRE', color:'#ffe07a', dur:9.0,  glyph:'»' },
  nitro:  { name:'NITRO',      color:'#7af0ff', dur:3.5,  glyph:'»»' },
  magnet: { name:'MAGNET',     color:'#f070ff', dur:8.0,  glyph:'⌒' },
  x2:     { name:'SCORE x2',   color:'#7af07a', dur:10.0, glyph:'×2' },
  overdrive: { name:'OVERDRIVE', color:'#ff7050', dur:8.0, glyph:'!>' },
  salvage:   { name:'SALVAGE',   color:'#d2ff6f', dur:10.0, glyph:'+$' },
  pulse:     { name:'PULSE',     color:'#8ec5ff', dur:8.0, glyph:'~' },
  // Horde-clearer: instant detonation that wipes every on-screen enemy and
  // clears all enemy bullets. Picked up only during boss horde levels.
  nuke:      { name:'HORDE NUKE',color:'#ff3a3a', dur:0.5, glyph:'☢' },
  // Siege mode: massive player upgrade granted at the start of boss horde
  // levels. Doubles damage, fires center super-laser + side miniguns.
  // Effectively permanent for the duration of the horde fight.
  siege:     { name:'SIEGE MODE',color:'#ffd86b', dur:90.0, glyph:'⚡' },
  // Homing: bullets curve toward the nearest enemy — great crowd-clearing tool.
  homing:    { name:'HOMING SHOTS', color:'#ff6fff', dur:10.0, glyph:'⊙' },
  // Armor: plating absorbs half incoming damage for its duration.
  armor:     { name:'ARMOR PLATING', color:'#b8c8ff', dur:12.0, glyph:'▣' },
};
const POWERUP_KEYS = Object.keys(POWERUPS);
const SALVAGE_MAGNET_BONUS = 40;
const BOSS_RUSH_REWARD_BASE = 1200;
const BOSS_RUSH_REWARD_PER_STAGE = 250;
const BASE_RAM_DAMAGE = 10;
const PULSE_DAMAGE = { normal: 1.5, elite: 2 };
const ENEMY_SCORE = { buggy: 150, bike: 200, mortar: 250, drone: 200, tank: 350, zombie: 80 };
const ELITE_SCORE_MULTIPLIER = 1.8;
const AMBUSH_SPAWN_MULTIPLIER = 0.72;
const CIVILIAN_PENALTY = 200;   // score lost when hitting a civilian car
// Spinout tuning constants
const SPINOUT_DURATION    = 2.2;  // seconds the player is out of control
const SPINOUT_ROT_DECAY   = 0.18; // pow base for angular velocity exponential decay per dt
const SPINOUT_OSC_FREQ    = 4.8;  // oscillation frequency (rad/s) of the side-to-side drift
const HITCHHIKER_DRIFT_SPEED = 5; // px/s at which hitchhikers wander toward the road center
const CIVILIAN_WARNING_HITS = 1;
const CIVILIAN_MANHUNT_HITS = 3;
const CIVILIAN_INFAMY_HITS = 5;
// Obstacle kinds that represent innocents (must be missed). Kids and big-wheel
// riders share the civilian penalty/collision behavior — they're just
// pedestrians/toy cars rather than full civilian vehicles.
const INNOCENT_OBSTACLE_KINDS = { civilian: true, kid: true, bigwheel: true, hitchhiker: true };
function isInnocentObstacle(o) { return !!(o && INNOCENT_OBSTACLE_KINDS[o.kind]); }
// Campaign location index at which child pedestrians and Big Wheel toy cars
// start appearing. Index 6 = Amarillo (TX) — i.e. once the campaign reaches
// the inhabited heartland, you start seeing kids on the road.
const LATE_CAMPAIGN_LOC_IDX = 6;
function currentCampaignLocIdx() {
  if (Game.mode !== 'campaign' || !Game.campaignLevelId) return -1;
  const ce = CAMPAIGN_LEVEL_MAP[Game.campaignLevelId];
  return ce ? ce.locIdx : -1;
}
// Zombie horde burst spawn distance thresholds — horde grows denser past these
const ZOMBIE_BURST_DIST_1 = 2500;  // first burst tier: occasional double-spawn
const ZOMBIE_BURST_DIST_2 = 6000;  // second burst tier: triple-spawn waves
// Scrap earned in a single zombie-mode run is capped to prevent economy exploits
const ZOMBIE_SCRAP_CAP = 4000;

const COMBO_WINDOW = 2.5;          // seconds between kills to keep combo
const COMBO_THRESHOLDS = [0, 3, 6, 10, 15, 22, 30]; // combo count for each multiplier tier
const COMBO_MULTS      = [1, 2, 3, 4, 5, 7, 10];
const RUN_MOMENT_LEGENDARY_COMBO = 30;
const RUN_MOMENT_STRONG_COMBO = 15;
const RUN_MOMENT_BIG_SCRAP = 1000;
const RUN_MOMENT_SWEEP_KILLS = 50;
const RUN_MOMENT_LONG_HAUL_DISTANCE = 2000;
const KILL_STREAK_LABEL = ' KILL STREAK';

function getWastelandReputation() {
  // These are end-of-run flavor titles, not a second achievement list.
  // Priority order is intentional: monstrous civilian casualty runs should
  // override the cooler "style" reputations players can also qualify for.
  if ((Game.civiliansHit || 0) >= CIVILIAN_INFAMY_HITS) return 'GOODSPRINGS BUTCHER';
  if ((Game.civiliansHit || 0) >= CIVILIAN_MANHUNT_HITS) return 'NCR PUBLIC ENEMY';
  if ((Game.civiliansHit || 0) === 0 && Game.kills >= 30) return 'CLEAN GETAWAY';
  if ((Game.comboBest || 0) >= 15) return 'WILD WASTELAND';
  if (Game.mode === 'zombie' && Game.score >= 15000) return 'OLD WORLD BLUES';
  if (Game.scrapEarned >= 1500) return 'JUNK JET';
  if (Game.distance >= 8000) return 'LONESOME ROAD';
  if (Game.kills >= 30) return 'BIG IRON';
  return 'MOJAVE DRIFTER';
}

// Returns how many Iron Throne stages have been cleared in the current run.
// ironThroneStage is incremented on boss death, so subtract 1 and clamp.
function ironThroneStagesCleared() {
  return Math.max(0, Math.min(Game.ironThroneStage - 1, IRON_THRONE_STAGES.length));
}

function comboMult() {
  const c = Game.combo | 0;
  let m = 1;
  for (let i = 0; i < COMBO_THRESHOLDS.length; i++) {
    if (c >= COMBO_THRESHOLDS[i]) m = COMBO_MULTS[i];
  }
  return m;
}

function applyKill(x, y, baseScore) {
  baseScore *= Game.killScoreMul;
  const prev = comboMult();
  Game.combo = (Game.combo | 0) + 1;
  Game.comboT = COMBO_WINDOW;
  Game.kills += 1;
  if (Game.combo > Game.comboBest) Game.comboBest = Game.combo;
  const mult = comboMult();
  const x2 = isPowerupActive('x2') ? 2 : 1;
  const score = Math.round(baseScore * mult * x2);
  Game.score += score;
  // tier-up effects
  if (mult > prev) {
    SFX.combo(mult);
    addPopup('×' + mult + ' COMBO!', W * 0.5, H * 0.32, '#ffe07a', 22);
    Game.shake = Math.max(Game.shake, 0.4);
  }
  const label = (x2 > 1 ? 'x2 ' : '') + '+' + score + (mult > 1 ? ' ×' + mult : '');
  addPopup(label, x, y - 18, mult > 1 ? '#ffe07a' : '#ffd86b', mult > 1 ? 16 : 14);
}

function applyCivilianPenalty(x, y, kind) {
  const penalty = CIVILIAN_PENALTY;
  Game.civiliansHit = (Game.civiliansHit || 0) + 1;
  Game.score = Math.max(0, Game.score - penalty);
  // break combo
  Game.combo = 0;
  Game.comboT = 0;
  SFX.hit();
  Game.flash = Math.max(Game.flash, 0.6);
  let label;
  if (kind === 'kid' || kind === 'bigwheel') label = '⚠ KID! -';
  else if (kind === 'hitchhiker') label = '⚠ HITCHHIKER! -';
  else label = '⚠ CIVILIAN! -';
  addPopup(label + penalty, x, y - 22, '#4aa8e8', 16);
  shockwave(x, y, 'rgba(74,168,232,0.5)', 80);
  if (Game.civiliansHit === CIVILIAN_WARNING_HITS) UI.toast('RADIO: THOSE WERE CIVILIANS', 2200);
  else if (Game.civiliansHit === CIVILIAN_MANHUNT_HITS) UI.toast('NCR DISPATCH: YOU ARE NOW THE STORY', 2500);
  else if (Game.civiliansHit === CIVILIAN_INFAMY_HITS) UI.toast('EVEN THE RAIDERS THINK THIS IS MESSED UP', 2800);
}

// Spinout sequence — triggered when the player car hits a hitchhiker on the
// road shoulder. The car loses control for ~2.2 seconds: it spins, drifts
// side-to-side and may slam into obstacles before the driver regains control.
function startSpinout(hitX, hitY) {
  if (Game.spinout) return; // already in a spinout — don't stack
  // Kick direction: spin toward the side the hitchhiker was on
  const dir = (Game.player && hitX < Game.player.x) ? -1 : 1;
  Game.spinout = {
    t:       0,
    dur:     SPINOUT_DURATION,
    rot:     0,
    rotV:    (7 + Math.random() * 6) * dir,  // radians/s initial spin
    kickDir: dir,
  };
  if (Game.player) Game.player.vx = dir * 360;
  // Cinematic effects
  Game.shake = Math.max(Game.shake, 1.2);
  Game.flash = Math.max(Game.flash, 0.8);
  SFX.hit();
  Haptics.death();
  shockwave(hitX, hitY, 'rgba(255,200,80,0.65)', 110);
  emit(hitX, hitY, 28, { color: '#ffb36a', speed: 300, life: 0.8, size: 5 });
  emit(hitX, hitY, 12, { color: '#ffe07a', speed: 180, life: 0.5, size: 3 });
  addPopup('⚠ SPINOUT!', W * 0.5, H * 0.36, '#ff8a3d', 20);
}

function isPowerupActive(id) {
  const p = Game.powerups[id];
  return p && p.t > 0;
}

function activatePowerup(id, src) {
  const def = POWERUPS[id]; if (!def) return;
  Game.powerups[id] = { t: def.dur, max: def.dur };
  if (id === 'shield')      SFX.shieldOn();
  else if (id === 'nitro')  SFX.nitroOn();
  else if (id === 'nuke')   SFX.bigBoom && SFX.bigBoom();
  else                      SFX.powerUp();
  if (src) {
    addPopup(def.name, src.x, src.y - 16, def.color, 14);
    emit(src.x, src.y, 14, { color: def.color, speed: 220, life: 0.5, size: 3 });
    shockwave(src.x, src.y, hexToRgba(def.color, 0.55), 60);
  }
  // Horde nuke: detonate immediately, wiping every enemy on screen and
  // clearing all enemy bullets. Massive but satisfying.
  if (id === 'nuke') {
    detonateHordeNuke();
  }
}

// Wipe every on-screen enemy and clear all enemy projectiles. Used by the
// horde-nuke power-up dropped during boss horde levels. Bosses survive but
// take heavy chip damage so players can't trivialize a normal boss with
// stockpiled nukes.
function detonateHordeNuke() {
  const px = Game.player ? Game.player.x : W * 0.5;
  const py = Game.player ? Game.player.y : H * 0.5;
  shockwave(px, py, 'rgba(255,80,80,0.65)', 360);
  shockwave(px, py, 'rgba(255,220,140,0.4)', 220);
  emit(px, py, 60, { color:'#ff6a2b', speed: 520, life: 0.9, size: 5 });
  emit(px, py, 30, { color:'#ffe07a', speed: 360, life: 0.7, size: 4 });
  Game.shake = Math.max(Game.shake, 1.2);
  Game.flash = 1;
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    emit(e.x, e.y, 14, { color:'#ff8a3d', speed:300, life:0.5, size:3 });
    applyKill(e.x, e.y, ENEMY_SCORE[e.kind] || ENEMY_SCORE.buggy);
    Game.enemies.splice(i, 1);
    clearEnemyShotsFrom(e);
  }
  Game.enemyBullets.length = 0;
  if (Game.boss) {
    Game.boss.hp -= 25;
    if (Settings.damageNumbers) addPopup('-25', Game.boss.x, Game.boss.y - 18, '#ff3a3a', 13);
  }
}

function hexToRgba(hex, a) {
  // expects #rrggbb or #rgb
  const h = hex.replace('#','');
  const f = h.length === 3
    ? h.split('').map(c => parseInt(c+c, 16))
    : [0,2,4].map(i => parseInt(h.substr(i,2), 16));
  return `rgba(${f[0]},${f[1]},${f[2]},${a})`;
}

function updatePowerups(dt) {
  for (const id of POWERUP_KEYS) {
    const p = Game.powerups[id];
    if (p && p.t > 0) {
      if (id === 'pulse') {
        p.tick = (p.tick || 0) - dt;
        if (p.tick <= 0) {
          p.tick = 1.15;
          firePulseBurst();
        }
      }
      p.t -= dt;
      if (p.t <= 0) {
        Game.powerups[id] = null;
        // visual cue when shield drops
        if (id === 'shield') {
          shockwave(Game.player.x, Game.player.y, 'rgba(122,170,255,0.4)', 90);
        }
      }
    }
  }
  // combo decay
  if (Game.combo > 0) {
    Game.comboT -= dt;
    if (Game.comboT <= 0) { Game.combo = 0; Game.comboT = 0; }
  }
}

// Magnet: pull pickups toward player when active
function applyMagnet(dt) {
  const hasMagnetEffect = isPowerupActive('magnet') || !!(Game.branchState && Game.branchState.pickupRadius > 0);
  if (!hasMagnetEffect) return;
  const p = Game.player;
  const bonus = (Game.branchState && Game.branchState.pickupRadius) || 0;
  const range = (240 + bonus + (isPowerupActive('salvage') ? SALVAGE_MAGNET_BONUS : 0)) * (Game.magnetRangeMul || 1);
  for (const pk of Game.pickups) {
    const dx = p.x - pk.x, dy = p.y - pk.y;
    const d = Math.hypot(dx, dy);
    if (d < range && d > 1) {
      const pull = 600 * (1 - d / range);
      pk.x += (dx / d) * pull * dt;
      pk.y += (dy / d) * pull * dt;
    }
  }
}

// Sidekick passive: Diesel auto-heals player every 20s
function updateSidekick(dt) {
  if (!Game.sidekick || !Game.player) return;
  if (Game.sidekick === 'diesel') {
    Game.sidekickHealT += dt;
    if (Game.sidekickHealT >= 20) {
      Game.sidekickHealT -= 20;
      if (Game.health < Game.maxHealth) {
        Game.health = Math.min(Game.maxHealth, Game.health + 5);
        addPopup('+5 HP', Game.player.x, Game.player.y - 40, '#7af07a', 13);
      }
    }
  }
}

// Remove any in-flight enemy bullets that were fired by a specific source
// (an enemy or the boss). Called when that source dies so its missiles,
// shells, and rapid-fire shots stop dead instead of continuing to fly
// after the shooter is gone.
function clearEnemyShotsFrom(src) {
  if (!src) return;
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    if (Game.enemyBullets[i].src === src) Game.enemyBullets.splice(i, 1);
  }
}

function firePulseBurst() {
  if (!Game.player) return;
  const px = Game.player.x, py = Game.player.y;
  shockwave(px, py, 'rgba(142,197,255,0.55)', 150);
  emit(px, py, 18, { color:'#8ec5ff', speed:280, life:0.55, size:3 });
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    const b = Game.enemyBullets[i];
    if (Math.hypot((b.x || 0) - px, (b.y || 0) - py) < 130) {
      Game.enemyBullets.splice(i, 1);
    }
  }
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    if (Math.hypot(e.x - px, e.y - py) < 140) {
      const pulseDmg = e.elite ? PULSE_DAMAGE.elite : PULSE_DAMAGE.normal;
      e.hp -= pulseDmg;
      if (Settings.damageNumbers) addPopup('-' + pulseDmg, e.x, e.y - 10, '#8ec5ff', 12);
      if (e.hp <= 0) {
        applyKill(e.x, e.y, ENEMY_SCORE[e.kind] || ENEMY_SCORE.buggy);
        emit(e.x, e.y, 18, { color:'#8ec5ff', speed:300, life:0.55, size:3 });
        Game.enemies.splice(i, 1);
        clearEnemyShotsFrom(e);
      }
    }
  }
  if (Game.boss && Math.hypot(Game.boss.x - px, Game.boss.y - py) < 170) {
    Game.boss.hp -= 4;
    if (Settings.damageNumbers) addPopup('-4', Game.boss.x, Game.boss.y - 18, '#8ec5ff', 12);
  }
}

function weightedPoolAdd(pool, id, n) {
  for (let i = 0; i < n; i++) pool.push(id);
}

// Power-up ids that are NEVER rolled randomly — they're only granted
// directly by special level scripting (e.g. siege mode at the start of a
// boss horde level, or nukes dropped during a horde fight).
const SPECIAL_POWERUP_KEYS = { nuke: true, siege: true };

function buildPowerupPool() {
  const pool = [];
  POWERUP_KEYS.forEach(id => { if (!SPECIAL_POWERUP_KEYS[id]) weightedPoolAdd(pool, id, 1); });
  if (Game.mode === 'timeattack') {
    weightedPoolAdd(pool, 'rapid', 2);
    weightedPoolAdd(pool, 'x2', 2);
    weightedPoolAdd(pool, 'overdrive', 2);
  }
  if (Game.mode === 'gauntlet' && Game.levelData && Game.levelData.obj === 'boss') {
    weightedPoolAdd(pool, 'shield', 2);
    weightedPoolAdd(pool, 'pulse', 2);
  }
  if (Game.mode === 'bossrush') {
    weightedPoolAdd(pool, 'shield', 2);
    weightedPoolAdd(pool, 'pulse', 2);
    weightedPoolAdd(pool, 'overdrive', 2);
  }
  if (Game.mode === 'daily') {
    weightedPoolAdd(pool, 'salvage', 2);
  }
  if (Game.biome === 'midnight') weightedPoolAdd(pool, 'pulse', 2);
  if (Game.biome === 'redcanyon') weightedPoolAdd(pool, 'nitro', 2);
  if (Game.biome === 'saltflats') weightedPoolAdd(pool, 'magnet', 1);
  if (Game.runMutators.some(m => m.id === 'scavenger')) weightedPoolAdd(pool, 'salvage', 2);
  if (Game.runMutators.some(m => m.id === 'volatile')) weightedPoolAdd(pool, 'pulse', 1);
  return pool;
}

// Pick a random non-active power-up id (or any if all are active).
// Special power-ups (nuke, siege) are never randomly rolled — they're
// only granted directly during scripted boss horde levels.
function rollPowerup() {
  const eligible = POWERUP_KEYS.filter(k => !SPECIAL_POWERUP_KEYS[k]);
  const inactive = eligible.filter(k => !isPowerupActive(k));
  const weighted = buildPowerupPool().filter(k => inactive.length === 0 || inactive.includes(k));
  const pool = weighted.length ? weighted : (inactive.length ? inactive : eligible);
  return pool[Math.floor(Math.random() * pool.length)];
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
  if (e.key.toLowerCase() === 'p' && Game.state === 'playing') togglePause();
  // Q cycles graphics quality (auto -> low -> medium -> high -> auto) and
  // persists the choice in localStorage. Skipped while typing in the
  // profile-rename modal so it doesn't hijack the input.
  if (e.key.toLowerCase() === 'q' && document.activeElement !== document.getElementById('modal-input')) {
    cycleQualityMode();
  }
  if (Game.state === 'gameover') {
    if (e.key.toLowerCase() === 'r' || e.key === 'Enter') UI.act('res-again');
  }
}, { passive:false });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
// Clear all held keys when the window loses focus so keys don't get "stuck"
// (keyup events are never fired for keys held while the window is blurred)
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function onPointerDown(e) {
  ensureAudio();
  if (Game.state !== 'playing') return; // canvas only handles input during gameplay
  if (Game.paused) { togglePause(false); return; }
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
pauseBtn.addEventListener('click', e => { e.stopPropagation(); if (Game.state === 'playing') togglePause(); });
pauseBtn.addEventListener('pointerdown', e => e.stopPropagation());

// togglePause owns both the gameplay flag and the DOM pause screen so they
// can never drift out of sync. Keyboard P, the on-screen pause button, and
// the visibility-change handler all funnel through here.
function togglePause(force) {
  if (Game.state !== 'playing') return;
  const next = (typeof force === 'boolean') ? force : !Game.paused;
  if (next === Game.paused) return;
  Game.paused = next;
  if (Game.paused) UI.showPause();
  else UI.hideAllScreens();
}

let wakeLock = null;
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(_){}
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(()=>{}); wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Game.state === 'playing') requestWakeLock();
  else { if (Game.state === 'playing') togglePause(true); releaseWakeLock(); }
});

// ============================================================
// GAME STATE
// ============================================================
const Game = {
  state: 'menu',          // 'menu' | 'loading' | 'playing' | 'dying' | 'gameover' | 'victory'
  paused: false,
  mode: null,             // 'classic' | 'gauntlet' | 'timeattack' | 'daily'
  level: null,            // gauntlet level number
  levelData: null,
  dailySeedKey: null,     // 'YYYY-MM-DD' when mode === 'daily'
  biome: 'wastes',
  t: 0,
  animT: 0,               // always-advancing clock for menu/idle animations
  // run stats
  score: 0,
  scrapEarned: 0,
  distance: 0,
  kills: 0,
  civiliansHit: 0,
  speed: 280,
  targetSpeed: 280,
  health: 100,
  maxHealth: 100,
  fireCooldown: 0,
  spawnTimer: 0,
  pickupTimer: 0,
  shake: 0,
  // Smoothed screen-shake offsets — interpolate toward a random target so the
  // camera vibrates instead of strobing one pixel per frame. Updated in render().
  shakeOX: 0, shakeOY: 0, shakeTX: 0, shakeTY: 0, shakeRetargetT: 0,
  // Brief positional snapshots of the player while NITRO is active — drawn as
  // a fading silhouette trail behind the live vehicle. Capped to TRAIL_MAX.
  playerTrail: [],
  flash: 0,
  hitFlash: 0,            // brief vehicle hit indicator
  hintTime: 0,
  laneOffset: 0,
  // theme
  isNight: false,
  isStorm: false,
  // active character perk multipliers
  scrapMul: 1,
  killScoreMul: 1,
  nightVisionMul: 1,
  pickupScoreMul: 1,
  damageTakenMul: 1,
  bossDamageMul: 1,
  contactDamageMul: 1,
  nitroDamageMul: 1,
  branchState: {},
  runMutators: [],
  activeEvent: null,
  eventTimer: 0,
  eventCooldown: 0,
  eventBanner: null,
  bonusObjective: null,
  bonusObjectiveT: 0,
  bossRushStage: 0,
  bossRushPending: 0,
  ironThroneStage: 0,     // current Iron Throne stage number (1–8)
  // boss horde levels: timer + nuke-pickup spawn cooldown
  hordeMode: null,        // { dur, nukeT } when active, else null
  hordeWaveT: 0,
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
  popups: [],             // floating score / scrap text
  wreck: null,            // remains of the player after death
  // boss
  boss: null,
  bossWarning: 0,         // seconds remaining for "BOSS INCOMING" warning
  // sequences (animations that span frames)
  loadingT: 0,
  loadingDur: 0,
  deathSeq: null,         // { t, dur, x, y }
  bossDeathSeq: null,     // { t, dur, x, y, w, h, color, levelClear }
  victorySeq: null,       // { t, dur, kind }
  // background fly-ins
  bgScroll: 0,
  // combo system
  combo: 0,
  comboT: 0,
  comboBest: 0,
  // power-ups: id -> { t, max } | null
  powerups: { shield: null, triple: null, rapid: null, nitro: null, magnet: null, x2: null, overdrive: null, salvage: null, pulse: null, homing: null, armor: null },
  // tire skid marks (drawn under road decals)
  skidMarks: [],
  // far parallax peaks (deepest layer)
  farPeaks: [],
  // dust devils / weather embellishments
  dustDevils: [],
  // lightning timer (storm)
  lightning: 0,
  // muzzle-flash timer
  muzzleT: 0,
  // campaign
  campaignLevelId: null,
  // sidekick
  sidekick: null,
  sidekickHealT: 0,
  magnetRangeMul: 1,
  // badges earned at the end of this run (populated by endRun)
  _pendingBadges: [],
  _pendingCosmetics: [],
  cosmetics: defaultCosmetics(),
  // spinout: set when the player hits a hitchhiker; car loses control temporarily
  spinout: null,   // { t, dur, rot, rotV, kickDir } | null
  // power-up banked from a previous run to activate at game start
  _pendingBankedPowerup: null,
};

function addPopup(text, x, y, color = '#f5d76e', size = 14) {
  Game.popups.push({ text, x, y, vy: -60, life: 1.0, max: 1.0, color, size });
}

function emitExhaustTrail(x, y, count = 1) {
  const trail = getTrailDef(Game.cosmetics && Game.cosmetics.equippedTrail);
  const colors = (trail.colors && trail.colors.length) ? trail.colors : ['rgba(120,90,60,0.5)'];
  const color = colors[Math.floor(Math.random() * colors.length)] || colors[0];
  emit(x, y, count, {
    color,
    speed: trail.speed || 50,
    life: trail.life || 0.45,
    size: trail.size || 5,
    spread: Math.PI / 4,
  });
}

function makeDecor(yOverride) {
  const { x0, x1 } = roadBounds();
  const side = Math.random() < 0.5 ? 'L' : 'R';
  const x = side === 'L' ? rand(0, Math.max(8, x0 - 8)) : rand(x1 + 8, W);
  const y = yOverride !== undefined ? yOverride : -20;
  const r = Math.random();
  const biome = (Game && Game.biome) || 'wastes';
  let type;
  if (biome === 'wastes') {
    if      (r < 0.44) type = 'rock';
    else if (r < 0.64) type = 'cactus';
    else if (r < 0.74) type = 'wreck';
    else if (r < 0.83) type = 'tumbleweed';
    else if (r < 0.90) type = 'post';
    else               type = 'skull';
  } else if (biome === 'saltflats') {
    if      (r < 0.36) type = 'rock';
    else if (r < 0.52) type = 'crystal';
    else if (r < 0.66) type = 'bones';
    else if (r < 0.79) type = 'wreck';
    else if (r < 0.90) type = 'cactus';
    else               type = 'skull';
  } else if (biome === 'ash') {
    if      (r < 0.38) type = 'rock';
    else if (r < 0.54) type = 'ashpile';
    else if (r < 0.67) type = 'stump';
    else if (r < 0.79) type = 'wreck';
    else if (r < 0.89) type = 'skull';
    else               type = 'cactus';
  } else if (biome === 'redcanyon') {
    if      (r < 0.40) type = 'rock';
    else if (r < 0.56) type = 'pillar';
    else if (r < 0.70) type = 'cactus';
    else if (r < 0.82) type = 'wreck';
    else               type = 'skull';
  } else if (biome === 'midnight') {
    if      (r < 0.36) type = 'rock';
    else if (r < 0.51) type = 'sign';
    else if (r < 0.64) type = 'wreck';
    else if (r < 0.76) type = 'bones';
    else if (r < 0.87) type = 'cactus';
    else               type = 'skull';
  } else {
    if      (r < 0.55) type = 'rock';
    else if (r < 0.80) type = 'cactus';
    else if (r < 0.92) type = 'wreck';
    else               type = 'skull';
  }
  return { x, y, type, size: type === 'rock' ? rand(8, 22) : rand(14, 26), tone: rand(0.6, 1.0), rot: rand(-0.5, 0.5) };
}

function startRun(mode, level) {
  ensureAudio();
  const profile = Profile.active();
  if (!profile) return;
  if (mode === 'zombie' && !Profile.isZombieModeUnlocked()) {
    const remaining = getZombieUnlockLevelsRemaining(profile);
    UI.toast(zombieLockedMessage('ZOMBIE HORDE LOCKED', remaining));
    UI.showMode();
    return;
  }
  if (mode === 'ironthrone' && !Profile.isFullMasteryUnlocked()) {
    UI.toast('IRON THRONE LOCKED — CLEAR ALL CAMPAIGN LOCATIONS AND ALL GAUNTLET SECTORS');
    UI.showMode();
    return;
  }
  // Daily Challenge: seed Math.random for the run so every player who runs
  // it on the same UTC date sees identical world generation. Always restore
  // before any new run so seeding doesn't leak across modes.
  restoreRng();
  if (mode === 'daily') {
    Game.dailySeedKey = todaySeedString();
    activateSeededRng(seedFromString('mojave-run-daily-' + Game.dailySeedKey));
  } else {
    Game.dailySeedKey = null;
  }
  const v = VEHICLE_BY_ID[profile.activeVehicle] || VEHICLES[0];
  const stats = Profile.effectiveStats(profile.activeVehicle);
  const perkState = getCharacterPerkState(profile.characterId);
  Game.mode = mode;
  if (mode === 'ironthrone') {
    const stageNum = (typeof level === 'number' && level >= 1 && level <= IRON_THRONE_STAGES.length) ? level : 1;
    const stageDef = IRON_THRONE_STAGES[stageNum - 1];
    Game.ironThroneStage = stageNum;
    Game.campaignLevelId = null;
    Game.level = stageNum;
    Game.levelData = {
      num: stageNum, name: stageDef.name, obj: 'boss', target: 1,
      reward: stageDef.reward, diff: stageDef.diff,
      map: stageDef.map, night: !!stageDef.night, storm: !!stageDef.storm,
      ironThroneBoss: stageDef,
    };
  } else if (mode === 'campaign' && typeof level === 'string') {
    Game.campaignLevelId = level;
    const _ce = CAMPAIGN_LEVEL_MAP[level];
    Game.level = level;
    Game.levelData = _ce ? {
      num: _ce.lvl.num, name: _ce.lvl.name, obj: _ce.lvl.obj, target: _ce.lvl.target,
      reward: _ce.lvl.reward, diff: _ce.lvl.diff, boss: _ce.lvl.boss,
      map: _ce.loc.biome, night: !!_ce.lvl.night, storm: !!_ce.lvl.storm,
    } : null;
  } else {
    Game.campaignLevelId = null;
    Game.level = level || null;
    Game.levelData = level ? LEVELS.find(l => l.num === level) : null;
    if (mode !== 'ironthrone') Game.ironThroneStage = 0;
  }
  Game.biome = pickBiome(mode, Game.levelData, Game.dailySeedKey);
  Game.runMutators = getRunMutators(mode, Game.levelData, Game.dailySeedKey);
  Game.state = 'loading';
  Game.paused = false;
  Game.t = 0;
  Game.score = 0;
  Game.scrapEarned = 0;
  Game.distance = 0;
  Game.kills = 0;
  Game.civiliansHit = 0;
  const baseSpeed = 280 * (Game.levelData ? (0.85 + Game.levelData.diff * 0.15) : 1);
  Game.speed = baseSpeed * 0.6; Game.targetSpeed = baseSpeed;
  Game.maxHealth = Math.round(stats.maxHp);
  Game.health = Game.maxHealth;
  Game.fireCooldown = 0;
  Game.spawnTimer = 0.6;
  Game.pickupTimer = 3;
  Game.shake = 0; Game.flash = 0; Game.hitFlash = 0;
  Game.shakeOX = Game.shakeOY = Game.shakeTX = Game.shakeTY = 0;
  Game.shakeRetargetT = 0;
  Game.playerTrail.length = 0;
  Game.hintTime = IS_TOUCH ? 4.5 : 0;
  Game.bullets.length = 0; Game.enemies.length = 0; Game.obstacles.length = 0;
  Game.pickups.length = 0; Game.enemyBullets.length = 0;
  Game.particles.length = 0; Game.shockwaves.length = 0;
  Game.popups.length = 0;
  Game.decor.length = 0;
  Game.laneOffset = 0;
  Game._lastStoryDistance = 0; // reset story chapter tracker
  Game.isNight = !!(Game.levelData && Game.levelData.night);
  Game.isStorm = !!(Game.levelData && Game.levelData.storm);
  if (Game.runMutators.some(m => m.id === 'blackout')) Game.isNight = true;
  if (Game.runMutators.some(m => m.id === 'volatile')) Game.isStorm = true;
  Game.scrapMul = perkState.scrapMul || 1;
  Game.killScoreMul = perkState.killScoreMul || 1;
  Game.nightVisionMul = perkState.nightVisionMul || 1;
  Game.pickupScoreMul = 1;
  Game.damageTakenMul = perkState.damageTakenMul ?? 1;
  Game.bossDamageMul = 1;
  Game.contactDamageMul = 1;
  Game.nitroDamageMul = 1;
  Game.branchState = Object.assign({}, stats.branchEffects || null);
  if (Game.branchState.scrapMul) Game.scrapMul *= Game.branchState.scrapMul;
  if (Game.branchState.killScoreMul) Game.killScoreMul *= Game.branchState.killScoreMul;
  if (Game.branchState.pickupScoreMul) Game.pickupScoreMul *= Game.branchState.pickupScoreMul;
  if (Game.branchState.damageTakenMul) Game.damageTakenMul *= Game.branchState.damageTakenMul;
  if (Game.branchState.bossDamageMul) Game.bossDamageMul *= Game.branchState.bossDamageMul;
  if (Game.branchState.contactDamageMul) Game.contactDamageMul *= Game.branchState.contactDamageMul;
  if (Game.branchState.nitroDamageMul) Game.nitroDamageMul *= Game.branchState.nitroDamageMul;
  Game.vehicle = v;
  Game.vehicleStats = stats;
  Game.cosmetics = cloneCosmeticsState(Profile.equippedCosmetics());
  // sidekick passive effects
  Game.sidekick = profile.activeSidekick || null;
  Game.sidekickHealT = 0;
  Game.magnetRangeMul = 1;
  if (Game.sidekick === 'ratchet') Game.vehicleStats = Object.assign({}, stats, { dmg: stats.dmg * 1.15 });
  if (Game.sidekick === 'mirage')  Game.magnetRangeMul = 1.3;
  if (Game.sidekick === 'vulture') Game.scrapMul = (Game.scrapMul || 1) * 1.2;
  Game.player = {
    x: W * 0.5, y: H + 100, w: 42, h: 64, vx: 0,  // start offscreen — drives in during loading
  };
  Game.boss = null;
  Game.bossWarning = 0;
  Game.wreck = null;
  Game.spinout = null;
  Game.deathSeq = null;
  Game.bossDeathSeq = null;
  Game.victorySeq = null;
  Game.bgScroll = 0;
  Game.combo = 0;
  Game.comboT = 0;
  Game.comboBest = 0;
  Game._pendingBadges = [];
  Game._pendingCosmetics = [];
  for (const k of POWERUP_KEYS) Game.powerups[k] = null;
  // Consume any banked power-up — it will be activated when play begins
  Game._pendingBankedPowerup = Profile.consumeBankedPowerup();
  Game.activeEvent = null;
  Game.eventTimer = 0;
  Game.eventCooldown = rand(12, 18);
  Game.eventBanner = null;
  Game.bonusObjective = null;
  Game.bonusObjectiveT = 0;
  Game.bossRushStage = mode === 'bossrush' ? 1 : 0;
  Game.bossRushPending = 0;
  // ironThroneStage is already set in the mode-specific block above; reset here only if not ironthrone
  if (mode !== 'ironthrone') Game.ironThroneStage = 0;
  Game.hordeMode = null;
  Game.hordeWaveT = 0;
  Game.skidMarks.length = 0;
  Game.farPeaks.length = 0;
  Game.dustDevils.length = 0;
  Game.lightning = 0;
  Game.muzzleT = 0;
  for (let i = 0; i < 30; i++) Game.decor.push(makeDecor(Math.random() * H));
  // seed parallax peaks across the horizon
  for (let i = 0; i < 6; i++) {
    Game.farPeaks.push({
      x: rand(0, 1), // normalized 0..1, scrolls slowly
      w: rand(0.18, 0.32),
      h: rand(0.08, 0.16),
      tone: rand(0.6, 1.0),
    });
  }
  // loading sequence — vehicle drives in, level info displays
  Game.loadingT = 0;
  Game.loadingDur = 1.7;
  Game.loadingTip = pickLoadingTip();
  SFX.start();
  requestWakeLock();
  pauseBtn.classList.remove('show');
  fsBtn.classList.add('hidden');
  UI.hideAllScreens();
}

function beginPlaying() {
  Game.state = 'playing';
  Game.player.x = W * 0.5;
  Game.player.y = H - 110;
  Game.player.vx = 0;
  pauseBtn.classList.add('show');
  const horn = COSMETIC_BY_ID[Game.cosmetics && Game.cosmetics.equippedHorn];
  if (horn && horn.sfx && SFX[horn.sfx]) {
    if (horn.sfx === 'combo') SFX.combo(3);
    else SFX[horn.sfx]();
  }
  // Spawn boss right away in boss levels
  if (Game.mode === 'ironthrone') {
    spawnIronThroneBoss(Game.ironThroneStage);
    const stageDef = IRON_THRONE_STAGES[Game.ironThroneStage - 1];
    Game.bossWarning = 2.4;
    announceEvent('WARLORD ' + Game.ironThroneStage + '/' + IRON_THRONE_STAGES.length + ' — ' + stageDef.weapon, '#ff4040');
    SFX.boss();
    Haptics.bossWarn();
  } else if (Game.levelData && Game.levelData.obj === 'boss') {
    spawnBoss(Game.levelData.boss);
    Game.bossWarning = 2.4;
    SFX.boss();
    Haptics.bossWarn();
  } else if (Game.mode === 'bossrush') {
    spawnBoss(BOSS_RUSH_STAGES[Game.bossRushStage - 1] || 1);
    Game.bossWarning = 2.4;
    announceEvent('BOSS RUSH ' + Game.bossRushStage + '/' + BOSS_RUSH_STAGES.length, '#ff8a8a');
    SFX.boss();
    Haptics.bossWarn();
  } else if (Game.levelData && Game.levelData.obj === 'horde') {
    // BOSS HORDE LEVEL — the player gets a massive temporary upgrade
    // (siege mode: super-laser + side miniguns + faster fire), then has
    // to survive a wall of mixed enemies/zombies for L.target seconds.
    // Horde-clearing nukes drop periodically.
    const dur = Math.max(20, Game.levelData.target || 45);
    Game.hordeMode = { dur, nukeT: 6 };
    Game.powerups.siege = { t: dur + 2, max: dur + 2 };
    // give a head-start of useful buffs too — this is the "crazy s***" run
    Game.powerups.shield = { t: 4, max: 4 };
    Game.powerups.overdrive = { t: dur + 2, max: dur + 2 };
    announceEvent('HORDE INCOMING — SIEGE MODE', '#ffd86b');
    SFX.boss && SFX.boss();
    Haptics.bossWarn && Haptics.bossWarn();
  }
  // Apply a power-up banked from a previous run
  if (Game._pendingBankedPowerup) {
    const _bId = Game._pendingBankedPowerup;
    const _bDef = POWERUPS[_bId];
    Game._pendingBankedPowerup = null;
    if (_bDef && !SPECIAL_POWERUP_KEYS[_bId]) {
      activatePowerup(_bId, null);
      setTimeout(() => announceEvent('BANKED: ' + _bDef.name, _bDef.color), 800);
    }
  }
}

function endRun(reason /* 'death' | 'victory' | 'time' */) {
  if (Game.state !== 'playing' && Game.state !== 'dying' && Game.state !== 'victory') return;
  Game.state = reason === 'victory' ? 'victory' : 'gameover';
  // Always restore Math.random; daily mode's seeded RNG should never leak
  // into menus, garage previews, or subsequent non-daily runs.
  restoreRng();
  releaseWakeLock();
  pauseBtn.classList.remove('show');
  fsBtn.classList.remove('hidden');
  // award scrap (10% of score)
  const baseScrap = Math.floor((Game.score / 10) * Game.scrapMul);
  let bonus = 0;
  if (reason === 'victory' && Game.levelData) bonus = Game.levelData.reward;
  if (reason === 'victory' && Game.mode === 'bossrush') {
    bonus += BOSS_RUSH_REWARD_BASE + Math.min(Game.bossRushStage, BOSS_RUSH_STAGES.length) * BOSS_RUSH_REWARD_PER_STAGE;
  }
  Game.scrapEarned = baseScrap + bonus;
  // Zombie mode: cap scrap to prevent high-combo sessions from breaking the economy
  if (Game.mode === 'zombie') Game.scrapEarned = Math.min(Game.scrapEarned, ZOMBIE_SCRAP_CAP);
  Profile.earn(Game.scrapEarned);
  // record stats
  Profile.recordRunResult({
    mode: Game.mode,
    score: Math.floor(Game.score),
    distance: Math.floor(Game.distance),
    kills: Math.floor(Game.kills),
    comboBest: Math.floor(Game.comboBest || 0),
    scrapEarned: Math.floor(Game.scrapEarned || 0),
    civiliansHit: Math.floor(Game.civiliansHit || 0),
    level: Game.level,
    victory: reason === 'victory',
    dailySeedKey: Game.dailySeedKey,
    // iron throne: stage number that was just cleared (incremented on boss death)
    ironThroneStage: Game.mode === 'ironthrone' ? ironThroneStagesCleared() : 0,
  });
  // check achievements earned this run; also grant mastery vehicle if newly unlocked
  const _masteryWasUnlocked = !!(Profile.active() && Profile.active().ownedVehicles['warlordking']);
  Game._pendingBadges = Profile.checkAchievements();
  const _newlyGranted = Profile.checkMasteryVehicleGrant();
  if (_newlyGranted && !_masteryWasUnlocked) {
    Game._pendingBadges = Game._pendingBadges.concat([{ icon:'🚗', name:'WARLORD KING UNLOCKED', desc:'The boss car is yours.' }]);
  }
  Game._pendingCosmetics = Profile.checkCosmetics();
  // SFX already played by death/victory sequences; only play here for time-out
  if (reason === 'time') SFX.victory();
  // small delay to let final FX play
  if (Game.mode === 'campaign' && reason === 'victory') {
    // record cleared level and capture any sidekick unlock for the story overlay
    let _unlockedSk = null;
    let _unlockedZombie = false;
    if (Game.campaignLevelId) {
      const _wasZombieUnlocked = Profile.isZombieModeUnlocked();
      const _ce = CAMPAIGN_LEVEL_MAP[Game.campaignLevelId];
      if (_ce) {
        _unlockedSk = Profile.recordCampaignLevel(_ce.loc.id, _ce.lvl.num);
        _unlockedZombie = !_wasZombieUnlocked && Profile.isZombieModeUnlocked();
      }
    }
    const _capturedId = Game.campaignLevelId;
    setTimeout(() => UI.showCampaignStory(_capturedId, _unlockedSk, _unlockedZombie, () => UI.showResults(reason)), 1100);
  } else {
    setTimeout(() => UI.showResults(reason), reason === 'death' ? 700 : 1100);
  }
}

function triggerVictory(kind /* 'objective' | 'time' */) {
  if (Game.state !== 'playing') return;
  Game.victorySeq = { t: 0, dur: 1.6, kind };
  Game.state = 'victory';
  releaseWakeLock();
  pauseBtn.classList.remove('show');
  if (kind !== 'time') SFX.victory();
  Haptics.victory();
  // burst sparks above the player
  if (Game.player) {
    for (let i = 0; i < 8; i++) {
      emit(Game.player.x + rand(-30, 30), Game.player.y - 40 + rand(-20, 20), 4,
        { color:'#fff3b0', speed:280, life:0.8, size:4 });
    }
    shockwave(Game.player.x, Game.player.y - 40, 'rgba(255,243,176,0.4)', 160);
  }
}

// Check level objective each frame
function checkObjective() {
  if (Game.mode === 'timeattack' && Game.t >= 60) {
    triggerVictory('time');
    return;
  }
  if (Game.mode !== 'gauntlet' && Game.mode !== 'campaign') return;
  if (!Game.levelData) return;
  const L = Game.levelData;
  if (L.obj === 'survive' && Game.t >= L.target) triggerVictory('objective');
  else if (L.obj === 'kills' && Game.kills >= L.target) triggerVictory('objective');
  else if (L.obj === 'distance' && Game.distance >= L.target) triggerVictory('objective');
  else if (L.obj === 'horde' && Game.hordeMode && Game.t >= Game.hordeMode.dur) triggerVictory('objective');
  // boss: handled by boss death sequence
}

function makeBonusObjective() {
  if (Game.mode !== 'timeattack') return null;
  const target = Math.max(6, 8 + Math.floor(Game.t / 12) * 2);
  return {
    kind: 'kills',
    name: 'HOT STREAK',
    target,
    startKills: Game.kills,
    reward: 900 + target * 35,
    t: 10,
    max: 10,
  };
}

function startDynamicEvent(id) {
  if (Game.boss || Game.state !== 'playing') return;
  if (id === 'ambush') {
    Game.activeEvent = { id, name:'RAIDER AMBUSH', t: 7, max: 7 };
    for (let i = 0; i < 3; i++) spawnEnemyWave('bikes');
    announceEvent('RAIDER AMBUSH', '#ff8a8a');
  } else if (id === 'convoy') {
    Game.activeEvent = { id, name:'SCRAP CONVOY', t: 8, max: 8 };
    for (let i = 0; i < 2; i++) spawnEnemyWave('buggy', true);
    Game.pickups.push({ kind:'scrap', x: W * 0.4, y:-30, w:22, h:22, t:0 });
    Game.pickups.push({ kind:'scrap', x: W * 0.6, y:-60, w:22, h:22, t:0 });
    announceEvent('SCRAP CONVOY', '#d2ff6f');
  } else if (id === 'hazard') {
    Game.activeEvent = { id, name:'HAZARD FIELD', t: 8, max: 8 };
    spawnHazardField();
    announceEvent('HAZARD FIELD', '#ffb36a');
  } else if (id === 'stormfront') {
    Game.activeEvent = { id, name:'STORM FRONT', t: 9, max: 9 };
    Game.isStorm = true;
    announceEvent('STORM FRONT', '#8ec5ff');
  } else if (id === 'drone_strike') {
    Game.activeEvent = { id, name:'DRONE STRIKE', t: 8, max: 8 };
    for (let i = 0; i < 4; i++) spawnEnemyWave('drone');
    announceEvent('DRONE STRIKE', '#c87af0');
  } else if (id === 'tank_column') {
    Game.activeEvent = { id, name:'TANK COLUMN', t: 10, max: 10 };
    spawnEnemyWave('tank', true);
    spawnEnemyWave('tank');
    announceEvent('TANK COLUMN', '#ff6060');
  } else if (id === 'civilian_convoy') {
    Game.activeEvent = { id, name:'CIVILIANS ON ROAD', t: 10, max: 10 };
    const { x0, x1 } = roadBounds();
    const margin = 32;
    const colors = ['#4aa8e8', '#e8c84a', '#4ae870', '#e88a4a'];
    for (let i = 0; i < 4; i++) {
      const col = colors[i % colors.length];
      Game.obstacles.push({
        kind: 'civilian',
        x: rand(x0 + margin, x1 - margin),
        y: -60 - i * 70,
        w: 36, h: 54,
        vy: rand(30, 60),
        color: col,
      });
    }
    announceEvent('⚠ CIVILIANS ON ROAD', '#4aa8e8');
  } else if (id === 'kids_crossing') {
    Game.activeEvent = { id, name:'KIDS CROSSING', t: 9, max: 9 };
    const { x0, x1 } = roadBounds();
    const margin = 24;
    const kidColors = ['#ffe07a', '#ff8a3d', '#7af07a', '#ff5a8a', '#8ec5ff'];
    const wheelColors = ['#ff5050', '#ffd000', '#3aa0ff', '#7af07a'];
    for (let i = 0; i < 5; i++) {
      const isWheel = i % 2 === 1;
      const startX = rand(x0 + margin, x1 - margin);
      const palette = isWheel ? wheelColors : kidColors;
      Game.obstacles.push({
        kind: isWheel ? 'bigwheel' : 'kid',
        x: startX, y: -60 - i * 60,
        w: isWheel ? 28 : 16, h: isWheel ? 24 : 22,
        vy: isWheel ? rand(0, 20) : rand(-10, 10),
        color: palette[Math.floor(Math.random() * palette.length)],
        baseX: startX,
        wanderAmp: isWheel ? rand(8, 18) : rand(10, 24),
        wanderSpeed: isWheel ? rand(0.8, 1.8) : rand(1.0, 2.2),
        wanderT: rand(0, Math.PI * 2),
      });
    }
    announceEvent('⚠ KIDS CROSSING', '#ffe07a');
  } else if (id === 'hitchhiker_crossing') {
    // 3-4 hitchhikers appear near the road shoulders — they drift inward, making them
    // an escalating hazard. Hitting any one triggers a spinout.
    Game.activeEvent = { id, name:'HITCHHIKERS', t: 11, max: 11 };
    const { x0, x1 } = roadBounds();
    const colors = ['#e8c84a', '#ff8a3d', '#7af07a', '#8ec5ff', '#e88a4a'];
    const n = irand(3, 4);
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? 'L' : 'R';
      const col = colors[Math.floor(Math.random() * colors.length)];
      const edgeX = side === 'L'
        ? rand(x0 + 4, x0 + 26)
        : rand(x1 - 26, x1 - 4);
      Game.obstacles.push({
        kind: 'hitchhiker',
        x: edgeX, y: -60 - i * 80,
        w: 14, h: 30,
        vy: rand(-5, 8),
        color: col,
        baseX: edgeX,
        wanderAmp: rand(12, 26),
        wanderSpeed: rand(0.5, 1.1),
        wanderT: rand(0, Math.PI * 2),
        driftDir: side === 'L' ? 1 : -1,
      });
    }
    announceEvent('⚠ HITCHHIKERS ON ROAD', '#e8c84a');
  }
}

function maybeTriggerDynamicEvent() {
  if (Game.mode === 'bossrush' || (Game.levelData && (Game.levelData.obj === 'boss' || Game.levelData.obj === 'horde'))) return;
  const dist = Game.distance;
  const pool = ['ambush', 'convoy', 'hazard', 'stormfront'];
  if (dist > 1500) pool.push('drone_strike');
  if (dist > 4000) pool.push('tank_column');
  if (Game.mode === 'classic' && dist > 1000) pool.push('civilian_convoy');
  // Hitchhikers appear in classic/campaign from 500 m onward
  if ((Game.mode === 'classic' || Game.mode === 'campaign') && dist > 500) {
    pool.push('hitchhiker_crossing');
  }
  // Late-campaign locations get civilian + kid hazard events too
  const _campLocIdx = currentCampaignLocIdx();
  if (_campLocIdx >= LATE_CAMPAIGN_LOC_IDX) {
    pool.push('civilian_convoy');
    pool.push('kids_crossing');
    pool.push('hitchhiker_crossing');
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  startDynamicEvent(pick);
}

function spawnHazardField() {
  const { x0, x1 } = roadBounds();
  for (let i = 0; i < 4; i++) {
    Game.obstacles.push({
      kind: i % 2 === 0 ? 'barrel' : 'wreck',
      x: rand(x0 + 28, x1 - 28),
      y: -50 - i * 38,
      w: i % 2 === 0 ? 22 : 44,
      h: i % 2 === 0 ? 24 : 64,
      hp: 1,
      rot: rand(-0.35, 0.35),
    });
  }
}

// ============================================================
// SPAWNERS
// ============================================================
function spawnEnemyWave(forceKind, eliteWave) {
  spawnEnemy(forceKind, eliteWave);
}

function maybeEliteEnemy(enemy, forceElite) {
  const chance = Game.mode === 'timeattack'
    ? 0.18
    : Game.mode === 'classic'
      ? Math.min(0.22, 0.05 + Game.distance / 22000)
      : 0.12;
  if (!forceElite && Math.random() >= chance) return enemy;
  enemy.elite = true;
  enemy.hp = Math.ceil(enemy.hp * 2);
  enemy.fireT *= 0.7;
  enemy.vy *= 1.08;
  return enemy;
}

function spawnEnemy(forceKind, forceElite) {
  if (Game.boss) return; // bosses pause normal spawns mid-fight
  const { x0, x1 } = roadBounds();
  const margin = 32;
  const r = Math.random();
  const lvlMul = Game.levelData ? Game.levelData.diff : 1;
  const dist = Game.distance;

  // ZOMBIE HORDE MODE — only spawns zombies, never vehicles. Also used to
  // force a single zombie spawn from any mode by passing forceKind:'zombie'
  // (e.g. mid-mission boss-horde levels mix vehicles and zombies).
  if (Game.mode === 'zombie' || forceKind === 'zombie') {
    const waveDiff = Math.min(3.0, 1 + dist / 8000);
    // pick zombie type based on difficulty
    let def;
    const zr = Math.random();
    if (waveDiff > 2.0 && zr < 0.18) def = ZOMBIE_DEFS[2]; // bruiser
    else if (waveDiff > 1.2 && zr < 0.35) def = ZOMBIE_DEFS[1]; // runner
    else def = ZOMBIE_DEFS[0]; // walker
    const { x0: zx0, x1: zx1 } = roadBounds();
    // spawn zombies spread across the full width, including shoulders
    const spread = W * 0.12;
    const cx = rand(Math.max(def.w, zx0 - spread), Math.min(W - def.w, zx1 + spread));
    const count = waveDiff > 2.5 ? irand(2,4) : waveDiff > 1.5 ? irand(1,3) : 1;
    for (let z = 0; z < count; z++) {
      const zx = clamp(cx + (z - (count-1)/2) * (def.w + 8) + rand(-8,8), def.w, W - def.w);
      Game.enemies.push({
        kind: 'zombie',
        zombieType: def.id,
        x: zx, y: -def.h - z * 24,
        w: def.w, h: def.h,
        vx: rand(-def.vxRange, def.vxRange),
        vy: def.vy * (0.85 + Math.random() * 0.3) * Math.min(1.6, waveDiff),
        hp: def.hp, fireT: 999, // zombies never shoot
        contact: def.contact,
        zombieScore: def.score * (waveDiff > 2 ? 1.4 : 1),
        color: def.color, goreColor: def.goreColor, accent: def.accent,
        wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(2.5, 5.0),
        elite: !!(forceElite && Math.random() < 0.2),
      });
    }
    return;
  }

  // unlock new enemies as difficulty increases
  const unlockBike   = lvlMul >= 1.1 || dist > 800;
  const unlockMortar = lvlMul >= 1.4 || dist > 2400;
  const unlockDrone  = lvlMul >= 1.2 || dist > 1500;
  const unlockTank   = lvlMul >= 1.8 || dist > 4000;

  // pick spawn type — probabilities shift with distance phase
  let pick = forceKind || null;
  if (!pick) {
    // Innocents: civilian cars appear in classic mode and in any campaign level
    // after a short distance. "Later in the campaign" (Amarillo onward) also
    // adds children on foot and on Big Wheel toy cars — they're slower and
    // smaller and must be missed at all costs.
    const campLocIdx = currentCampaignLocIdx();
    const isClassic = Game.mode === 'classic';
    const isCampaign = Game.mode === 'campaign';
    const allowCivs = isClassic || isCampaign;
    // base civilian chance scales gradually from 2% at 1km to 10% cap at ~6km
    let civChance = allowCivs ? Math.min(0.10, 0.02 + dist / 60000) : 0;
    // late-campaign: children + Big Wheels also in the mix
    const allowKids = isCampaign && campLocIdx >= LATE_CAMPAIGN_LOC_IDX;
    const kidChance = allowKids ? Math.min(0.07, 0.02 + (campLocIdx - LATE_CAMPAIGN_LOC_IDX) * 0.01) : 0;
    // Hitchhikers appear from 500 m onward in classic/campaign — 3-7% chance, earlier than civs
    const hitchhikerChance = allowCivs ? Math.min(0.07, 0.01 + dist / 80000) : 0;
    if (allowCivs && dist > 800 && r < civChance) {
      pick = 'civilian';
    } else if (allowKids && dist > 600 && r < civChance + kidChance) {
      pick = Math.random() < 0.55 ? 'kid' : 'bigwheel';
    } else if (allowCivs && dist > 500 && r < civChance + kidChance + hitchhikerChance) {
      pick = 'hitchhiker';
    } else if (unlockTank   && r < 0.07) pick = 'tank';
    else if (unlockMortar   && r < 0.14) pick = 'mortar';
    else if (unlockDrone    && r < 0.26) pick = 'drone';
    else if (unlockBike     && r < 0.42) pick = 'bikes';
    else if (r < 0.62) pick = 'buggy';
    else if (r < 0.82) pick = 'wreck';
    else pick = 'barrels';
  }

  if (pick === 'buggy') {
    Game.enemies.push(maybeEliteEnemy({
      kind:'buggy',
      x: rand(x0+margin, x1-margin),
      y: -50, w:40, h:56,
      vx: rand(-40, 40),
      vy: rand(60, 110) * Math.min(1.5, 1 + (lvlMul-1)*0.3),
      hp: 2, fireT: rand(0.8, 1.6),
    }, forceElite));
  } else if (pick === 'bikes') {
    // 1-2 weaving bikes side by side
    const n = Math.random() < 0.6 ? 2 : 1;
    const cx = rand(x0 + margin + 30, x1 - margin - 30);
    for (let i = 0; i < n; i++) {
      Game.enemies.push(maybeEliteEnemy({
        kind:'bike',
        x: cx + (i - (n-1)/2) * 50 + rand(-6, 6),
        y: -50 - i * 30, w:24, h:38,
        vx: 0, vy: rand(40, 80) * Math.min(1.4, 1 + (lvlMul-1)*0.2),
        hp: 1, fireT: rand(1.4, 2.4),
        wave: rand(0, Math.PI * 2), waveSpeed: rand(2.6, 4.0), waveAmp: rand(40, 80),
        baseX: cx + (i - (n-1)/2) * 50,
      }, forceElite || !!(Game.activeEvent && Game.activeEvent.id === 'ambush')));
    }
  } else if (pick === 'mortar') {
    // stationary roadside emplacement that arcs shells
    const side = Math.random() < 0.5 ? 'L' : 'R';
    const x = side === 'L'
      ? rand(8, Math.max(12, x0 - 12))
      : rand(x1 + 12, W - 12);
    Game.enemies.push(maybeEliteEnemy({
      kind:'mortar', x, y: -40, w: 30, h: 30,
      vx: 0, vy: 0, hp: 3, fireT: rand(1.4, 2.4),
      stationary: true,
    }, forceElite));
  } else if (pick === 'drone') {
    // fast diagonal-strafing flier — bounces between road edges, fires rapid bursts
    const startSide = Math.random() < 0.5 ? 1 : -1;
    Game.enemies.push(maybeEliteEnemy({
      kind: 'drone',
      x: startSide > 0 ? x0 + margin : x1 - margin,
      y: -40, w: 28, h: 20,
      vx: rand(80, 130) * startSide * -1,
      vy: rand(160, 220) * Math.min(1.3, 1 + (lvlMul-1)*0.15),
      hp: 1, fireT: rand(0.5, 1.0),
      burstCount: 0,   // shots remaining in current burst
      burstT: 0,       // time between burst shots
    }, forceElite));
  } else if (pick === 'tank') {
    // slow heavy armored vehicle — high HP, fires spread shots
    Game.enemies.push(maybeEliteEnemy({
      kind: 'tank',
      x: rand(x0 + margin + 10, x1 - margin - 10),
      y: -70, w: 52, h: 72,
      vx: rand(-20, 20),
      vy: rand(35, 60) * Math.min(1.4, 1 + (lvlMul-1)*0.25),
      hp: 6, fireT: rand(1.8, 2.8),
    }, forceElite));
  } else if (pick === 'civilian') {
    // innocent civilian car — do NOT hit!
    const colors = ['#4aa8e8', '#e8c84a', '#4ae870', '#e88a4a', '#c87af0'];
    Game.obstacles.push({
      kind: 'civilian',
      x: rand(x0 + margin, x1 - margin),
      y: -60, w: 36, h: 54,
      vy: rand(30, 70),   // their own slower drift speed on top of road scroll
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  } else if (pick === 'kid') {
    // small child crossing the road — slow, wanders side-to-side. Do NOT hit!
    const colors = ['#ffe07a', '#ff8a3d', '#7af07a', '#ff5a8a', '#8ec5ff'];
    const startX = rand(x0 + margin, x1 - margin);
    Game.obstacles.push({
      kind: 'kid',
      x: startX, y: -50, w: 16, h: 22,
      vy: rand(-10, 10),               // nearly road-relative; effectively stationary in lane
      color: colors[Math.floor(Math.random() * colors.length)],
      baseX: startX,
      wanderAmp: rand(8, 22),
      wanderSpeed: rand(1.0, 2.2),
      wanderT: rand(0, Math.PI * 2),
    });
  } else if (pick === 'hitchhiker') {
    // lone pedestrian on the road shoulder with thumb out — DO NOT HIT!
    // They spawn near the road edges but slowly wander toward the center lane,
    // making them an increasingly real hazard. Hitting one triggers a spinout.
    const colors = ['#e8c84a', '#ff8a3d', '#7af07a', '#8ec5ff', '#e88a4a', '#c87af0'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const side = Math.random() < 0.5 ? 'L' : 'R';
    // Start near the road shoulder — just far enough to be reachable by the player
    const edgeX = side === 'L'
      ? rand(x0 + 4, x0 + 28)
      : rand(x1 - 28, x1 - 4);
    // Hitchhikers drift slightly inward over time using wander
    const inwardDir = side === 'L' ? 1 : -1;
    Game.obstacles.push({
      kind: 'hitchhiker',
      x: edgeX, y: -60, w: 14, h: 30,
      vy: rand(-5, 8),       // nearly stationary relative to road scroll
      color: col,
      baseX: edgeX,
      wanderAmp: rand(10, 22),
      wanderSpeed: rand(0.5, 1.2),
      wanderT: rand(0, Math.PI * 2),
      driftDir: inwardDir,   // which direction they gradually wander toward road
    });
  } else if (pick === 'bigwheel') {
    // child on a Big Wheel toy car — wider than a kid, brightly colored, slow. Do NOT hit!
    const colors = ['#ff5050', '#ffd000', '#3aa0ff', '#7af07a', '#ff8a3d'];
    const startX = rand(x0 + margin, x1 - margin);
    Game.obstacles.push({
      kind: 'bigwheel',
      x: startX, y: -50, w: 28, h: 24,
      vy: rand(0, 25),
      color: colors[Math.floor(Math.random() * colors.length)],
      baseX: startX,
      wanderAmp: rand(6, 16),
      wanderSpeed: rand(0.8, 1.8),
      wanderT: rand(0, Math.PI * 2),
    });
  } else if (pick === 'wreck') {
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
  const r = Math.random();
  // 4% reserve (bank a power-up for next run), 9% power-up, 15% repair, 12% cache, rest scrap
  let kind;
  if (r < 0.04) kind = 'reserve';
  else if (r < 0.13) kind = 'powerup';
  else if (r < 0.28) kind = 'repair';
  else if (r < 0.40) kind = 'cache';
  else kind = 'scrap';
  const pk = { kind, x: rand(x0+30, x1-30), y:-30, w:22, h:22, t:0 };
  if (kind === 'powerup') {
    pk.power = rollPowerup();
    pk.w = 26; pk.h = 26;
  } else if (kind === 'cache') {
    pk.w = 28; pk.h = 28;
  } else if (kind === 'reserve') {
    // Assign the banked power-up type now (so the visual can show it)
    const eligible = POWERUP_KEYS.filter(k => !SPECIAL_POWERUP_KEYS[k]);
    pk.power = eligible[Math.floor(Math.random() * eligible.length)];
    pk.w = 28; pk.h = 28;
  }
  Game.pickups.push(pk);
}

// ============================================================
// BOSSES
// ============================================================
const BOSS_DEFS = [
  null,
  { name:'ALPHA RAIDER',  hp: 80,  w: 80,  h: 100, color:'#7a1a1a', pattern:'spread',  fireRate: 1.2, dmg: 12, contactDmg: 25 },
  { name:'TWIN DEMONS',   hp: 140, w: 70,  h: 90,  color:'#aa1a3a', pattern:'aimed',   fireRate: 0.7, dmg: 14, contactDmg: 30, twin: true },
  { name:'THE OVERLORD',  hp: 280, w: 110, h: 130, color:'#5a1a8a', pattern:'hellfire',fireRate: 0.4, dmg: 16, contactDmg: 40 },
  { name:'WARLORD TITAN', hp: 420, w: 120, h: 140, color:'#8a2a1a', pattern:'lance',   fireRate: 0.35, dmg: 20, contactDmg: 48 },
  { name:'THE CHIMERA',   hp: 620, w: 128, h: 148, color:'#3a3a9a', pattern:'maelstrom', fireRate: 0.28, dmg: 24, contactDmg: 56, twin: true },
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

function spawnIronThroneBoss(stageNum) {
  const def = IRON_THRONE_STAGES[(stageNum - 1) % IRON_THRONE_STAGES.length];
  const { x0, x1 } = roadBounds();
  Game.boss = {
    name: def.name,
    weapon: def.weapon,
    x: (x0+x1)/2, y: -def.h,
    targetY: H * 0.22,
    w: def.w, h: def.h,
    hp: def.hp, maxHp: def.hp,
    color: def.color,
    pattern: def.pattern,
    fireRate: def.fireRate,
    dmg: def.dmg,
    contactDmg: def.contactDmg,
    fireT: 1.2,
    moveT: 0,
    vx: 0,
    enrage: false,
    twin: !!def.twin,
    twinX: 80,
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
      const dmg = (bu.dmg || 1) * Game.bossDamageMul;
      b.hp -= dmg;
      if (Settings.damageNumbers) addPopup('-' + Math.round(dmg), bu.x, bu.y - 10, '#ffd86b', 11);
      emit(bu.x, bu.y, 5, { color:'#ffd86b', speed:200, life:0.3, size:2 });
      if (b.hp <= 0) {
        SFX.bigBoom();
        emit(b.x, b.y, 60, { color:'#ff6a2b', speed:480, life:1.0, size:5 });
        emit(b.x, b.y, 30, { color:'#ffd86b', speed:360, life:0.8, size:4 });
        shockwave(b.x, b.y, 'rgba(255,180,80,0.7)', 200);
        Game.shake = 1.4;
        const bossScore = 1500 * (Game.levelData ? Game.levelData.diff : 1);
        applyKill(b.x, b.y - 20, Math.floor(bossScore));
        const isBossLevel = !!(Game.levelData && Game.levelData.obj === 'boss' && Game.mode !== 'ironthrone');
        Game.bossDeathSeq = {
          t: 0, dur: 2.0,
          x: b.x, y: b.y, w: b.w, h: b.h,
          color: b.color, twin: b.twin, twinX: b.twinX,
          levelClear: isBossLevel,
          bossRush: Game.mode === 'bossrush',
          ironThrone: Game.mode === 'ironthrone',
        };
        if (Game.mode === 'bossrush') Game.bossRushStage += 1;
        if (Game.mode === 'ironthrone') Game.ironThroneStage += 1;
        clearEnemyShotsFrom(b);
        Game.boss = null;
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
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:10, vx, vy, dmg, big:true, src:b });
    });
  } else if (b.pattern === 'aimed') {
    // single fast aimed
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:7, h:12, vx:dx/dist*sp*1.3, vy:dy/dist*sp*1.3, dmg, big:true, src:b });
    if (b.twin) {
      const tx = b.twinX;
      const tdx = px - tx, td = Math.hypot(tdx, dy)||1;
      Game.enemyBullets.push({ x:tx, y:b.y+b.h/2, w:7, h:12, vx:tdx/td*sp*1.3, vy:dy/td*sp*1.3, dmg, big:true, src:b });
    }
  } else if (b.pattern === 'hellfire') {
    // burst 5-way
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.22;
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*sp, vy = (dx*sn + dy*cs)/dist*sp;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:10, vx, vy, dmg, big:true, src:b });
    }
    // plus a slow homing-ish burst
    if (b.enrage) {
      for (let k = 0; k < 8; k++) {
        const a = (Math.PI * 2 * k) / 8;
        Game.enemyBullets.push({ x:b.x, y:b.y, w:6, h:6, vx:Math.cos(a)*180, vy:Math.sin(a)*180, dmg:dmg*0.7, big:false, src:b });
      }
    }
  } else if (b.pattern === 'lance') {
    // focused rail shots + spread shrapnel
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:9, h:16, vx:dx/dist*sp*1.6, vy:dy/dist*sp*1.6, dmg:dmg*1.15, big:true, src:b });
    const baseVx = dx / dist * sp * 0.95;
    const baseVy = dy / dist * sp * 0.95;
    for (let i = -2; i <= 2; i++) {
      const a = i * 0.16;
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (baseVx * cs) - (baseVy * sn);
      const vy = (baseVx * sn) + (baseVy * cs);
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:8, vx, vy, dmg:dmg*0.7, big:false, src:b });
    }
  } else if (b.pattern === 'maelstrom') {
    // dual-core rotating pattern
    const burst = b.enrage ? 12 : 8;
    for (let i = 0; i < burst; i++) {
      const a = b.moveT * 2.4 + (Math.PI * 2 * i) / burst;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:6, vx:Math.cos(a)*220, vy:Math.sin(a)*220, dmg:dmg*0.6, big:false, src:b });
      if (b.twin) {
        Game.enemyBullets.push({ x:b.twinX, y:b.y+b.h/2, w:6, h:6, vx:Math.cos(-a)*220, vy:Math.sin(-a)*220, dmg:dmg*0.6, big:false, src:b });
      }
    }
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:8, h:14, vx:dx/dist*sp*1.25, vy:dy/dist*sp*1.25, dmg:dmg, big:true, src:b });
  } else if (b.pattern === 'phantom') {
    // fast multi-way ghost cannon burst — wide arc, high speed
    const count = b.enrage ? 7 : 5;
    const spread = 0.22;
    const fsp = sp * 1.5;
    const half = Math.floor(count / 2);
    for (let i = -half; i <= half; i++) {
      const a = i * spread;
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*fsp, vy = (dx*sn + dy*cs)/dist*fsp;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:5, h:8, vx, vy, dmg:dmg*0.85, big:false, src:b });
    }
  } else if (b.pattern === 'cannon') {
    // slow, massive siege cannon shot — devastating direct hit, flanking shrapnel
    const csp = sp * 0.65;
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:14, h:22, vx:dx/dist*csp, vy:dy/dist*csp, dmg:dmg*2.1, big:true, src:b });
    [-0.42, 0.42].forEach(a => {
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*csp*1.2, vy = (dx*sn + dy*cs)/dist*csp*1.2;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:7, h:11, vx, vy, dmg:dmg*0.75, big:false, src:b });
    });
  } else if (b.pattern === 'throne') {
    // throne array: spread volley + rail lance + rotating orbs + twin shot
    [-0.35, 0, 0.35].forEach(a => {
      const cs = Math.cos(a), sn = Math.sin(a);
      const vx = (dx*cs - dy*sn)/dist*sp, vy = (dx*sn + dy*cs)/dist*sp;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:6, h:10, vx, vy, dmg, big:true, src:b });
    });
    Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:10, h:18, vx:dx/dist*sp*1.7, vy:dy/dist*sp*1.7, dmg:dmg*1.3, big:true, src:b });
    const burst = b.enrage ? 8 : 4;
    for (let i = 0; i < burst; i++) {
      const a = b.moveT * 2.4 + (Math.PI * 2 * i) / burst;
      Game.enemyBullets.push({ x:b.x, y:b.y+b.h/2, w:5, h:5, vx:Math.cos(a)*200, vy:Math.sin(a)*200, dmg:dmg*0.5, big:false, src:b });
    }
    if (b.twin) {
      Game.enemyBullets.push({ x:b.twinX, y:b.y+b.h/2, w:8, h:14, vx:dx/dist*sp*1.3, vy:dy/dist*sp*1.3, dmg:dmg, big:true, src:b });
    }
  }
}

// ============================================================
// UPDATE
// ============================================================
function updateLoading(dt) {
  // animate background scrolling and player driving onto the road
  Game.loadingT += dt;
  Game.bgScroll += Game.speed * dt * 0.3;
  Game.laneOffset = (Game.laneOffset + Game.speed * dt) % 60;
  // ease the player from offscreen up to position
  const k = clamp(Game.loadingT / Game.loadingDur, 0, 1);
  // ease-out cubic
  const eased = 1 - Math.pow(1 - k, 3);
  const startY = H + 100, endY = H - 110;
  Game.player.y = startY + (endY - startY) * eased;
  Game.player.x = W * 0.5;
  // exhaust trail during entry
  if (Math.random() < 0.85) {
    emitExhaustTrail(Game.player.x - 10, Game.player.y + Game.player.h/2 - 4, 1);
    emitExhaustTrail(Game.player.x + 10, Game.player.y + Game.player.h/2 - 4, 1);
  }
  // drift decor
  for (const d of Game.decor) d.y += Game.speed * dt;
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    if (Game.decor[i].y > H + 30) Game.decor.splice(i, 1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());
  // particle decay
  for (let i = Game.particles.length - 1; i >= 0; i--) {
    const pr = Game.particles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt + Game.speed * dt * 0.4;
    pr.vx *= 0.96; pr.vy *= 0.96;
    pr.life -= dt;
    if (pr.life <= 0) Game.particles.splice(i, 1);
  }
  if (Game.loadingT >= Game.loadingDur) beginPlaying();
}

function updateDying(dt) {
  Game.t += dt;
  Game.shake = Math.max(0, Game.shake - dt * 1.6);
  Game.flash = Math.max(0, Game.flash - dt * 2);
  // wreck spin/drift
  if (Game.wreck) {
    Game.wreck.t += dt;
    Game.wreck.rot += Game.wreck.rotV * dt;
    Game.wreck.x += Game.wreck.vx * dt;
    Game.wreck.vx *= 0.96;
    Game.wreck.y += Game.speed * dt * 0.2;
    // smoke
    if (Math.random() < 0.7) {
      emit(Game.wreck.x + rand(-8, 8), Game.wreck.y + rand(-12, 12), 1,
        { color:'rgba(60,40,30,0.55)', speed:40, life:1.2, size:7, spread:Math.PI*2 });
    }
  }
  // staged explosions
  const ds = Game.deathSeq;
  ds.t += dt;
  // secondary booms at predictable beats
  for (const beat of [0.35, 0.7, 1.05, 1.4]) {
    if (ds.t - dt < beat && ds.t >= beat) {
      const ox = ds.x + rand(-18, 18), oy = ds.y + rand(-22, 22);
      emit(ox, oy, 20, { color:'#ff8a3d', speed:280, life:0.7, size:4 });
      emit(ox, oy, 10, { color:'#ffd86b', speed:200, life:0.5, size:3 });
      shockwave(ox, oy, 'rgba(255,140,60,0.4)', 80);
      Game.shake = Math.max(Game.shake, 0.55);
      SFX.explode();
    }
  }
  // scroll bg slow during death
  Game.bgScroll += Game.speed * dt * 0.15;
  Game.laneOffset = (Game.laneOffset + Game.speed * dt * 0.5) % 60;
  // particles
  for (let i = Game.particles.length - 1; i >= 0; i--) {
    const pr = Game.particles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt + Game.speed * dt * 0.2;
    if (pr.gravity) pr.vy += pr.gravity * dt;
    pr.vx *= 0.96; pr.vy *= 0.96;
    pr.life -= dt;
    if (pr.life <= 0) Game.particles.splice(i, 1);
  }
  for (let i = Game.shockwaves.length - 1; i >= 0; i--) {
    const s = Game.shockwaves[i];
    s.life -= dt;
    s.r = s.maxR * (1 - s.life / s.max);
    if (s.life <= 0) Game.shockwaves.splice(i, 1);
  }
  for (let i = Game.popups.length - 1; i >= 0; i--) {
    const pp = Game.popups[i];
    pp.y += pp.vy * dt; pp.vy *= 0.94;
    pp.life -= dt;
    if (pp.life <= 0) Game.popups.splice(i, 1);
  }
  // decor scroll
  for (const d of Game.decor) d.y += Game.speed * dt * 0.4;
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    if (Game.decor[i].y > H + 30) Game.decor.splice(i, 1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());
  if (ds.t >= ds.dur) {
    endRun('death');
  }
}

function updateBossDeath(dt) {
  const seq = Game.bossDeathSeq;
  seq.t += dt;
  // staged explosions across the boss body
  for (const beat of [0.18, 0.42, 0.72, 1.05]) {
    if (seq.t - dt < beat && seq.t >= beat) {
      const ox = seq.x + rand(-seq.w/2, seq.w/2);
      const oy = seq.y + rand(-seq.h/2, seq.h/2);
      emit(ox, oy, 28, { color:'#ff6a2b', speed:380, life:0.9, size:5 });
      emit(ox, oy, 14, { color:'#ffd86b', speed:280, life:0.7, size:4 });
      shockwave(ox, oy, 'rgba(255,180,80,0.55)', 120);
      Game.shake = Math.max(Game.shake, 0.7);
      SFX.explode();
    }
  }
  // final bigger boom
  if (seq.t - dt < seq.dur * 0.65 && seq.t >= seq.dur * 0.65) {
    emit(seq.x, seq.y, 70, { color:'#ff8a3d', speed:520, life:1.2, size:6 });
    emit(seq.x, seq.y, 30, { color:'#fff3b0', speed:400, life:0.9, size:5 });
    shockwave(seq.x, seq.y, 'rgba(255,200,120,0.7)', 240);
    Game.shake = 1.6;
    Game.flash = 0.6;
    SFX.bigBoom();
  }
  if (seq.t >= seq.dur) {
    Game.bossDeathSeq = null;
    if (seq.levelClear) {
      // start victory sequence rather than ending immediately
      Game.victorySeq = { t: 0, dur: 1.8, kind: 'boss' };
      Game.state = 'victory';
      releaseWakeLock();
      pauseBtn.classList.remove('show');
      SFX.victory();
    } else if (seq.bossRush) {
      Game.pickups.push({ kind:'powerup', power: rollPowerup(), x: seq.x - 18, y: seq.y, w:26, h:26, t:0 });
      Game.pickups.push({ kind:'repair', x: seq.x + 18, y: seq.y, w:22, h:22, t:0 });
      if (Game.bossRushStage >= BOSS_RUSH_STAGES.length) {
        triggerVictory('bossrush');
      } else {
        Game.bossRushPending = 2.1;
        announceEvent('NEXT BOSS INBOUND', '#ff8a8a');
      }
    } else if (seq.ironThrone) {
      Game.pickups.push({ kind:'powerup', power: rollPowerup(), x: seq.x - 18, y: seq.y, w:26, h:26, t:0 });
      Game.pickups.push({ kind:'repair', x: seq.x + 18, y: seq.y, w:22, h:22, t:0 });
      // ironThroneStage was already incremented on boss death; check if all cleared
      if (Game.ironThroneStage > IRON_THRONE_STAGES.length) {
        triggerVictory('ironthrone');
      } else {
        const nextDef = IRON_THRONE_STAGES[Game.ironThroneStage - 1];
        Game.biome = nextDef.map;
        Game.isNight = !!nextDef.night;
        Game.isStorm = !!nextDef.storm;
        _skyKey = ''; _roadKey = ''; // invalidate cached gradients for new biome
        if (Game.levelData) {
          Game.levelData.name = nextDef.name;
          Game.levelData.diff = nextDef.diff;
          Game.levelData.ironThroneBoss = nextDef;
        }
        Game.bossRushPending = 2.3;
        announceEvent('WARLORD ' + Game.ironThroneStage + '/' + IRON_THRONE_STAGES.length + ' INBOUND — ' + nextDef.weapon, '#ff4040');
      }
    }
  }
}

function updateVictory(dt) {
  Game.t += dt;
  Game.shake = Math.max(0, Game.shake - dt * 1.6);
  Game.flash = Math.max(0, Game.flash - dt * 2);
  // continue any boss death explosions during the victory cinematic
  if (Game.bossDeathSeq) updateBossDeath(dt);
  // background scrolls slower as the run "ends"
  Game.speed += (Game.targetSpeed * 0.4 - Game.speed) * Math.min(1, dt * 0.6);
  Game.bgScroll += Game.speed * dt * 0.3;
  Game.laneOffset = (Game.laneOffset + Game.speed * dt) % 60;
  // gentle exhaust on player
  if (Game.player && Math.random() < 0.5) {
    emit(Game.player.x - 10, Game.player.y + Game.player.h/2 - 4, 1,
      { color:'rgba(120,90,60,0.5)', speed:30, life:0.5, size:5, spread:Math.PI/4 });
    emit(Game.player.x + 10, Game.player.y + Game.player.h/2 - 4, 1,
      { color:'rgba(120,90,60,0.5)', speed:30, life:0.5, size:5, spread:Math.PI/4 });
  }
  // celebratory sparks from above
  const seq = Game.victorySeq;
  if (seq) {
    seq.t += dt;
    if (Math.random() < 0.6) {
      emit(rand(W*0.2, W*0.8), rand(0, H*0.3), 1,
        { color:'#fff3b0', speed:120, life:1.0, size:3, gravity: 80 });
    }
    if (seq.t >= seq.dur) {
      Game.victorySeq = null;
      endRun('victory');
    }
  }
  // tick particles / popups / shockwaves
  for (let i = Game.particles.length - 1; i >= 0; i--) {
    const pr = Game.particles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt + Game.speed * dt * 0.4;
    if (pr.gravity) pr.vy += pr.gravity * dt;
    pr.vx *= 0.96; pr.vy *= 0.96;
    pr.life -= dt;
    if (pr.life <= 0) Game.particles.splice(i, 1);
  }
  for (let i = Game.shockwaves.length - 1; i >= 0; i--) {
    const s = Game.shockwaves[i];
    s.life -= dt;
    s.r = s.maxR * (1 - s.life / s.max);
    if (s.life <= 0) Game.shockwaves.splice(i, 1);
  }
  for (let i = Game.popups.length - 1; i >= 0; i--) {
    const pp = Game.popups[i];
    pp.y += pp.vy * dt; pp.vy *= 0.94;
    pp.life -= dt;
    if (pp.life <= 0) Game.popups.splice(i, 1);
  }
  // decor scroll
  for (const d of Game.decor) d.y += Game.speed * dt;
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    if (Game.decor[i].y > H + 30) Game.decor.splice(i, 1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());
}

function update(dt) {
  Game.animT += dt;
  if (Game.state === 'loading') { updateLoading(dt); return; }
  if (Game.state === 'dying')   { updateDying(dt); return; }
  if (Game.state === 'victory') { updateVictory(dt); return; }
  Game.t += dt;
  if (Game.state !== 'playing' || Game.paused) return;
  if (Game.hintTime > 0) Game.hintTime -= dt;
  if (Game.bossWarning > 0) Game.bossWarning -= dt;
  if (Game.hitFlash > 0) Game.hitFlash -= dt;
  if (Game.eventBanner) {
    Game.eventBanner.t -= dt;
    if (Game.eventBanner.t <= 0) Game.eventBanner = null;
  }

  // ---- power-ups & combo decay ----
  updatePowerups(dt);
  applyMagnet(dt);
  updateSidekick(dt);

  // nitro modifies effective scroll & score gain
  const nitroMul = isPowerupActive('nitro') ? 1.6 : 1.0;
  Game.distance += Game.speed * dt * nitroMul;
  Game.score += Game.speed * dt * 0.05 * nitroMul;
  Game.laneOffset = (Game.laneOffset + Game.speed * dt * nitroMul) % 60;
  Game.bgScroll += Game.speed * dt * 0.3 * nitroMul;
  Game.shake = Math.max(0, Game.shake - dt * 2.4);
  Game.flash = Math.max(0, Game.flash - dt * 3);
  if (Game.muzzleT > 0) Game.muzzleT -= dt;

  if (Game.activeEvent) {
    Game.activeEvent.t -= dt;
    if (Game.activeEvent.id === 'stormfront' && Game.activeEvent.t <= 0 && !Game.runMutators.some(m => m.id === 'volatile')) {
      Game.isStorm = !!(Game.levelData && Game.levelData.storm);
    }
    if (Game.activeEvent.t <= 0) Game.activeEvent = null;
  } else {
    Game.eventCooldown -= dt;
    if (Game.eventCooldown <= 0) {
      maybeTriggerDynamicEvent();
      Game.eventCooldown = rand(Game.mode === 'classic' ? 14 : 11, Game.mode === 'classic' ? 22 : 17);
    }
  }

  if (Game.mode === 'timeattack') {
    if (!Game.bonusObjective) {
      Game.bonusObjective = makeBonusObjective();
    } else {
      Game.bonusObjective.t -= dt;
      const progress = Game.kills - Game.bonusObjective.startKills;
      if (progress >= Game.bonusObjective.target) {
        Game.score += Game.bonusObjective.reward;
        addPopup('BONUS +' + Game.bonusObjective.reward, W * 0.5, H * 0.28, '#7af07a', 16);
        Game.bonusObjective = makeBonusObjective();
      } else if (Game.bonusObjective.t <= 0) {
        Game.bonusObjective = makeBonusObjective();
      }
    }
  } else {
    Game.bonusObjective = null;
  }

  if (Game.mode === 'bossrush' && !Game.boss && !Game.bossDeathSeq && Game.bossRushPending > 0) {
    Game.bossRushPending -= dt;
    if (Game.bossRushPending <= 0 && Game.state === 'playing') {
      const tier = BOSS_RUSH_STAGES[Game.bossRushStage - 1];
      if (tier) {
        spawnBoss(tier);
        Game.bossWarning = 2.1;
        SFX.boss();
        Haptics.bossWarn();
      } else {
        triggerVictory('bossrush');
      }
    }
  }

  if (Game.mode === 'ironthrone' && !Game.boss && !Game.bossDeathSeq && Game.bossRushPending > 0) {
    Game.bossRushPending -= dt;
    if (Game.bossRushPending <= 0 && Game.state === 'playing') {
      if (Game.ironThroneStage <= IRON_THRONE_STAGES.length) {
        spawnIronThroneBoss(Game.ironThroneStage);
        Game.bossWarning = 2.1;
        SFX.boss();
        Haptics.bossWarn();
        Game.bossRushPending = 0;
      } else {
        triggerVictory('ironthrone');
      }
    }
  }

  // ---- story chapter milestones (classic & zombie modes) ----
  if (Game.mode === 'classic' || Game.mode === 'zombie') {
    if (!Game._lastStoryDistance) Game._lastStoryDistance = 0;
    const ch = STORY_CHAPTERS.find(c => c.distance > 0 && Game.distance >= c.distance && Game._lastStoryDistance < c.distance);
    if (ch) {
      Game._lastStoryDistance = ch.distance;
      announceEvent(ch.title, '#a8c890');
      const maxLen = 40;
      const text = ch.text;
      const snippet = text.length > maxLen
        ? text.slice(0, text.lastIndexOf(' ', maxLen) || maxLen) + '…'
        : text;
      addPopup(snippet, W * 0.5, H * 0.38, '#a8c890', 10);
    }
  }

  // ---- skid marks: emitted when steering hard ----
  const ph = Game.player;
  const steerHard = ph && Math.abs(ph.vx) > 220;
  if (steerHard && Math.random() < 0.85) {
    Game.skidMarks.push({ x: ph.x - 13, y: ph.y + ph.h/2 - 4, w: 4, h: 6, life: 1.4, max: 1.4 });
    Game.skidMarks.push({ x: ph.x + 13, y: ph.y + ph.h/2 - 4, w: 4, h: 6, life: 1.4, max: 1.4 });
  }
  // age skid marks (they scroll with road)
  for (let i = Game.skidMarks.length - 1; i >= 0; i--) {
    const s = Game.skidMarks[i];
    s.y += Game.speed * dt * nitroMul;
    s.life -= dt;
    if (s.life <= 0 || s.y > H + 30) Game.skidMarks.splice(i, 1);
  }

  // ---- weather: dust devils + lightning ----
  if (Game.isStorm) {
    if (Math.random() < dt * 0.45 && Game.dustDevils.length < 4) {
      const { x0, x1 } = roadBounds();
      const side = Math.random() < 0.5 ? 'L' : 'R';
      const dx = side === 'L' ? rand(0, x0) : rand(x1, W);
      Game.dustDevils.push({ x: dx, y: -20, t: 0, life: rand(2.5, 4.5) });
    }
    Game.lightning -= dt;
    if (Game.lightning < -rand(2.5, 6)) {
      Game.lightning = rand(0.18, 0.32);
    }
  }
  for (let i = Game.dustDevils.length - 1; i >= 0; i--) {
    const d = Game.dustDevils[i];
    d.y += Game.speed * dt * nitroMul;
    d.t += dt;
    d.life -= dt;
    if (d.life <= 0 || d.y > H + 60) Game.dustDevils.splice(i, 1);
  }

  // ---- nitro speed-line particles ----
  if (isPowerupActive('nitro') && Math.random() < 0.7) {
    const sx = rand(20, W - 20);
    const sy = rand(40, H - 40);
    Game.particles.push({
      x: sx, y: sy, vx: 0, vy: 1100,
      life: 0.18, max: 0.18, size: 2, color: 'rgba(122,240,255,0.7)',
    });
  }

  // ---- nitro afterimage trail snapshot ----
  // While NITRO is active we keep a short ring buffer of recent player
  // positions; render() stamps them as fading silhouettes for a motion-blur
  // feel. We sample at most every ~30ms so the trail is a clear smear rather
  // than overlapping rectangles.
  if (Game.player) {
    if (isPowerupActive('nitro')) {
      Game._trailAccum = (Game._trailAccum || 0) + dt;
      if (Game._trailAccum >= 0.03) {
        Game._trailAccum = 0;
        Game.playerTrail.push({
          x: Game.player.x, y: Game.player.y,
          w: Game.player.w, h: Game.player.h,
        });
        const TRAIL_MAX = 6;
        if (Game.playerTrail.length > TRAIL_MAX) {
          Game.playerTrail.splice(0, Game.playerTrail.length - TRAIL_MAX);
        }
      }
    } else if (Game.playerTrail.length > 0) {
      // No nitro → fade the trail out one snapshot per frame so it dissolves
      // smoothly instead of popping.
      Game.playerTrail.shift();
    }
  }

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
  if (Game.spinout) {
    // ---- spinout physics: player loses control, car spins and drifts ----
    const sp = Game.spinout;
    sp.t += dt;
    const phase = Math.min(1, sp.t / sp.dur);
    // Angular velocity decays exponentially; car slows its spin over time
    sp.rotV *= Math.pow(SPINOUT_ROT_DECAY, dt);
    sp.rot  += sp.rotV * dt;
    // Side-to-side oscillating drift — amplitude fades as control returns
    const driftAmp = 300 * (1 - phase * phase);
    p.vx = Math.sin(sp.t * SPINOUT_OSC_FREQ) * driftAmp * sp.kickDir;
    p.x += p.vx * dt;
    const { x0: sx0, x1: sx1 } = roadBounds();
    if (p.x - p.w/2 < sx0 + 4) { p.x = sx0 + 4 + p.w/2; p.vx *= -0.55; Game.shake = Math.max(Game.shake, 0.6); }
    if (p.x + p.w/2 > sx1 - 4) { p.x = sx1 - 4 - p.w/2; p.vx *= -0.55; Game.shake = Math.max(Game.shake, 0.6); }
    p.y = H - 110;
    // Screen shake — strong at first, fades out
    if (phase < 0.5) Game.shake = Math.max(Game.shake, 0.65 * (1 - phase / 0.5));
    // Smoke billows from the tires during the spinout
    if (Math.random() < 0.65) {
      emit(p.x + rand(-14, 14), p.y + p.h / 2 + rand(-4, 6), 1,
        { color: 'rgba(70,50,35,0.55)', speed: 50, life: 1.0, size: 8, spread: Math.PI * 2 });
    }
    // Skid marks fly off during violent early phase
    if (phase < 0.5 && Math.random() < 0.9) {
      Game.skidMarks.push({ x: p.x - 14, y: p.y + p.h/2 - 4, w: 5, h: 7, life: 1.6, max: 1.6 });
      Game.skidMarks.push({ x: p.x + 14, y: p.y + p.h/2 - 4, w: 5, h: 7, life: 1.6, max: 1.6 });
    }
    // End the spinout — show "BACK IN CONTROL" briefly
    if (sp.t >= sp.dur) {
      Game.spinout = null;
      addPopup('BACK IN CONTROL', W * 0.5, H * 0.4, '#7af07a', 13);
    }
  } else {
    // ---- normal steering ----
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
  }

  // ---- fire ----
  Game.fireCooldown -= dt;
  const wantsFire = input.fire || Settings.autoFire;
  if (!Game.spinout && wantsFire && Game.fireCooldown <= 0) {
    fireGuns();
    const rapidMul = isPowerupActive('rapid') ? 0.5 : 1;
    const overdriveMul = isPowerupActive('overdrive') ? 0.78 : 1;
    const siegeMul = isPowerupActive('siege') ? 0.45 : 1;
    Game.fireCooldown = stats.fireRate * rapidMul * overdriveMul * siegeMul;
  }

  // ---- bullets ----
  for (let i = Game.bullets.length - 1; i >= 0; i--) {
    const b = Game.bullets[i];
    // Homing: steer toward nearest enemy or boss at a limited turn rate
    if (b.homing && (Game.enemies.length > 0 || Game.boss)) {
      let tx = null, ty = null, bestDist = Infinity;
      for (const e of Game.enemies) {
        const d = Math.hypot(e.x - b.x, e.y - b.y);
        if (d < bestDist) { bestDist = d; tx = e.x; ty = e.y; }
      }
      if (Game.boss) {
        const bd = Math.hypot(Game.boss.x - b.x, Game.boss.y - b.y);
        if (bd < bestDist) { tx = Game.boss.x; ty = Game.boss.y; }
      }
      if (tx !== null) {
        const spd = Math.hypot(b.vx || 0, b.vy);
        const desiredAngle = Math.atan2(ty - b.y, tx - b.x);
        const currentAngle = Math.atan2(b.vy, b.vx || 0);
        let dA = desiredAngle - currentAngle;
        // wrap to [-π, π]
        while (dA >  Math.PI) dA -= 2 * Math.PI;
        while (dA < -Math.PI) dA += 2 * Math.PI;
        const maxTurn = 3.5 * dt; // 3.5 rad/s turn rate applied per frame
        const turn = Math.max(-maxTurn, Math.min(maxTurn, dA));
        const newAngle = currentAngle + turn;
        b.vx = Math.cos(newAngle) * spd;
        b.vy = Math.sin(newAngle) * spd;
      }
    }
    b.y += b.vy * dt;
    if (b.vx) b.x += b.vx * dt;
    if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) Game.bullets.splice(i,1);
  }
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    const b = Game.enemyBullets[i];
    b.y += b.vy * dt; b.x += (b.vx || 0) * dt;
    if (b.gravity) b.vy += b.gravity * dt;
    if (b.telegraph) b.telegraph.t -= dt;
    if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) Game.enemyBullets.splice(i,1);
  }

  // ---- obstacles ----
  for (let i = Game.obstacles.length - 1; i >= 0; i--) {
    const o = Game.obstacles[i];
    // civilians/innocents drift at their own speed, others scroll with road
    if (isInnocentObstacle(o)) {
      o.y += (Game.speed + (o.vy || 0)) * dt;
      // kids on foot wander a little side-to-side
      if ((o.kind === 'kid' || o.kind === 'bigwheel') && o.wanderAmp) {
        o.wanderT = (o.wanderT || 0) + dt;
        o.x = clamp((o.baseX || o.x) + Math.sin(o.wanderT * (o.wanderSpeed || 1.5)) * o.wanderAmp,
                    o.w/2 + 4, W - o.w/2 - 4);
      }
      // hitchhikers wander side-to-side AND drift slowly toward the road center
      if (o.kind === 'hitchhiker' && o.wanderAmp) {
        o.wanderT = (o.wanderT || 0) + dt;
        const drift = (o.driftDir || 1) * o.wanderT * HITCHHIKER_DRIFT_SPEED; // slow inward drift
        o.x = clamp((o.baseX || o.x) + Math.sin(o.wanderT * (o.wanderSpeed || 0.9)) * o.wanderAmp + drift,
                    o.w/2 + 4, W - o.w/2 - 4);
      }
    } else {
      o.y += Game.speed * dt;
    }
    if (o.y > H + 80) { Game.obstacles.splice(i,1); continue; }

    if (isInnocentObstacle(o)) {
      const kind = o.kind;
      // bullets hitting an innocent = penalty
      for (let j = Game.bullets.length - 1; j >= 0; j--) {
        const b = Game.bullets[j];
        if (aabb(o, b)) {
          Game.bullets.splice(j,1);
          applyCivilianPenalty(o.x, o.y, kind);
          emit(o.x, o.y, 10, { color: o.color || '#4aa8e8', speed:180, life:0.5, size:3 });
          Game.obstacles.splice(i,1);
          break;
        }
      }
      if (!Game.obstacles[i]) continue;
      // player collision = penalty + damage (hitchhikers also trigger spinout)
      if (aabb(o, Game.player)) {
        applyCivilianPenalty(o.x, o.y, kind);
        if (kind === 'hitchhiker') {
          // hitting a hitchhiker sends the car into an out-of-control spinout
          startSpinout(o.x, o.y);
          damagePlayer(15);
        } else {
          damagePlayer(20);
        }
        emit(o.x, o.y, 16, { color: o.color || '#4aa8e8', speed:220, life:0.5, size:3 });
        Game.obstacles.splice(i,1);
        Game.shake = Math.max(Game.shake, 0.5);
      }
      continue;
    }

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
    // movement per kind
    if (e.kind === 'bike') {
      e.wave += e.waveSpeed * dt;
      e.baseX += e.vx * dt;
      e.x = e.baseX + Math.sin(e.wave) * e.waveAmp;
      e.y += (e.vy + Game.speed * 0.18) * dt;
    } else if (e.kind === 'mortar') {
      // stationary roadside; scrolls with road
      e.y += Game.speed * dt;
    } else if (e.kind === 'zombie') {
      // Zombies shuffle toward the player and wobble side-to-side
      e.wobble = (e.wobble || 0) + (e.wobbleSpeed || 3) * dt;
      if (Game.player) {
        const dx = Game.player.x - e.x;
        // gently steer toward player with a side-to-side shuffle
        e.vx = clamp(e.vx + dx * 0.4 * dt + Math.sin(e.wobble) * 12 * dt, -60, 60);
      }
      e.x += e.vx * dt;
      e.y += (e.vy + Game.speed * 0.10) * dt;
      // zombies can wander slightly off-road
      e.x = clamp(e.x, e.w, W - e.w);
    } else if (e.kind === 'drone') {
      // fast diagonal flier — bounces off road edges
      e.y += (e.vy + Game.speed * 0.12) * dt;
      e.x += e.vx * dt;
      const { x0:dx0, x1:dx1 } = roadBounds();
      if (e.x < dx0 + 18) { e.x = dx0 + 18; e.vx = Math.abs(e.vx); }
      if (e.x > dx1 - 18) { e.x = dx1 - 18; e.vx = -Math.abs(e.vx); }
    } else {
      e.y += (e.vy + Game.speed * 0.15) * dt;
      e.x += e.vx * dt;
    }
    // road clamp (skipped for mortar off-road; drone/zombie use own movement logic)
    if (e.kind !== 'mortar' && e.kind !== 'drone' && e.kind !== 'zombie') {
      const { x0:rx0, x1:rx1 } = roadBounds();
      if (e.x < rx0 + 24) { e.x = rx0 + 24; if (e.vx) e.vx = Math.abs(e.vx); }
      if (e.x > rx1 - 24) { e.x = rx1 - 24; if (e.vx) e.vx = -Math.abs(e.vx); }
    }
    // Zombies never shoot — skip bullet logic for them
    if (e.kind !== 'zombie') {
      e.fireT -= dt;
      if (e.fireT <= 0 && e.y > 0 && e.y < H * 0.85) {
        if (e.kind === 'mortar') {
          // arcing shell — spawn with gravity, telegraphed
          const dx = Game.player.x - e.x;
          const sp = 320;
          Game.enemyBullets.push({
            x: e.x, y: e.y + 6, w: 8, h: 8,
            vx: clamp(dx * 0.7, -260, 260) / 1.4,
            vy: -160,
            dmg: 14, gravity: 480, mortar: true,
            telegraph: { x: Game.player.x, t: 1.0 },
            src: e,
          });
          SFX.mortar();
          e.fireT = rand(2.4, 3.6);
        } else if (e.kind === 'bike') {
          // light side-shots
          Game.enemyBullets.push({ x:e.x, y:e.y+12, w:4, h:8, vx: rand(-30,30), vy: 360, dmg: 6, src: e });
          e.fireT = rand(1.4, 2.4);
        } else if (e.kind === 'drone') {
          // rapid burst: 3 quick shots toward player
          const dx = Game.player.x - e.x, dy = Game.player.y - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          const sp = 400;
          for (let k = 0; k < 3; k++) {
            const spread = (k - 1) * 0.12;
            Game.enemyBullets.push({
              x: e.x, y: e.y + e.h/2,
              w: 4, h: 7,
              vx: (dx/dist + spread) * sp,
              vy: (dy/dist) * sp,
              dmg: 5,
              src: e,
            });
          }
          e.fireT = rand(0.7, 1.3);
        } else if (e.kind === 'tank') {
          // spread shot: 3 bullets fanned out toward player
          const dx = Game.player.x - e.x, dy = Game.player.y - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          const sp = 300;
          const angles = [-0.22, 0, 0.22];
          for (const ang of angles) {
            const cos = Math.cos(ang), sin_ = Math.sin(ang);
            const nx = dx/dist * cos - dy/dist * sin_;
            const ny = dx/dist * sin_ + dy/dist * cos;
            Game.enemyBullets.push({
              x: e.x, y: e.y + e.h/2,
              w: 7, h: 12,
              vx: nx * sp, vy: ny * sp,
              dmg: 12,
              src: e,
            });
          }
          e.fireT = rand(2.0, 3.2);
        } else {
          const dx = Game.player.x - e.x, dy = Game.player.y - e.y;
          const dist = Math.hypot(dx, dy) || 1;
          const sp = 360;
          Game.enemyBullets.push({ x:e.x, y:e.y+20, w:5, h:10, vx:dx/dist*sp, vy:dy/dist*sp, dmg:8, src: e });
          e.fireT = rand(1.2, 2.2);
        }
      }
    }

    for (let j = Game.bullets.length - 1; j >= 0; j--) {
      const b = Game.bullets[j];
      if (aabb(e, b)) {
        Game.bullets.splice(j,1);
        const dmg = (b.dmg || 1) * (isPowerupActive('overdrive') ? 1.20 : 1) *
          ((isPowerupActive('nitro') ? Game.nitroDamageMul : 1));
        e.hp -= dmg;
        if (Settings.damageNumbers) addPopup('-' + Math.round(dmg), e.x, e.y - 8, b.crit ? '#ffb36a' : '#ffd86b', 11);
        emit(b.x, b.y, 5, { color:'#ffd86b', speed:200, life:0.3, size:2 });
        if (e.hp <= 0) {
          SFX.explode();
          const isBike = e.kind === 'bike';
          const isMortar = e.kind === 'mortar';
          const isZombie = e.kind === 'zombie';
          const isDrone = e.kind === 'drone';
          const isTank = e.kind === 'tank';
          const baseScore = isZombie
            ? (e.zombieScore || ENEMY_SCORE.zombie) * (e.elite ? ELITE_SCORE_MULTIPLIER : 1)
            : (ENEMY_SCORE[e.kind] || ENEMY_SCORE.buggy) * (e.elite ? ELITE_SCORE_MULTIPLIER : 1);
          if (isZombie) {
            emit(e.x, e.y, 12, { color:'#5a7a3a', speed:220, life:0.6, size:3 });
            emit(e.x, e.y, 6,  { color:'#1a2a10', speed:140, life:0.4, size:2 });
            shockwave(e.x, e.y, 'rgba(80,120,50,0.35)', 50);
            Game.shake = Math.max(Game.shake, 0.35);
          } else {
            const bigExplosion = isMortar || isTank;
            emit(e.x, e.y, bigExplosion ? 40 : isDrone ? 18 : 28, { color: isDrone ? '#c87af0' : '#ff6a2b', speed:360, life:0.8, size: isDrone ? 3 : 4 });
            emit(e.x, e.y, 14, { color:'#ffe07a', speed:240, life:0.6, size:3 });
            shockwave(e.x, e.y, isDrone ? 'rgba(200,122,240,0.4)' : 'rgba(255,140,60,0.4)', bigExplosion ? 120 : isDrone ? 50 : 70);
            if (bigExplosion) Game.shake = Math.max(Game.shake, 0.7);
            else Game.shake = Math.max(Game.shake, 0.5);
          }
          applyKill(e.x, e.y, baseScore);
          // drops
          const dropR = Math.random();
          const salvageBoost = isPowerupActive('salvage') || Game.runMutators.some(m => m.id === 'scavenger');
          if ((isMortar || isTank || e.elite) && dropR < (salvageBoost ? 0.8 : 0.5)) {
            Game.pickups.push({ kind:'powerup', power: rollPowerup(), x:e.x, y:e.y, w:26, h:26, t:0 });
          } else if (dropR < (salvageBoost ? 0.7 : 0.4)) {
            Game.pickups.push({ kind:'scrap', x:e.x, y:e.y, w:22, h:22, t:0 });
          }
          Game.enemies.splice(i,1);
          clearEnemyShotsFrom(e);
          break;
        } else { SFX.hit(); }
      }
    }
    if (!Game.enemies[i]) continue;

    if (aabb(e, Game.player)) {
      const isZombie = e.kind === 'zombie';
      // Zombies: running them down damages them, they claw the player
      const ramDmg = isZombie ? 3 : BASE_RAM_DAMAGE * Game.contactDamageMul;
      if (ramDmg > 0) e.hp -= ramDmg;
      // shield blocks contact damage but breaks the enemy
      if (isPowerupActive('shield')) {
        emit(e.x, e.y, 24, { color:'#7aaaff', speed: 280, life: 0.5, size: 3 });
        shockwave(Game.player.x, Game.player.y, 'rgba(122,170,255,0.55)', 80);
        applyKill(e.x, e.y, ENEMY_SCORE[e.kind] || 150);
        Game.enemies.splice(i,1);
        clearEnemyShotsFrom(e);
        Game.shake = Math.max(Game.shake, 0.5);
      } else if (e.hp <= 0) {
        applyKill(e.x, e.y, ENEMY_SCORE[e.kind] || 150);
        if (isZombie) {
          emit(e.x, e.y, 10, { color:'#5a7a3a', speed:200, life:0.5, size:3 });
        } else {
          emit(e.x, e.y, 16, { color:'#ffb36a', speed:280, life:0.5, size:3 });
        }
        Game.enemies.splice(i,1);
        clearEnemyShotsFrom(e);
      } else {
        damagePlayer(isZombie ? ((e.contact || 12) * Game.damageTakenMul) : e.kind === 'bike' || e.kind === 'drone' ? 28 : e.kind === 'tank' ? 55 : 40);
        SFX.explode();
        if (isZombie) {
          emit(e.x, e.y, 14, { color:'#5a7a3a', speed:200, life:0.5, size:3 });
          Game.shake = Math.max(Game.shake, 0.4);
          // zombie survives the hit but bounces back
          e.vy *= 0.7;
          e.vx = (e.x < Game.player.x ? -1 : 1) * 40;
        } else {
          emit(e.x, e.y, 24, { color:'#ff6a2b', speed:320, life:0.7, size:4 });
          Game.enemies.splice(i,1);
          clearEnemyShotsFrom(e);
          Game.shake = Math.max(Game.shake, 0.7);
        }
      }
    } else if (e.y > H + 60) Game.enemies.splice(i,1);
  }

  // ---- enemy bullets vs player ----
  for (let i = Game.enemyBullets.length - 1; i >= 0; i--) {
    const b = Game.enemyBullets[i];
    // mortar shells detonate on ground impact (telegraph hits 0 ~ground)
    if (b.mortar && b.telegraph && b.telegraph.t <= 0) {
      const ex = b.x, ey = b.y;
      emit(ex, ey, 30, { color:'#ff8a3d', speed: 320, life: 0.7, size: 4 });
      shockwave(ex, ey, 'rgba(255,140,60,0.45)', 110);
      SFX.explode();
      Game.shake = Math.max(Game.shake, 0.6);
      // splash radius
      const r = 80;
      if (Math.hypot(Game.player.x - ex, Game.player.y - ey) < r) {
        if (isPowerupActive('shield')) {
          shockwave(Game.player.x, Game.player.y, 'rgba(122,170,255,0.55)', 70);
        } else damagePlayer(b.dmg);
      }
      Game.enemyBullets.splice(i,1);
      continue;
    }
    if (aabb(b, Game.player)) {
      if (isPowerupActive('shield')) {
        emit(b.x, b.y, 8, { color:'#7aaaff', speed: 220, life: 0.4, size: 3 });
        shockwave(Game.player.x, Game.player.y, 'rgba(122,170,255,0.4)', 50);
      } else {
        damagePlayer(b.dmg || 8);
        emit(b.x, b.y, 6, { color:'#ff5050', speed:180, life:0.3, size:2 });
      }
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
        const x2 = isPowerupActive('x2') ? 2 : 1;
        const salvageMul = isPowerupActive('salvage') ? 1.5 : 1;
        const score = Math.round(75 * x2 * Game.pickupScoreMul * salvageMul);
        Game.score += score;
        emit(pk.x, pk.y, 12, { color:'#f5d76e', speed:220, life:0.5, size:3 });
        addPopup((x2 > 1 ? 'x2 ' : '') + '+' + score, pk.x, pk.y - 12, '#f5d76e', 13);
        SFX.scrap();
        Haptics.scrap();
      } else if (pk.kind === 'repair') {
        Game.health = Math.min(Game.maxHealth, Game.health + Game.maxHealth * 0.3);
        emit(pk.x, pk.y, 14, { color:'#7af07a', speed:220, life:0.5, size:3 });
        addPopup('+HULL', pk.x, pk.y - 12, '#7af07a', 13);
        SFX.pickup();
        Haptics.pickup();
      } else if (pk.kind === 'cache') {
        const bundle = 250 + (isPowerupActive('salvage') ? 150 : 0);
        Game.score += Math.round(bundle * Game.pickupScoreMul);
        Game.pickups.push({ kind:'powerup', power: rollPowerup(), x:pk.x, y:pk.y - 10, w:26, h:26, t:0 });
        emit(pk.x, pk.y, 20, { color:'#d2ff6f', speed:240, life:0.55, size:3 });
        addPopup('SUPPLY CACHE', pk.x, pk.y - 12, '#d2ff6f', 13);
        SFX.pickup();
        Haptics.pickup();
      } else if (pk.kind === 'powerup') {
        activatePowerup(pk.power, pk);
        Haptics.pickup();
      } else if (pk.kind === 'reserve') {
        // Bank this power-up for the start of the next run
        const def = POWERUPS[pk.power];
        Profile.bankPowerup(pk.power);
        emit(pk.x, pk.y, 22, { color:'#ffb3ff', speed:280, life:0.6, size:4 });
        shockwave(pk.x, pk.y, 'rgba(255,179,255,0.5)', 70);
        addPopup('BANKED: ' + (def ? def.name : pk.power), pk.x, pk.y - 16, '#ffb3ff', 13);
        SFX.powerUp();
        Haptics.pickup();
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

  // ---- popups (floating score text) ----
  for (let i = Game.popups.length - 1; i >= 0; i--) {
    const pp = Game.popups[i];
    pp.y += pp.vy * dt; pp.vy *= 0.94;
    pp.life -= dt;
    if (pp.life <= 0) Game.popups.splice(i, 1);
  }

  // ---- boss death sequence (boss already nulled, but explosions continue) ----
  if (Game.bossDeathSeq) updateBossDeath(dt);

  // ---- decor ----
  for (let i = Game.decor.length - 1; i >= 0; i--) {
    const d = Game.decor[i];
    d.y += Game.speed * dt;
    if (d.y > H + 30) Game.decor.splice(i,1);
  }
  while (Game.decor.length < 36) Game.decor.push(makeDecor());

  // ---- spawning (skip during boss approach/fight) ----
  if (!Game.boss && Game.mode !== 'bossrush') {
    const inHorde = !!Game.hordeMode;
    Game.spawnTimer -= dt;
    if (Game.spawnTimer <= 0) {
      const ambushMul = Game.activeEvent && Game.activeEvent.id === 'ambush' ? AMBUSH_SPAWN_MULTIPLIER : 1;
      const isZombieMode = Game.mode === 'zombie';
      // Zombie mode: shorter spawn intervals that tighten faster (harder escalating horde)
      const zombieInterval = Math.max(0.25, 0.9 - Game.distance / 18000);
      let baseInterval = isZombieMode ? zombieInterval :
        (Game.mode === 'timeattack' ? 0.35 :
        clamp(1.4 - (Game.levelData ? Game.levelData.diff : 1) * 0.18, 0.45, 1.4));
      if (inHorde) baseInterval = 0.18;
      // also factor score-based difficulty in classic
      const intervalMul = Game.mode === 'classic' ? Math.max(0.4, 1 - Game.distance / 30000) : 1;
      Game.spawnTimer = rand(baseInterval * 0.7 * intervalMul * ambushMul, baseInterval * 1.2 * intervalMul * ambushMul);
      spawnEnemy();
      // burst spawn in time attack or zombie mode (increasing burst over time)
      if (Game.mode === 'timeattack' && Math.random() < 0.4) spawnEnemy();
      if (isZombieMode && Game.distance > ZOMBIE_BURST_DIST_1 && Math.random() < 0.45) spawnEnemy();
      if (isZombieMode && Game.distance > ZOMBIE_BURST_DIST_2 && Math.random() < 0.35) spawnEnemy();
      if (inHorde) {
        // dense, mixed-enemy burst — vehicles AND zombies pouring in
        spawnEnemy();
        if (Math.random() < 0.7) spawnEnemy('zombie');
        if (Math.random() < 0.4) spawnEnemy('bikes');
        if (Math.random() < 0.25) spawnEnemy('drone');
      }
    }
    Game.pickupTimer -= dt;
    if (Game.pickupTimer <= 0) {
      spawnPickup();
      Game.pickupTimer = rand(Game.activeEvent && Game.activeEvent.id === 'convoy' ? 1.4 : 2.6, Game.activeEvent && Game.activeEvent.id === 'convoy' ? 2.8 : 4.6);
    }
    // Horde-nuke pickups: drop a horde-clearer every ~10s during a horde
    // level so the player can punch through the wall of enemies. Spawned
    // straight into pickups (not the regular powerup pool) so they only
    // appear during these scripted fights.
    if (inHorde) {
      Game.hordeMode.nukeT -= dt;
      if (Game.hordeMode.nukeT <= 0) {
        Game.hordeMode.nukeT = rand(8, 12);
        const { x0, x1 } = roadBounds();
        Game.pickups.push({
          kind:'powerup', power:'nuke',
          x: rand(x0 + 30, x1 - 30), y: -30,
          w: 28, h: 28, t: 0,
        });
      }
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
  const overdriveMul = isPowerupActive('overdrive') ? 1.2 : 1;
  const critChance = (Game.branchState && Game.branchState.critChance) || 0;
  const critMul = (Game.branchState && Game.branchState.critMul) || 1.6;
  const makeShot = extra => {
    const crit = Math.random() < critChance;
    const mul = crit ? critMul : 1;
    return Object.assign({
      owner:'p',
      dmg: stats.dmg * overdriveMul * mul,
      crit,
      homing: isPowerupActive('homing') || false,
    }, extra);
  };
  const bigShot = v.base.bigShot;
  const muzzleColor = v.color.glow;
  const triple = isPowerupActive('triple');
  Game.muzzleT = 0.08;
  if (bigShot) {
    Game.bullets.push(makeShot({ x:p.x, y:p.y - 30, w:8, h:18, vy:-720, big:true }));
    if (triple) {
      Game.bullets.push(makeShot({ x:p.x - 10, y:p.y - 26, w:5, h:14, vx:-160, vy:-700, dmg: stats.dmg * overdriveMul * 0.7 }));
      Game.bullets.push(makeShot({ x:p.x + 10, y:p.y - 26, w:5, h:14, vx: 160, vy:-700, dmg: stats.dmg * overdriveMul * 0.7 }));
    }
    SFX.bigShot();
    emit(p.x, p.y - 32, 6, { color:muzzleColor, speed:120, life:0.2, size:3, spread:Math.PI/3 });
    return;
  }
  if (guns === 1) {
    Game.bullets.push(makeShot({ x:p.x, y:p.y - 30, w:5, h:14, vy:-780 }));
    if (triple) {
      Game.bullets.push(makeShot({ x:p.x - 8, y:p.y - 28, w:4, h:12, vx:-220, vy:-740 }));
      Game.bullets.push(makeShot({ x:p.x + 8, y:p.y - 28, w:4, h:12, vx: 220, vy:-740 }));
    }
  } else if (guns === 2) {
    Game.bullets.push(makeShot({ x:p.x - 10, y:p.y - 26, w:4, h:12, vy:-780 }));
    Game.bullets.push(makeShot({ x:p.x + 10, y:p.y - 26, w:4, h:12, vy:-780 }));
    if (triple) {
      Game.bullets.push(makeShot({ x:p.x - 14, y:p.y - 24, w:4, h:12, vx:-260, vy:-720 }));
      Game.bullets.push(makeShot({ x:p.x + 14, y:p.y - 24, w:4, h:12, vx: 260, vy:-720 }));
      Game.bullets.push(makeShot({ x:p.x,      y:p.y - 30, w:5, h:14, vy:-820 }));
    }
  } else if (guns === 4) {
    [-16,-6,6,16].forEach(dx =>
      Game.bullets.push(makeShot({ x:p.x + dx, y:p.y - 26, w:3, h:10, vy:-820 }))
    );
    if (triple) {
      Game.bullets.push(makeShot({ x:p.x - 22, y:p.y - 22, w:3, h:10, vx:-280, vy:-720 }));
      Game.bullets.push(makeShot({ x:p.x + 22, y:p.y - 22, w:3, h:10, vx: 280, vy:-720 }));
    }
  }
  SFX.shoot();
  emit(p.x, p.y - 30, triple ? 6 : 3, { color:muzzleColor, speed:120, life:0.2, size:2, spread:Math.PI/3 });
  // SIEGE MODE — stacked on top of the vehicle's normal shots: a center
  // super-laser and a pair of side-mounted miniguns. Granted only at the
  // start of a boss horde level. This is intentionally over-the-top.
  if (isPowerupActive('siege')) {
    // center super-laser: massive piercing shot straight up
    Game.bullets.push(makeShot({
      x:p.x, y:p.y - 36, w:10, h:26,
      vy:-1100, big:true,
      dmg: stats.dmg * overdriveMul * 4.0 * (Math.random() < critChance ? critMul : 1),
    }));
    // side miniguns: fan of small fast bullets from each side
    [-1, 1].forEach(side => {
      for (let k = -1; k <= 1; k++) {
        Game.bullets.push(makeShot({
          x: p.x + side * 22, y: p.y - 12,
          w: 3, h: 9,
          vx: side * 60 + k * 80, vy: -880,
          dmg: stats.dmg * overdriveMul * 0.9,
        }));
      }
    });
    emit(p.x, p.y - 38, 4, { color:'#ffe07a', speed:200, life:0.18, size:3, spread:Math.PI/4 });
    emit(p.x - 22, p.y - 12, 2, { color:'#ffd86b', speed:160, life:0.15, size:2, spread:Math.PI/3 });
    emit(p.x + 22, p.y - 12, 2, { color:'#ffd86b', speed:160, life:0.15, size:2, spread:Math.PI/3 });
  }
}

function damagePlayer(amt) {
  if (Game.state !== 'playing') return;
  if (isPowerupActive('shield')) {
    // shield absorbs hit fully — visual cue only
    shockwave(Game.player.x, Game.player.y, 'rgba(122,170,255,0.55)', 70);
    return;
  }
  amt *= Game.damageTakenMul;
  // Armor plating absorbs half of incoming damage
  if (isPowerupActive('armor')) amt *= 0.5;
  if (Settings.damageNumbers) addPopup('-' + Math.ceil(amt), Game.player.x, Game.player.y - 36, '#ff8a8a', 12);
  Game.health -= amt;
  Game.flash = 1;
  Game.hitFlash = 0.35;
  // taking damage breaks the combo
  Game.combo = 0;
  Game.comboT = 0;
  if (Game.health <= 0) {
    Game.health = 0;
    triggerPlayerDeath();
  } else {
    SFX.hit();
    Haptics.hit();
  }
}

function triggerPlayerDeath() {
  const px = Game.player.x, py = Game.player.y;
  // first explosion stage
  emit(px, py, 50, { color:'#ff6a2b', speed:420, life:1.0, size:5 });
  emit(px, py, 24, { color:'#ffd86b', speed:320, life:0.8, size:4 });
  shockwave(px, py, 'rgba(255,140,60,0.6)', 140);
  Game.shake = 1.4;
  Game.flash = 1;
  SFX.death();
  Haptics.death();
  // freeze player as wreck — body remains, smokes for ~2s
  Game.wreck = { x: px, y: py, vx: Game.player.vx * 0.4, t: 0, rot: rand(-0.25, 0.25), rotV: rand(-1.4, 1.4) };
  Game.deathSeq = { t: 0, dur: 2.0, x: px, y: py };
  Game.state = 'dying';
  releaseWakeLock();
  pauseBtn.classList.remove('show');
}

function splashDamage(x, y, r, dmg) {
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    if (Math.hypot(e.x - x, e.y - y) < r) {
      e.hp -= dmg;
      if (e.hp <= 0) {
        SFX.explode();
        emit(e.x, e.y, 22, { color:'#ff6a2b', speed:320, life:0.7, size:4 });
        applyKill(e.x, e.y, ENEMY_SCORE[e.kind] || 120);
        Game.enemies.splice(i,1);
        clearEnemyShotsFrom(e);
      }
    }
  }
  for (let i = Game.obstacles.length - 1; i >= 0; i--) {
    const o = Game.obstacles[i];
    if (!o) continue;
    if (isInnocentObstacle(o) && Math.hypot(o.x - x, o.y - y) < r) {
      applyCivilianPenalty(o.x, o.y, o.kind);
      emit(o.x, o.y, 10, { color: o.color || '#4aa8e8', speed:180, life:0.5, size:3 });
      Game.obstacles.splice(i,1);
    } else if (o.kind === 'barrel' && Math.hypot(o.x - x, o.y - y) < r) {
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
  const t = activeBiomeTheme();
  // sky / ground gradient — cached and only rebuilt when size or
  // night/storm flags change (was: allocated every frame).
  ctx.fillStyle = getSkyGradient();
  ctx.fillRect(0, 0, W, H);

  // lightning flash (drawn over the gradient before parallax)
  if (Game.isStorm && Game.lightning > 0) {
    ctx.fillStyle = `rgba(220,225,255,${0.20 + Game.lightning * 0.7})`;
    ctx.fillRect(0, 0, W, H * 0.55);
    // bolt
    ctx.strokeStyle = 'rgba(245,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let bx = (Game.t * 99) % W;
    let by = 0;
    ctx.moveTo(bx, by);
    while (by < H * 0.4) {
      bx += rand(-22, 22);
      by += rand(14, 28);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
  }

  // stars at night (parallax-light) — varied sizes, twinkling, shooting star
  if (Game.isNight) {
    const seedY = Math.floor(Game.bgScroll * 0.05);
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + seedY * 23) % W;
      const sy = ((i * 71) % (H * 0.38));
      const tw = Math.sin(Game.t * (1.1 + (i % 5) * 0.28) + i) * 0.5 + 0.5;
      const sz = i % 7 === 0 ? 1.6 : i % 3 === 0 ? 1.0 : 0.55;
      ctx.globalAlpha = (0.2 + tw * 0.65) * (i % 5 === 0 ? 1 : 0.75);
      ctx.fillStyle = i % 9 === 0 ? 'rgba(180,210,255,1)' : i % 6 === 0 ? 'rgba(255,240,195,1)' : i % 11 === 0 ? 'rgba(255,210,210,1)' : 'rgba(255,255,255,1)';
      ctx.beginPath();
      ctx.arc(sx, sy, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    // shooting star — 9 s cycle; visible for the first 1 s of each cycle (~11 % of the time)
    const starPeriod = 9;
    const starPhase = (Game.t + 2.7) % starPeriod;
    if (starPhase < 1.0) {
      const p = starPhase;
      const seedStar = Math.floor((Game.t + 2.7) / starPeriod);
      const sx0 = ((seedStar * 173) % (W * 0.65)) + W * 0.08;
      const sy0 = ((seedStar * 89) % (H * 0.2));
      const ex = sx0 + 140 * p;
      const ey = sy0 + 55 * p;
      const alpha = Math.min(p * 4, (1 - p) * 2.5, 1);
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      const sg = ctx.createLinearGradient(ex, ey, ex - 50 * p, ey - 20 * p);
      sg.addColorStop(0, 'rgba(255,255,255,0.95)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 50 * p, ey - 20 * p);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Milky Way — faint diagonal band of extra glow
    const mwAlpha = 0.038 + 0.012 * Math.sin(Game.t * 0.18);
    const mwG = ctx.createLinearGradient(0, H * 0.04, W, H * 0.30);
    mwG.addColorStop(0,    'rgba(190,205,255,0)');
    mwG.addColorStop(0.35, `rgba(190,205,255,${mwAlpha})`);
    mwG.addColorStop(0.65, `rgba(215,228,255,${mwAlpha * 1.35})`);
    mwG.addColorStop(1,    'rgba(190,205,255,0)');
    ctx.fillStyle = mwG;
    ctx.fillRect(0, 0, W, H * 0.34);

    // Aurora — midnight biome only
    if (Game.biome === 'midnight') {
      const auroraColors = ['50,255,180', '80,150,255', '170,90,255'];
      for (let ai = 0; ai < 3; ai++) {
        const sway = Math.sin(Game.t * 0.38 + ai * 1.9) * W * 0.05;
        const bx = W * (0.18 + ai * 0.28) + sway;
        const bh = H * (0.13 + ai * 0.025);
        const aAlpha = 0.058 + 0.028 * Math.sin(Game.t * 0.65 + ai * 1.2);
        const ag = ctx.createLinearGradient(bx, H * 0.03, bx, H * 0.03 + bh);
        ag.addColorStop(0,   `rgba(${auroraColors[ai]},0)`);
        ag.addColorStop(0.5, `rgba(${auroraColors[ai]},${aAlpha})`);
        ag.addColorStop(1,   `rgba(${auroraColors[ai]},0)`);
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.ellipse(bx, H * 0.03 + bh * 0.5, 26 + ai * 8, bh * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Sparse clouds — daytime only, no storm
  if (!Game.isNight && !Game.isStorm) {
    const cloudColor = t.cloudDay || 'rgba(255,242,210,1)';
    const cloudScroll = (Game.bgScroll * 0.0004) % (W + 100);
    for (let ci = 0; ci < 6; ci++) {
      const cx = ((ci * 197 + cloudScroll) % (W + 120)) - 60;
      const cy = H * 0.06 + (ci * 53) % (H * 0.12);
      const cw = 55 + (ci * 37) % 70;
      const ch = 10 + (ci * 19) % 12;
      ctx.globalAlpha = 0.10 + (ci % 3) * 0.03;
      ctx.fillStyle = cloudColor;
      ctx.beginPath(); ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + cw * 0.35, cy - ch * 0.4, cw * 0.6, ch * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // FAR mesas (deepest parallax, scrolls slowly)
  const farScroll = (Game.bgScroll * 0.0008) % 1;
  ctx.fillStyle = Game.isNight ? t.farNight : t.farDay;
  for (const peak of Game.farPeaks) {
    const x = ((peak.x - farScroll) % 1 + 1) % 1;
    const px = x * W;
    const pw = peak.w * W;
    const ph = peak.h * H;
    const py = H * 0.30 - ph;
    ctx.beginPath();
    ctx.moveTo(px, H * 0.30);
    ctx.lineTo(px + pw * 0.3, py + ph * 0.4);
    ctx.lineTo(px + pw * 0.55, py);
    ctx.lineTo(px + pw * 0.75, py + ph * 0.55);
    ctx.lineTo(px + pw, H * 0.30);
    ctx.closePath();
    ctx.fill();
  }

  // distant mountains parallax
  ctx.fillStyle = Game.isNight ? t.mountainNight : t.mountainDay;
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
  ctx.fillStyle = Game.isNight ? t.hillsNight : t.hillsDay;
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

  // Horizon atmospheric haze — softens the terrain-sky seam
  {
    const hazY = H * 0.44;
    const fogColor = Game.isNight ? (t.fogNight || 'rgba(20,15,30,0.35)') : (t.fogDay || 'rgba(200,160,100,0.25)');
    const hazG = ctx.createLinearGradient(0, hazY - H * 0.04, 0, hazY + H * 0.04);
    hazG.addColorStop(0, 'rgba(0,0,0,0)');
    hazG.addColorStop(0.5, fogColor);
    hazG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hazG;
    ctx.fillRect(0, hazY - H * 0.04, W, H * 0.08);
  }

  // horizon heat shimmer — warm band at ground-sky boundary (daytime only)
  if (!Game.isNight && !Game.isStorm) {
    const hmY = H * 0.42;
    const heatAlpha = 0.035 + 0.018 * Math.sin(Game.t * 2.8);
    ctx.fillStyle = `rgba(255,195,110,${heatAlpha})`;
    ctx.fillRect(0, hmY - H * 0.05, W, H * 0.08);
  }

  // sun / moon
  if (Game.isNight) {
    const mx = W * 0.7, my = H * 0.16;
    // outer halos
    ctx.fillStyle = 'rgba(190,205,255,0.06)';
    ctx.beginPath(); ctx.arc(mx, my, 72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(205,215,255,0.12)';
    ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI * 2); ctx.fill();
    // moon disc — radial gradient for gentle limb darkening
    const mg = ctx.createRadialGradient(mx - 7, my - 7, 2, mx, my, 28);
    mg.addColorStop(0, 'rgba(245,248,255,0.96)');
    mg.addColorStop(0.7, 'rgba(210,220,255,0.88)');
    mg.addColorStop(1, 'rgba(175,192,240,0.72)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2); ctx.fill();
    // crater details
    ctx.fillStyle = 'rgba(130,148,200,0.28)';
    ctx.beginPath(); ctx.arc(mx + 8, my - 8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx - 10, my + 10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 14, my + 12, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    const sx = W * 0.7, sy = H * 0.20;
    // outer ambient glow
    ctx.fillStyle = 'rgba(245,175,55,0.06)';
    ctx.beginPath(); ctx.arc(sx, sy, 95, 0, Math.PI * 2); ctx.fill();
    // slowly rotating faint rays
    ctx.save();
    ctx.translate(sx, sy);
    const numRays = 14;
    for (let ri = 0; ri < numRays; ri++) {
      const ang = ri * (Math.PI * 2 / numRays) + Game.t * 0.014;
      const outerR = 62 + (ri % 3) * 18;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
      ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
      ctx.strokeStyle = `rgba(245,188,75,0.045)`;
      ctx.lineWidth = 5 - (ri % 2) * 1.5;
      ctx.stroke();
    }
    // sun disc — radial gradient bright center
    const sunG = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
    sunG.addColorStop(0, 'rgba(255,248,220,0.78)');
    sunG.addColorStop(0.5, 'rgba(255,210,95,0.58)');
    sunG.addColorStop(1, 'rgba(245,165,50,0.28)');
    ctx.fillStyle = sunG;
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawRoad() {
  const t = activeBiomeTheme();
  const { x0, x1, w } = roadBounds();
  // shoulder
  ctx.fillStyle = Game.isNight ? t.shoulderNight : t.shoulderDay;
  ctx.fillRect(0, 0, x0, H);
  ctx.fillRect(x1, 0, W - x1, H);

  // road (cached gradient — keyed on road bounds + isNight)
  ctx.fillStyle = getRoadGradient(x0, x1);
  ctx.fillRect(x0, 0, w, H);

  // road texture cracks (subtle)
  ctx.fillStyle = Game.isNight ? t.crackNight : t.crackDay;
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
  ctx.fillStyle = Game.isNight ? t.lineNight : t.lineDay;
  const cx = (x0 + x1) / 2;
  const dashH = 28, gap = 32;
  for (let y = -gap + Game.laneOffset; y < H + gap; y += dashH + gap) {
    ctx.fillRect(cx - 3, y, 6, dashH);
  }

  // secondary lane guides — thinner dashes at ⅓ and ⅔ road width
  const lineAlpha = Game.isNight ? 0.30 : 0.18;
  ctx.fillStyle = `rgba(245,215,110,${lineAlpha})`;
  const lane1x = x0 + w / 3;
  const lane2x = x0 + (2 * w) / 3;
  const dashH2 = 14, gap2 = 46;
  for (let y = -gap2 + Game.laneOffset * 0.7; y < H + gap2; y += dashH2 + gap2) {
    ctx.fillRect(lane1x - 1, y, 2, dashH2);
    ctx.fillRect(lane2x - 1, y, 2, dashH2);
  }
}

function drawDecor() {
  const t = activeBiomeTheme();
  for (const d of Game.decor) {
    if (d.type === 'rock') {
      const c = Math.floor(60*d.tone), c2 = Math.floor(40*d.tone), c3 = Math.floor(24*d.tone);
      const isNt = Game.isNight;
      // base body
      ctx.fillStyle = isNt ? `rgba(${c-20},${c2-15},${c3-5},1)` : `rgba(${c},${c2},${c3},1)`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.size, d.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // highlight on upper-left
      ctx.fillStyle = isNt ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.ellipse(d.x - d.size * 0.22, d.y - d.size * 0.22, d.size * 0.44, d.size * 0.26, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // shadow on lower-right
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath();
      ctx.ellipse(d.x + d.size * 0.38, d.y + d.size * 0.28, d.size * 0.58, d.size * 0.33, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'cactus') {
      ctx.fillStyle = Game.isNight ? t.cactusNight : t.cactusDay;
      // trunk
      ctx.fillRect(d.x - 3, d.y - d.size, 6, d.size);
      // left horizontal arm + upward tip
      ctx.fillRect(d.x - 10, d.y - d.size * 0.7, 7, d.size * 0.4);
      ctx.fillRect(d.x - 10, d.y - d.size * 0.7 - d.size * 0.28, 6, d.size * 0.3);
      // right horizontal arm + upward tip
      ctx.fillRect(d.x + 3, d.y - d.size * 0.55, 7, d.size * 0.35);
      ctx.fillRect(d.x + 3, d.y - d.size * 0.55 - d.size * 0.2, 6, d.size * 0.22);
      // subtle trunk highlight
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(d.x - 1, d.y - d.size + 2, 2, d.size - 4);
    } else if (d.type === 'wreck') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      // drop shadow (offset right/down)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-10, -6, 24, 16);
      ctx.fillStyle = Game.isNight ? t.wreckNight : t.wreckDay;
      ctx.fillRect(-12, -8, 24, 16);
      ctx.fillStyle = '#0d0805';
      ctx.fillRect(-10, -6, 4, 4);
      ctx.fillRect(6, -6, 4, 4);
      // rust streak
      ctx.fillStyle = 'rgba(160,60,30,0.28)';
      ctx.fillRect(-10, -2, 2, 8);
      ctx.restore();
    } else if (d.type === 'skull') {
      ctx.fillStyle = Game.isNight ? t.skullNight : t.skullDay;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 8, 6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#1a0f08';
      ctx.fillRect(d.x - 4, d.y - 1, 2, 3);
      ctx.fillRect(d.x + 2, d.y - 1, 2, 3);
      // jaw detail
      ctx.fillStyle = Game.isNight ? t.skullNight : t.skullDay;
      ctx.fillRect(d.x - 3, d.y + 3, 8, 2);
    } else if (d.type === 'tumbleweed') {
      ctx.save();
      ctx.translate(d.x, d.y);
      const roll = (Game.t * 1.4 + d.x * 0.08) % (Math.PI * 2);
      ctx.rotate(roll);
      ctx.strokeStyle = Game.isNight ? 'rgba(100,80,50,0.72)' : 'rgba(158,118,56,0.88)';
      ctx.lineWidth = 1.4;
      const tr = d.size * 0.5;
      ctx.beginPath(); ctx.arc(0, 0, tr, 0, Math.PI * 2); ctx.stroke();
      for (let ri = 0; ri < 4; ri++) {
        const ang = ri * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * tr, Math.sin(ang) * tr);
        ctx.lineTo(Math.cos(ang + Math.PI) * tr, Math.sin(ang + Math.PI) * tr);
        ctx.stroke();
      }
      ctx.restore();
    } else if (d.type === 'post') {
      // telephone pole silhouette
      const pc = Game.isNight ? 'rgba(55,40,25,0.9)' : 'rgba(95,72,48,1)';
      ctx.fillStyle = pc;
      const ph = d.size * 2.4;
      ctx.fillRect(d.x - 2, d.y - ph, 4, ph);
      ctx.fillRect(d.x - d.size * 0.7, d.y - ph * 0.82, d.size * 1.4, 3);
      ctx.fillStyle = Game.isNight ? 'rgba(110,90,50,0.85)' : 'rgba(190,155,90,1)';
      ctx.fillRect(d.x - d.size * 0.7, d.y - ph * 0.82 + 1, 5, 5);
      ctx.fillRect(d.x + d.size * 0.7 - 5, d.y - ph * 0.82 + 1, 5, 5);
    } else if (d.type === 'crystal') {
      // salt crystal spikes (saltflats)
      for (let ci = 0; ci < 3; ci++) {
        const ox = d.x + (ci - 1) * d.size * 0.38;
        const ch = d.size * (0.65 + ci * 0.18);
        ctx.fillStyle = Game.isNight ? 'rgba(155,178,215,0.82)' : 'rgba(215,232,255,0.92)';
        ctx.beginPath();
        ctx.moveTo(ox, d.y - ch);
        ctx.lineTo(ox - d.size * 0.11, d.y);
        ctx.lineTo(ox + d.size * 0.11, d.y);
        ctx.closePath();
        ctx.fill();
        // shine sliver
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.beginPath();
        ctx.moveTo(ox - 1, d.y - ch);
        ctx.lineTo(ox - d.size * 0.06, d.y - ch * 0.5);
        ctx.lineTo(ox + 1, d.y - ch * 0.5);
        ctx.closePath();
        ctx.fill();
      }
    } else if (d.type === 'bones') {
      const bc = Game.isNight ? 'rgba(178,168,155,0.82)' : 'rgba(228,218,196,1)';
      ctx.fillStyle = bc;
      ctx.beginPath(); ctx.arc(d.x - d.size * 0.35, d.y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + d.size * 0.35, d.y, 3.0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(d.x - d.size * 0.3, d.y - 1.5, d.size * 0.6, 3);
      ctx.save();
      ctx.translate(d.x, d.y + 6);
      ctx.rotate(0.8);
      ctx.fillRect(-d.size * 0.25, -1.5, d.size * 0.5, 3);
      ctx.restore();
    } else if (d.type === 'ashpile') {
      // low mound of ash
      ctx.fillStyle = Game.isNight ? 'rgba(32,28,36,0.88)' : 'rgba(62,55,62,0.92)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.size * 0.9, d.size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(148,140,148,0.28)';
      ctx.beginPath();
      ctx.ellipse(d.x - 2, d.y - 2, d.size * 0.5, d.size * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.type === 'stump') {
      const sc = Game.isNight ? 'rgba(28,18,20,0.92)' : 'rgba(58,36,30,1)';
      ctx.fillStyle = sc;
      const sw = d.size * 0.5, sh = d.size * 0.65;
      ctx.fillRect(d.x - sw / 2, d.y - sh, sw, sh);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(d.x - sw / 2, d.y - sh, sw * 0.48, sh * 0.11);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,200,160,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(d.x, d.y - sh + 3, sw * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else if (d.type === 'pillar') {
      // narrow sandstone column (redcanyon)
      const pc = Game.isNight ? 'rgba(85,28,18,0.92)' : 'rgba(162,68,36,1)';
      const pw = d.size * 0.32, ph = d.size * 2.2;
      ctx.fillStyle = pc;
      ctx.fillRect(d.x - pw, d.y - ph, pw * 2, ph);
      // wider cap
      ctx.fillRect(d.x - pw * 1.35, d.y - ph, pw * 2.7, ph * 0.1);
      // strata lines
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let li = 1; li < 4; li++) {
        ctx.fillRect(d.x - pw, d.y - ph * (li / 4), pw * 2, 1.5);
      }
      // sunlit edge
      ctx.fillStyle = 'rgba(255,200,140,0.14)';
      ctx.fillRect(d.x - pw, d.y - ph, pw * 0.32, ph);
    } else if (d.type === 'sign') {
      // abandoned road sign (midnight biome)
      ctx.fillStyle = Game.isNight ? 'rgba(38,42,62,0.92)' : 'rgba(52,58,78,1)';
      const ph = d.size * 1.6;
      ctx.fillRect(d.x - 2, d.y - ph, 4, ph);
      const sw = d.size * 1.2, sh = d.size * 0.7;
      ctx.fillStyle = 'rgba(28,32,48,0.94)';
      ctx.fillRect(d.x - sw / 2, d.y - ph, sw, sh);
      ctx.save();
      ctx.strokeStyle = Game.isNight ? 'rgba(80,120,220,0.48)' : 'rgba(100,140,240,0.36)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(d.x - sw / 2 + 2, d.y - ph + 2, sw - 4, sh - 4);
      ctx.restore();
      ctx.fillStyle = Game.isNight ? 'rgba(80,120,200,0.52)' : 'rgba(100,140,220,0.42)';
      ctx.fillRect(d.x - sw / 2 + 5, d.y - ph + sh * 0.3, sw * 0.6, 2);
      ctx.fillRect(d.x - sw / 2 + 5, d.y - ph + sh * 0.6, sw * 0.4, 2);
    }
  }
}

function drawWeather() {
  const t = activeBiomeTheme();
  if (Game.isStorm) {
    // sandstorm — diagonal streaks
    ctx.strokeStyle = t.stormLine;
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
    ctx.fillStyle = t.stormHaze;
    ctx.fillRect(0, 0, W, H);
  }
  if (Game.isNight) {
    // headlight cones from player
    const p = Game.player;
    const headlightRange = 240 * Game.nightVisionMul;
    const grad = ctx.createRadialGradient(p.x, p.y - 30, 20, p.x, p.y - 30, headlightRange);
    grad.addColorStop(0, 'rgba(255,235,180,0.20)');
    grad.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = grad;
    const coneLen = 260 * Game.nightVisionMul;
    ctx.beginPath();
    ctx.moveTo(p.x - 40, p.y);
    ctx.lineTo(p.x - 100, p.y - coneLen);
    ctx.lineTo(p.x + 100, p.y - coneLen);
    ctx.lineTo(p.x + 40, p.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawVehicle(x, y, vehicle, vx = 0, w = 42, h = 64, opts = {}) {
  let paintId = null;
  if (!opts.noCosmetic) {
    paintId = opts.paintId || null;
    if (!paintId && vehicle === Game.vehicle && Game.cosmetics) {
      paintId = Game.cosmetics.equippedPaint;
    }
  }
  const c = getVehiclePaint(vehicle, paintId);

  // ---- CEMETERY TANK special render ----
  if (vehicle.shape === 'tank') {
    ctx.save();
    ctx.translate(x, y);
    const tilt = clamp(vx / 460, -1, 1) * 0.08;
    ctx.rotate(tilt);
    const tw = w + 12, th = h;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-tw/2 + 5, -th/2 + 8, tw + 2, th);

    // tracks (wide sides)
    ctx.fillStyle = '#0a0a06';
    ctx.fillRect(-tw/2 - 7, -th/2, 12, th);
    ctx.fillRect( tw/2 - 5, -th/2, 12, th);
    // track links
    ctx.fillStyle = '#1c1c10';
    for (let i = 0; i < 8; i++) {
      const ty = -th/2 + 2 + i * (th / 8);
      ctx.fillRect(-tw/2 - 7, ty, 12, 2);
      ctx.fillRect( tw/2 - 5, ty, 12, 2);
    }
    // track drive wheels
    ctx.fillStyle = '#2a2a16';
    [-th/2 + 6, th/2 - 6].forEach(ty => {
      ctx.beginPath(); ctx.arc(-tw/2 - 1, ty, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( tw/2 + 1, ty, 6, 0, Math.PI*2); ctx.fill();
    });

    // hull body
    const hg = ctx.createLinearGradient(-tw/2, 0, tw/2, 0);
    hg.addColorStop(0, c.body); hg.addColorStop(0.4, '#252520'); hg.addColorStop(1, c.body);
    ctx.fillStyle = hg;
    ctx.fillRect(-tw/2, -th/2, tw, th);

    // front / rear armor slabs
    ctx.fillStyle = c.hood;
    ctx.fillRect(-tw/2, -th/2, tw, 10);
    ctx.fillRect(-tw/2,  th/2 - 8, tw, 8);

    // armor bolt rivets
    ctx.fillStyle = '#3a3828';
    [-tw/2 + 3, tw/2 - 7].forEach(bx => {
      for (let i = 0; i < 4; i++) ctx.fillRect(bx, -th/2 + 14 + i * 13, 4, 4);
    });

    // turret base plate
    ctx.fillStyle = c.cab;
    ctx.fillRect(-tw/4, -th/4, tw/2, th/2.4);
    // turret top gradient
    const tg = ctx.createLinearGradient(-tw/4, 0, tw/4, 0);
    tg.addColorStop(0, '#14140e'); tg.addColorStop(0.5, '#23231a'); tg.addColorStop(1, '#14140e');
    ctx.fillStyle = tg;
    ctx.fillRect(-tw/4 + 2, -th/4, tw/2 - 4, th/5);

    // cannon barrel
    ctx.fillStyle = '#0a0a06';
    ctx.fillRect(-4, th/4 - 6, 8, 20);
    // muzzle brake
    ctx.fillRect(-6, th/4 + 13, 12, 5);

    // skull emblem on turret top
    ctx.fillStyle = c.glow;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(-7, -th/4 + 2, 14, 9); // skull dome
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.cab;
    ctx.fillRect(-6, -th/4 + 4, 4, 4); // left eye socket
    ctx.fillRect( 2, -th/4 + 4, 4, 4); // right eye socket
    ctx.fillRect(-5, -th/4 + 8, 2, 3); // left tooth
    ctx.fillRect(-1, -th/4 + 8, 2, 3); // mid tooth
    ctx.fillRect( 3, -th/4 + 8, 2, 3); // right tooth

    // toxic green glow aura (ambient)
    ctx.fillStyle = c.glow;
    ctx.globalAlpha = 0.07;
    ctx.fillRect(-tw/2 - 8, -th/2 - 8, tw + 16, th + 16);
    ctx.globalAlpha = 1;

    // headlights (toxic green)
    ctx.fillStyle = c.glow;
    ctx.fillRect(-tw/2 + 3, -th/2 - 5, 8, 4);
    ctx.fillRect( tw/2 - 11, -th/2 - 5, 8, 4);

    // muzzle flash on recent shot
    const ft = Game.player ? (Game.player.fireT || 1) : 1;
    if (ft < 0.12) {
      ctx.fillStyle = `rgba(122,255,90,${0.9 * (1 - ft / 0.12)})`;
      ctx.beginPath(); ctx.arc(0, th/4 + 18, 9, 0, Math.PI*2); ctx.fill();
    }

    // exhaust (reuse trail system)
    const exFlicker = 0.5 + 0.5 * Math.sin((Game.t || 0) * 28);
    const exLen = 5 + exFlicker * 10;
    const trail = getTrailDef(!opts.noCosmetic && Game.cosmetics ? Game.cosmetics.equippedTrail : null);
    const [hot, warm] = trail.flameColors || [[255, 220, 80], [255, 115, 25]];
    const exGl = ctx.createLinearGradient(0, th/2 - 2, 0, th/2 + exLen);
    exGl.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},${0.9 * exFlicker + 0.35})`);
    exGl.addColorStop(0.45, `rgba(${warm[0]},${warm[1]},${warm[2]},${0.75 * exFlicker + 0.1})`);
    exGl.addColorStop(1, 'rgba(255,35,0,0)');
    ctx.fillStyle = exGl;
    ctx.fillRect(-tw/2 + 4, th/2 - 2, 6, exLen);
    ctx.fillRect( tw/2 - 10, th/2 - 2, 6, exLen);

    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  const tilt = opts.forcedRot !== undefined
    ? opts.forcedRot
    : clamp(vx / 460, -1, 1) * 0.18;
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
  // exhaust flames — animated flicker
  const exFlicker = 0.5 + 0.5 * Math.sin((Game.t || 0) * 28);
  const exLen = 5 + exFlicker * 10;
  const trail = getTrailDef(!opts.noCosmetic && Game.cosmetics ? Game.cosmetics.equippedTrail : null);
  const [hot, warm] = trail.flameColors || [[255, 220, 80], [255, 115, 25]];
  const exGl = ctx.createLinearGradient(0, h / 2 - 2, 0, h / 2 + exLen);
  exGl.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},${0.9 * exFlicker + 0.35})`);
  exGl.addColorStop(0.45, `rgba(${warm[0]},${warm[1]},${warm[2]},${0.75 * exFlicker + 0.1})`);
  exGl.addColorStop(1, 'rgba(255,35,0,0)');
  ctx.fillStyle = exGl;
  ctx.fillRect(-11, h / 2 - 2, 6, exLen);
  ctx.fillRect(5, h / 2 - 2, 6, exLen);

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
    // bright hazard banding (visual clarity) — yellow/black diagonal stripes
    // along the bumper so the silhouette reads instantly against the road
    ctx.fillStyle = '#ffd000';
    ctx.fillRect(-o.w/2,  o.h/2 - 6, o.w, 4);
    ctx.fillStyle = '#1a0f08';
    for (let sx = -o.w/2; sx < o.w/2; sx += 8) {
      ctx.fillRect(sx + 2, o.h/2 - 6, 4, 4);
    }
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
    // bright yellow hazard band around middle for visibility against road
    ctx.fillStyle = '#ffd000';
    ctx.fillRect(o.x - o.w/2, o.y - 2, o.w, 6);
    ctx.fillStyle = '#1a0f08';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', o.x, o.y);
  } else if (o.kind === 'civilian') {
    // Bright, friendly-looking car — clearly NOT an enemy
    const col = o.color || '#4aa8e8';
    ctx.save();
    ctx.translate(o.x, o.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-o.w/2 + 3, -o.h/2 + 5, o.w, o.h);
    // body
    ctx.fillStyle = col;
    ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
    // hood highlight
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-o.w/2 + 3, -o.h/2, o.w - 6, 10);
    // cab roof
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-o.w/2 + 5, -o.h/2 + 14, o.w - 10, 18);
    // windshield (bright blue = civilians going away from player)
    ctx.fillStyle = 'rgba(180,230,255,0.75)';
    ctx.fillRect(-o.w/2 + 7, -o.h/2 + 16, o.w - 14, 6);
    // wheels
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-o.w/2 - 3, -o.h/2 + 8, 5, 10);
    ctx.fillRect( o.w/2 - 2, -o.h/2 + 8, 5, 10);
    ctx.fillRect(-o.w/2 - 3,  o.h/2 - 16, 5, 10);
    ctx.fillRect( o.w/2 - 2,  o.h/2 - 16, 5, 10);
    // "CIV" warning badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CIV', 0, 0);
    // pulsing warning halo
    const pulse = 0.5 + 0.5 * Math.sin(Game.t * 6);
    ctx.strokeStyle = `rgba(255,255,100,${0.4 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-o.w/2 - 3, -o.h/2 - 3, o.w + 6, o.h + 6);
    ctx.restore();
  } else if (o.kind === 'kid') {
    // Small child crossing on foot — bright top, tiny legs, pulsing yellow halo.
    const col = o.color || '#ffe07a';
    ctx.save();
    ctx.translate(o.x, o.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(2, o.h/2 - 2, o.w/2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // pulsing warning halo (high-contrast — kids must be missed)
    const pulse = 0.5 + 0.5 * Math.sin(Game.t * 6);
    ctx.strokeStyle = `rgba(255,255,80,${0.55 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-o.w/2 - 3, -o.h/2 - 3, o.w + 6, o.h + 6);
    // legs
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-4, 2, 3, o.h/2 - 2);
    ctx.fillRect( 1, 2, 3, o.h/2 - 2);
    // body / shirt
    ctx.fillStyle = col;
    ctx.fillRect(-o.w/2 + 1, -o.h/2 + 6, o.w - 2, o.h/2);
    // shirt highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-o.w/2 + 2, -o.h/2 + 6, o.w - 4, 3);
    // head
    ctx.fillStyle = '#f0c08a';
    ctx.beginPath();
    ctx.arc(0, -o.h/2 + 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // hair cap (matches shirt for visibility cluster)
    ctx.fillStyle = '#3a2a18';
    ctx.beginPath();
    ctx.arc(0, -o.h/2 + 2, 4.5, Math.PI, 0);
    ctx.fill();
    // arrow above (pointing up — they're walking, not racing toward player)
    ctx.fillStyle = `rgba(255,255,80,${0.7 + 0.3 * pulse})`;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('KID', 0, -o.h/2 - 5);
    ctx.restore();
  } else if (o.kind === 'bigwheel') {
    // Child on a Big Wheel toy car — low, wide, bright plastic colors.
    const col = o.color || '#ff5050';
    ctx.save();
    ctx.translate(o.x, o.y);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-o.w/2 + 3, -o.h/2 + 4, o.w, o.h);
    // pulsing warning halo
    const pulse = 0.5 + 0.5 * Math.sin(Game.t * 6);
    ctx.strokeStyle = `rgba(255,255,80,${0.55 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-o.w/2 - 3, -o.h/2 - 3, o.w + 6, o.h + 6);
    // chassis (bright plastic)
    ctx.fillStyle = col;
    ctx.fillRect(-o.w/2, -o.h/2 + 4, o.w, o.h - 8);
    // chassis highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-o.w/2 + 2, -o.h/2 + 4, o.w - 4, 3);
    // big front wheel
    ctx.fillStyle = '#1a0f08';
    ctx.beginPath();
    ctx.arc(0, o.h/2 - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a4030';
    ctx.beginPath();
    ctx.arc(0, o.h/2 - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    // small rear wheels
    ctx.fillStyle = '#1a0f08';
    ctx.beginPath();
    ctx.arc(-o.w/2 + 2, -o.h/2 + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc( o.w/2 - 2, -o.h/2 + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    // child rider (head) sitting on top
    ctx.fillStyle = '#f0c08a';
    ctx.beginPath();
    ctx.arc(0, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // helmet
    ctx.fillStyle = '#ffd000';
    ctx.beginPath();
    ctx.arc(0, -2, 3.8, Math.PI, 0);
    ctx.fill();
    // label
    ctx.fillStyle = `rgba(255,255,80,${0.7 + 0.3 * pulse})`;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('KID', 0, -o.h/2 - 5);
    ctx.restore();
  } else if (o.kind === 'hitchhiker') {
    // Adult pedestrian on the road shoulder with thumb out — classic hitchhiker pose.
    // Pulsing yellow halo signals danger: do NOT run them over.
    const col = o.color || '#e8c84a';
    ctx.save();
    ctx.translate(o.x, o.y);
    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(2, o.h/2, o.w/2 + 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // pulsing warning halo
    const pulse = 0.5 + 0.5 * Math.sin(Game.t * 6);
    ctx.strokeStyle = `rgba(255,255,80,${0.45 + 0.45 * pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(-o.w/2 - 4, -o.h/2 - 4, o.w + 8, o.h + 8);
    // legs — slightly apart for standing pose
    ctx.fillStyle = '#3a2818';
    ctx.fillRect(-4, o.h/2 - 11, 3, 11);
    ctx.fillRect( 1, o.h/2 - 11, 3, 11);
    // body / jacket
    ctx.fillStyle = col;
    ctx.fillRect(-o.w/2 + 1, -o.h/2 + 8, o.w - 2, o.h/2 + 2);
    // jacket highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(-o.w/2 + 2, -o.h/2 + 8, o.w - 4, 3);
    // collar / shirt strip
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-2, -o.h/2 + 9, 4, o.h/2);
    // hitchhiking arm — outstretched to the side with thumb up
    ctx.fillStyle = '#f0c08a';
    ctx.fillRect(o.w/2 - 1, -o.h/2 + 12, 9, 4);   // forearm
    ctx.beginPath(); ctx.arc(o.w/2 + 8, -o.h/2 + 10, 4, 0, Math.PI * 2); ctx.fill(); // fist/thumb
    // thumb point (small upward nub)
    ctx.fillRect(o.w/2 + 6, -o.h/2 + 5, 3, 5);
    // head
    ctx.fillStyle = '#f0c08a';
    ctx.beginPath();
    ctx.arc(0, -o.h/2 + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    // hair
    ctx.fillStyle = '#3a2818';
    ctx.beginPath();
    ctx.arc(0, -o.h/2 + 3, 5, Math.PI, 0);
    ctx.fill();
    // duffel bag on other shoulder (small rectangle)
    ctx.fillStyle = '#7a5c38';
    ctx.fillRect(-o.w/2 - 5, -o.h/2 + 10, 5, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-o.w/2 - 4, -o.h/2 + 11, 2, 3);
    // "HITCH" label above
    ctx.fillStyle = `rgba(255,255,80,${0.75 + 0.25 * pulse})`;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('HITCH', 0, -o.h/2 - 5);
    ctx.restore();
  }
}

function drawEnemyThreatHalos() {
  if (!Game.enemies.length) return;
  ctx.save();
  for (const e of Game.enemies) {
    if (e.kind === 'zombie' || e.kind === 'drone') continue; // these have their own clear silhouettes
    const r = Math.max(e.w, e.h) * 0.65;
    const g = ctx.createRadialGradient(e.x, e.y + e.h * 0.25, r * 0.2, e.x, e.y + e.h * 0.25, r);
    g.addColorStop(0, 'rgba(255,40,40,0.45)');
    g.addColorStop(0.55, 'rgba(255,40,40,0.18)');
    g.addColorStop(1,   'rgba(255,40,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.h * 0.25, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(e) {
  if (e.kind === 'bike')   { drawBike(e);   return; }
  if (e.kind === 'mortar') { drawMortar(e); return; }
  if (e.kind === 'zombie') { drawZombie(e); return; }
  if (e.kind === 'drone')  { drawDrone(e);  return; }
  if (e.kind === 'tank')   { drawTank(e);   return; }
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
  if (e.elite) {
    ctx.strokeStyle = '#ffb36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 3, -e.h/2 - 3, e.w + 6, e.h + 6);
  }
  ctx.restore();
}

function drawBike(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-e.w/2 + 2, -e.h/2 + 4, e.w, e.h);
  // frame
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
  // rider torso
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(-e.w/2 + 4, -e.h/2 + 6, e.w - 8, 16);
  // helmet
  ctx.fillStyle = '#5a0a0a';
  ctx.beginPath(); ctx.arc(0, -e.h/2 + 4, 5, 0, Math.PI * 2); ctx.fill();
  // visor
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(-3, -e.h/2 + 3, 6, 2);
  // wheels
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(-3, -e.h/2 - 3, 6, 8);
  ctx.fillRect(-3,  e.h/2 - 5, 6, 8);
  // exhaust spit
  ctx.fillStyle = 'rgba(255,140,60,0.55)';
  ctx.fillRect(-e.w/2 - 3, e.h/2 - 8, 3, 6);
  ctx.fillRect( e.w/2,     e.h/2 - 8, 3, 6);
  if (e.elite) {
    ctx.strokeStyle = '#ffb36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 3, -e.h/2 - 3, e.w + 6, e.h + 6);
  }
  ctx.restore();
}

function drawMortar(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(2, e.h/2, e.w/2 + 2, 5, 0, 0, Math.PI*2); ctx.fill();
  // sandbags base
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(-e.w/2, e.h/2 - 8, e.w, 8);
  ctx.fillStyle = '#3a2410';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * 10 - 4, e.h/2 - 7, 8, 6);
  }
  // mortar tube
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(-5, -e.h/2, 10, e.h - 4);
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(-5, -e.h/2, 10, 4);
  // muzzle glow if recently fired
  if (e.fireT > 1.6) {
    ctx.fillStyle = 'rgba(255,180,60,0.5)';
    ctx.beginPath(); ctx.arc(0, -e.h/2 + 2, 6, 0, Math.PI*2); ctx.fill();
  }
  // crew/operator
  ctx.fillStyle = '#5a0a0a';
  ctx.beginPath(); ctx.arc(-e.w/2 + 4, e.h/2 - 12, 3, 0, Math.PI * 2); ctx.fill();
  if (e.elite) {
    ctx.strokeStyle = '#ffb36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 3, -e.h/2 - 3, e.w + 6, e.h + 6);
  }
  ctx.restore();
}

function drawZombie(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const isBruiser = e.zombieType === 'bruiser';
  const isRunner  = e.zombieType === 'runner';
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(1, e.h/2 + 2, e.w/2 + 2, 4, 0, 0, Math.PI*2); ctx.fill();
  // legs (two rects, offset for shamble animation)
  const legOffset = Math.sin((e.wobble || 0) * 1.8) * (isRunner ? 5 : 3);
  ctx.fillStyle = e.goreColor || '#2a3a18';
  ctx.fillRect(-e.w/2 + 2, e.h/4, e.w/2 - 3, e.h/4 + 2 + legOffset);
  ctx.fillRect(3, e.h/4, e.w/2 - 3, e.h/4 + 2 - legOffset);
  // torso
  ctx.fillStyle = e.color || '#3a4a28';
  ctx.fillRect(-e.w/2, -e.h/4, e.w, e.h/2 + 4);
  // arms (reaching forward / swinging)
  const armSwing = Math.sin((e.wobble || 0)) * (isBruiser ? 4 : 6);
  ctx.fillStyle = e.goreColor || '#2a3a18';
  ctx.fillRect(-e.w/2 - 4, -e.h/4 + armSwing, 5, isBruiser ? 14 : 10);
  ctx.fillRect( e.w/2 - 1, -e.h/4 - armSwing, 5, isBruiser ? 14 : 10);
  // head
  const headWobble = Math.sin((e.wobble || 0) * 0.7) * 1.5;
  ctx.fillStyle = e.color || '#3a4a28';
  const hw = isBruiser ? 12 : 8, hh = isBruiser ? 12 : 9;
  ctx.fillRect(-hw/2 + headWobble, -e.h/2, hw, hh);
  // glowing eyes
  ctx.fillStyle = isRunner ? '#c8ff80' : isBruiser ? '#ff8040' : '#90c860';
  ctx.fillRect(-hw/2 + 2 + headWobble, -e.h/2 + 3, hw/2 - 3, 2);
  ctx.fillRect(2 + headWobble, -e.h/2 + 3, hw/2 - 3, 2);
  // bite mark / gore detail
  ctx.fillStyle = 'rgba(120,40,20,0.55)';
  ctx.fillRect(-3, -e.h/4 + 2, 5, 3);
  if (e.elite) {
    ctx.strokeStyle = '#c8ff80';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 4, -e.h/2 - 4, e.w + 8, e.h + 8);
  }
  ctx.restore();
}

function drawDrone(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // tilt in direction of horizontal travel
  const tilt = clamp(e.vx / 160, -1, 1) * 0.3;
  ctx.rotate(tilt);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(3, e.h/2 + 2, e.w/2, 4, 0, 0, Math.PI*2); ctx.fill();
  // wings (angled rects)
  ctx.fillStyle = '#2a1a40';
  ctx.beginPath();
  ctx.moveTo(-e.w/2 - 8, 0);
  ctx.lineTo(-4, -e.h/4);
  ctx.lineTo(-4,  e.h/4);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(e.w/2 + 8, 0);
  ctx.lineTo(4, -e.h/4);
  ctx.lineTo(4,  e.h/4);
  ctx.closePath(); ctx.fill();
  // fuselage body
  const bg = ctx.createLinearGradient(0, -e.h/2, 0, e.h/2);
  bg.addColorStop(0, '#4a2870'); bg.addColorStop(0.5, '#6a3a9a'); bg.addColorStop(1, '#4a2870');
  ctx.fillStyle = bg;
  ctx.fillRect(-e.w/4, -e.h/2, e.w/2, e.h);
  // engine glow
  ctx.fillStyle = 'rgba(200,122,240,0.7)';
  ctx.beginPath(); ctx.arc(0, e.h/2 - 4, 4, 0, Math.PI*2); ctx.fill();
  // sensor eye
  ctx.fillStyle = '#ff40ff';
  ctx.beginPath(); ctx.arc(0, -e.h/4, 3, 0, Math.PI*2); ctx.fill();
  if (e.elite) {
    ctx.strokeStyle = '#ffb36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 10, -e.h/2 - 2, e.w + 20, e.h + 4);
  }
  ctx.restore();
}

function drawTank(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-e.w/2 + 5, -e.h/2 + 8, e.w, e.h);
  // tracks (sides)
  ctx.fillStyle = '#0d0d08';
  ctx.fillRect(-e.w/2 - 5, -e.h/2 + 6, 8, e.h - 12);
  ctx.fillRect( e.w/2 - 3, -e.h/2 + 6, 8, e.h - 12);
  // track links
  ctx.fillStyle = '#1a1a10';
  for (let i = 0; i < 5; i++) {
    const ty = -e.h/2 + 10 + i * 10;
    ctx.fillRect(-e.w/2 - 5, ty, 8, 2);
    ctx.fillRect( e.w/2 - 3, ty, 8, 2);
  }
  // hull body
  const hg = ctx.createLinearGradient(-e.w/2, 0, e.w/2, 0);
  hg.addColorStop(0, '#2a3010'); hg.addColorStop(0.5, '#3a4018'); hg.addColorStop(1, '#2a3010');
  ctx.fillStyle = hg;
  ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
  // armor plates (angled front)
  ctx.fillStyle = '#1a2008';
  ctx.beginPath();
  ctx.moveTo(-e.w/2, e.h/2);
  ctx.lineTo(0, e.h/2 + 12);
  ctx.lineTo(e.w/2, e.h/2);
  ctx.closePath(); ctx.fill();
  // turret base
  ctx.fillStyle = '#1a2010';
  ctx.fillRect(-e.w/4, -e.h/4, e.w/2, e.h/2.2);
  // turret top (rotated slightly toward player)
  ctx.fillStyle = '#252c10';
  ctx.fillRect(-e.w/4 + 2, -e.h/4, e.w/2 - 4, e.h/4);
  // cannon barrel
  ctx.fillStyle = '#0d0d08';
  ctx.fillRect(-3, e.h/4, 6, 18);
  // muzzle glow when firing
  if (e.fireT < 0.4) {
    ctx.fillStyle = 'rgba(255,220,80,0.6)';
    ctx.beginPath(); ctx.arc(0, e.h/4 + 18, 6, 0, Math.PI*2); ctx.fill();
  }
  // hatch
  ctx.fillStyle = '#3a4020';
  ctx.beginPath(); ctx.arc(-e.w/4 + 8, -e.h/4 + 6, 5, 0, Math.PI*2); ctx.fill();
  if (e.elite) {
    ctx.strokeStyle = '#ffb36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w/2 - 4, -e.h/2 - 4, e.w + 8, e.h + 8);
  }
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
  } else if (pk.kind === 'repair') {
    ctx.fillStyle = 'rgba(122,240,122,0.2)';
    ctx.beginPath(); ctx.arc(pk.x, pk.y + bob, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(pk.x - 11, pk.y + bob - 11, 22, 22);
    ctx.fillStyle = '#7af07a';
    ctx.fillRect(pk.x - 9, pk.y + bob - 9, 18, 18);
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(pk.x - 2, pk.y + bob - 7, 4, 14);
    ctx.fillRect(pk.x - 7, pk.y + bob - 2, 14, 4);
  } else if (pk.kind === 'cache') {
    ctx.save();
    ctx.translate(pk.x, pk.y + bob);
    ctx.rotate(pk.t * 1.4);
    ctx.fillStyle = 'rgba(210,255,111,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#41361a';
    ctx.fillRect(-12, -10, 24, 20);
    ctx.fillStyle = '#d2ff6f';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(-3, -8, 6, 16);
    ctx.fillRect(-10, -1, 20, 2);
    ctx.restore();
  } else if (pk.kind === 'powerup') {
    const def = POWERUPS[pk.power] || POWERUPS.shield;
    const c = def.color;
    // pulsing aura
    ctx.save();
    ctx.translate(pk.x, pk.y + bob);
    const pulse = 0.5 + 0.5 * Math.sin(pk.t * 5);
    ctx.globalAlpha = 0.18 + 0.12 * pulse;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(0, 0, 22 + pulse * 4, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    // hex outline
    const r = 13;
    ctx.fillStyle = '#1a0f08';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 - Math.PI / 6 + pk.t * 0.6;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    // hex inner fill
    ctx.fillStyle = c;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 - Math.PI / 6 + pk.t * 0.6;
      const px = Math.cos(a) * (r - 3);
      const py = Math.sin(a) * (r - 3);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    // glyph
    ctx.fillStyle = '#1a0f08';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.glyph, 0, 1);
    ctx.restore();
  } else if (pk.kind === 'reserve') {
    // Reserve vault — a spinning diamond with a star inside, purple-gold palette
    const rdef = POWERUPS[pk.power];
    const pulse = 0.5 + 0.5 * Math.sin(pk.t * 4.5);
    ctx.save();
    ctx.translate(pk.x, pk.y + bob);
    ctx.rotate(pk.t * 1.1);
    // outer aura
    ctx.globalAlpha = 0.2 + 0.15 * pulse;
    ctx.fillStyle = '#ffb3ff';
    ctx.beginPath(); ctx.arc(0, 0, 22 + pulse * 5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // diamond border
    const dr = 14;
    ctx.fillStyle = '#1a0f08';
    ctx.beginPath();
    ctx.moveTo(0, -dr); ctx.lineTo(dr, 0); ctx.lineTo(0, dr); ctx.lineTo(-dr, 0);
    ctx.closePath(); ctx.fill();
    // diamond fill (gold-to-purple gradient)
    const gr = ctx.createLinearGradient(-dr, 0, dr, 0);
    gr.addColorStop(0, '#ffd86b');
    gr.addColorStop(1, '#d06fff');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(0, -(dr - 3)); ctx.lineTo(dr - 3, 0);
    ctx.lineTo(0, dr - 3); ctx.lineTo(-(dr - 3), 0);
    ctx.closePath(); ctx.fill();
    // glyph: show the power-up's own glyph to hint what's banked
    ctx.fillStyle = '#1a0f08';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rdef ? rdef.glyph : '★', 0, 1);
    ctx.restore();
    // "NEXT RUN" label below
    ctx.save();
    ctx.globalAlpha = 0.65 + 0.2 * pulse;
    ctx.fillStyle = '#ffb3ff';
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('NEXT RUN', pk.x, pk.y + bob + 16);
    ctx.restore();
  }
}

function drawBullets() {
  // Player bullets — additive glow halo behind the bright core for a punchier
  // tracer look. Quality-gated: skipped when the perf governor has shed
  // particle budget aggressively (q < ~0.3) to keep low-end devices smooth.
  const glowOn = (PerfMon.quality > 0.25) && (Settings.particles > 0.4);
  if (glowOn && Game.bullets.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of Game.bullets) {
      const r = (b.big ? 14 : 9);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      if (b.homing) {
        g.addColorStop(0, 'rgba(255,140,255,0.6)');
        g.addColorStop(1, 'rgba(200,60,255,0)');
      } else {
        g.addColorStop(0, 'rgba(255,220,140,0.55)');
        g.addColorStop(1, 'rgba(255,180,80,0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  for (const b of Game.bullets) {
    if (b.big) {
      ctx.fillStyle = 'rgba(255,180,80,0.3)';
      ctx.fillRect(b.x - b.w, b.y - b.h, b.w * 2, b.h * 2);
    }
    ctx.fillStyle = b.homing ? '#ffaaff' : '#fff3b0';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    ctx.fillStyle = b.homing ? 'rgba(255,100,255,0.5)' : 'rgba(255,180,80,0.5)';
    ctx.fillRect(b.x - b.w/2 - 1, b.y - b.h/2 - 4, b.w + 2, 4);
  }
  // Enemy bullets — same additive halo trick, tinted red so threats remain
  // easy to read against the player's warm tracers.
  if (glowOn && Game.enemyBullets.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of Game.enemyBullets) {
      if (b.mortar) continue;
      const r = (b.big ? 14 : 9);
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      g.addColorStop(0, 'rgba(255,120,120,0.55)');
      g.addColorStop(1, 'rgba(255,60,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  for (const b of Game.enemyBullets) {
    if (b.mortar) {
      // mortar shell with telegraph
      if (b.telegraph) {
        const t = clamp(b.telegraph.t, 0, 1);
        const tx = b.telegraph.x;
        const ty = H - 110;
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(Game.t * 22);
        ctx.strokeStyle = 'rgba(255,80,80,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, 30 + t * 14, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(tx, ty, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 1;
      }
      ctx.fillStyle = '#3a1010';
      ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff8a3d';
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
      // smoke trail
      if (Math.random() < 0.7) {
        Game.particles.push({
          x: b.x, y: b.y, vx: rand(-10,10), vy: rand(-10,5),
          life: 0.5, max: 0.5, size: 4, color: 'rgba(120,100,80,0.5)',
        });
      }
      continue;
    }
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
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, pr.size / 2, 0, Math.PI * 2);
    ctx.fill();
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
    // inner ring — trails slightly behind
    if (s.r > 16) {
      ctx.globalAlpha = a * 0.38;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.52, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

function drawSkidMarks() {
  for (const s of Game.skidMarks) {
    const a = clamp(s.life / s.max, 0, 1) * 0.5;
    ctx.fillStyle = `rgba(20,12,6,${a})`;
    ctx.fillRect(s.x - s.w/2, s.y - s.h/2, s.w, s.h);
  }
}

function drawDustDevils() {
  for (const d of Game.dustDevils) {
    const a = clamp(d.life / 4.5, 0, 1) * 0.55;
    ctx.globalAlpha = a;
    const sway = Math.sin(d.t * 5) * 6;
    // tall conical dust
    for (let i = 0; i < 5; i++) {
      const y = d.y - i * 16;
      const r = 10 + i * 4;
      ctx.fillStyle = `rgba(180,140,90,${0.35 - i * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(d.x + sway * (1 - i * 0.15), y, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawShield() {
  const sh = Game.powerups && Game.powerups.shield;
  if (!sh || sh.t <= 0 || !Game.player) return;
  const p = Game.player;
  const flickering = sh.t < 1.2 && Math.floor(sh.t * 12) % 2 === 0;
  if (flickering) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Game.t * 8);
  ctx.strokeStyle = '#7aaaff';
  ctx.lineWidth = 2;
  const r = 38 + Math.sin(Game.t * 6) * 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#7aaaff';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  // hex pattern
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1;
  for (let a = 0; a < 6; a++) {
    const ang = a * Math.PI / 3 + Game.t * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    ctx.lineTo(Math.cos(ang + Math.PI/3) * r, Math.sin(ang + Math.PI/3) * r);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}

function drawComboMeter() {
  if (Game.combo < 2) return;
  const m = comboMult();
  const txt = '×' + m + '   ' + Game.combo + ' KILLS';
  const fs = W < 500 ? 14 : 18;
  // position on the right side, below HUD
  ctx.save();
  ctx.font = `bold ${fs}px "Courier New", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  const x = W - 14;
  const hudH = W < 500 ? 48 : 56;
  const y = hudH + 10;
  // shadow
  ctx.fillStyle = '#1a0f08';
  ctx.fillText(txt, x + 2, y + 2);
  // body
  const c = m >= 5 ? '#ff8a3d' : m >= 3 ? '#ffe07a' : '#f5d76e';
  ctx.fillStyle = c;
  ctx.fillText(txt, x, y);
  // countdown bar under text
  const w = 110, h = 3;
  const pct = Game.comboT / COMBO_WINDOW;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - w, y + fs + 4, w, h);
  ctx.fillStyle = c;
  ctx.fillRect(x - w * pct, y + fs + 4, w * pct, h);
  ctx.restore();
}

function drawPowerupStrip() {
  // small icon strip showing active power-ups, top-left under hudH
  const active = POWERUP_KEYS.filter(k => isPowerupActive(k));
  if (active.length === 0) return;
  const hudH = W < 500 ? 48 : 56;
  const ix = 14, iy = hudH + 6, sz = W < 500 ? 28 : 34, gap = 6;
  ctx.save();
  for (let i = 0; i < active.length; i++) {
    const id = active[i];
    const def = POWERUPS[id];
    const p = Game.powerups[id];
    const x = ix + i * (sz + gap);
    // backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, iy, sz, sz);
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, iy + 0.5, sz - 1, sz - 1);
    // glyph
    ctx.fillStyle = def.color;
    ctx.font = `bold ${sz - 12}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.glyph, x + sz/2, iy + sz/2 - 2);
    // countdown bar
    const pct = clamp(p.t / p.max, 0, 1);
    ctx.fillStyle = def.color;
    ctx.fillRect(x, iy + sz - 3, sz * pct, 3);
    // flashing border when about to expire
    if (p.t < 1.5 && Math.floor(p.t * 6) % 2 === 0) {
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(x - 0.5, iy - 0.5, sz + 1, sz + 1);
    }
  }
  ctx.lineWidth = 1;
  ctx.restore();
}

// Soft elliptical drop shadow under the player vehicle. Pure visual polish —
// no game logic depends on it. We draw a radial gradient so the edge is
// feathered rather than a hard offset rectangle.
function drawPlayerGroundShadow() {
  const p = Game.player;
  if (!p) return;
  if (Settings.particles <= 0.05) return; // respect "no extras" preference
  const w = p.w + 14;
  const h = (p.h + 12) * 0.32;
  const cx = p.x + 4;
  const cy = p.y + p.h / 2 + 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.45); // squashed ellipse via gradient + transform
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0.45)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.6, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Ghost silhouettes of the player chassis stamped at recent positions while
// NITRO is active. Snapshots are pushed in update(); rendered oldest-first
// so the live vehicle paints over them cleanly.
function drawPlayerNitroTrail() {
  const trail = Game.playerTrail;
  if (!trail || trail.length === 0) return;
  if (Settings.particles <= 0.1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < trail.length; i++) {
    const s = trail[i];
    const a = (i + 1) / trail.length; // newest = brightest
    ctx.globalAlpha = a * 0.28;
    // simple cyan-tinted rectangle echoing the chassis footprint — much
    // cheaper than re-drawing the full vehicle each frame and reads as a
    // motion smear instead of a duplicate sprite.
    ctx.fillStyle = 'rgba(122,240,255,0.75)';
    ctx.fillRect(s.x - s.w/2, s.y - s.h/2, s.w, s.h);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Pulsing chromatic vignette that builds with the kill streak. Stays subtle
// at low combos and ramps to a noticeable color halo at the highest tiers,
// reinforcing the score multiplier without obscuring the play field.
function drawComboAura() {
  if (!Game.player || Game.combo < 3) return;
  const m = comboMult();
  // Map multiplier (1..10) into 0..1 intensity; clamp to avoid a fully solid
  // overlay even at legendary streaks.
  const intensity = clamp((m - 1) / 9, 0, 1);
  if (intensity <= 0) return;
  const pulse = 0.85 + 0.15 * Math.sin((Game.t || 0) * 6);
  // Color shifts warmer as the multiplier climbs: gold → orange → red.
  const hue = m >= 7 ? [255, 80, 80]
            : m >= 4 ? [255, 150, 60]
            :          [255, 220, 110];
  const baseA = 0.05 + intensity * 0.18;
  const grad = ctx.createRadialGradient(
    W * 0.5, H * 0.55, Math.min(W, H) * 0.30,
    W * 0.5, H * 0.55, Math.max(W, H) * 0.75
  );
  grad.addColorStop(0, `rgba(${hue[0]},${hue[1]},${hue[2]},0)`);
  grad.addColorStop(1, `rgba(${hue[0]},${hue[1]},${hue[2]},${baseA * pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawNitroOverlay() {
  if (!isPowerupActive('nitro')) return;
  // chromatic edges + speed lines (lines done via particles in update)
  ctx.save();
  ctx.fillStyle = 'rgba(122,240,255,0.06)';
  ctx.fillRect(0, 0, W, H);
  // edge vignette
  const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.35, W/2, H/2, Math.max(W,H) * 0.7);
  grad.addColorStop(0, 'rgba(122,240,255,0)');
  grad.addColorStop(1, 'rgba(122,240,255,0.20)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawHUD() {
  const hudH = W < 500 ? 48 : 56;
  const fs = W < 500 ? 13 : 16;
  ctx.fillStyle = Settings.hudContrast ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, hudH);

  ctx.fillStyle = Settings.hudContrast ? '#fff3b0' : '#f5d76e';
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
  } else if (Game.mode === 'bossrush') {
    subL = `BOSS RUSH`;
  } else if (Game.mode === 'ironthrone') {
    const itDef = IRON_THRONE_STAGES[Math.min(Game.ironThroneStage, IRON_THRONE_STAGES.length) - 1];
    subL = itDef ? itDef.weapon : 'IRON THRONE';
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
    else if (L.obj === 'horde') mainR = 'HORDE ' + Math.max(0, (Game.hordeMode ? Game.hordeMode.dur : L.target) - Game.t).toFixed(1) + 'S';
  } else if (Game.mode === 'bossrush') {
    mainR = `BOSS ${Math.min(Game.bossRushStage, BOSS_RUSH_STAGES.length)}/${BOSS_RUSH_STAGES.length}`;
  } else if (Game.mode === 'ironthrone') {
    const itStage = Math.min(Game.ironThroneStage, IRON_THRONE_STAGES.length);
    mainR = `WARLORD ${itStage}/${IRON_THRONE_STAGES.length}`;
  }
  ctx.fillText(mainR, W - 50, hudH * 0.32);
  ctx.fillStyle = 'rgba(245,215,110,0.7)';
  ctx.font = `bold ${fs - 2}px "Courier New", monospace`;
  ctx.fillText('+' + Math.floor(Game.score / 10) + ' SCRAP', W - 50, hudH * 0.72);

  // hull bar
  const hbW = Math.min(180, W * 0.42), hbH = 10, hbX = (W - hbW) / 2, hbY = hudH * 0.4 - hbH/2;
  // critical health — pulsing red glow behind bar
  const pct = clamp(Game.health / Game.maxHealth, 0, 1);
  if (pct <= 0.25) {
    const glowA = 0.28 + 0.28 * Math.sin(Game.t * 8);
    ctx.fillStyle = `rgba(255,50,50,${glowA})`;
    ctx.fillRect(hbX - 4, hbY - 4, hbW + 8, hbH + 8);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(hbX - 2, hbY - 2, hbW + 4, hbH + 4);
  ctx.fillStyle = '#3a1a0a';
  ctx.fillRect(hbX, hbY, hbW, hbH);
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

  if (Game.runMutators.length || Game.activeEvent || Game.bonusObjective) {
    const label = Game.activeEvent
      ? Game.activeEvent.name
      : Game.bonusObjective
        ? `${Game.bonusObjective.name} ${Game.kills - Game.bonusObjective.startKills}/${Game.bonusObjective.target}`
        : Game.runMutators.map(m => m.name).join(' · ');
    const y = Game.boss && Game.boss.y >= Game.boss.targetY - 5 ? hudH + 34 : hudH + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    const tw = ctx.measureText(label).width + 18;
    ctx.fillRect((W - tw) / 2, y - 10, tw, 18);
    ctx.fillStyle = Game.activeEvent ? '#ffb36a' : Game.bonusObjective ? '#7af07a' : '#8ec5ff';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, W / 2, y);
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

function drawWreck() {
  const w = Game.wreck; if (!w) return;
  const v = Game.vehicle; if (!v) return;
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.rotate(w.rot);
  // darkened body
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#1a0f08';
  ctx.fillRect(-22, -32, 44, 64);
  // charred panels
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(-18, -28, 36, 12);
  ctx.fillRect(-14, -10, 28, 18);
  // glow embers — flicker
  const flicker = 0.6 + Math.sin(w.t * 18) * 0.2;
  ctx.fillStyle = `rgba(255,140,60,${flicker})`;
  ctx.fillRect(-10, -4, 6, 6);
  ctx.fillRect(4, 2, 5, 5);
  ctx.fillStyle = `rgba(255,210,120,${flicker * 0.8})`;
  ctx.fillRect(-2, -6, 4, 4);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPopups() {
  if (!Game.popups.length) return;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const pp of Game.popups) {
    const a = clamp(pp.life / pp.max, 0, 1);
    const scale = 1 + (1 - a) * 0.4;
    ctx.globalAlpha = a;
    ctx.font = `bold ${Math.round(pp.size * scale)}px "Courier New", monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(pp.text, pp.x + 1, pp.y + 1);
    ctx.fillStyle = pp.color;
    ctx.fillText(pp.text, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Public URL appended to Daily Challenge share text. Single point of change
// if the canonical deploy URL ever moves.
const SHARE_BASE_URL = 'https://mojave-run.netlify.app';

// Tips shown during the loading screen — small UX touch that gives the
// loading sequence purpose. New tip per loading screen, pulled by the
// boot session counter so successive runs cycle.
const LOADING_TIPS = [
  'HOLD TO FIRE — THE LONGER YOU SQUEEZE, THE LONGER YOU LIVE',
  'COMBO X10 NEEDS 30 KILLS WITHOUT A SCRATCH',
  'BARRELS EXPLODE — SHOOT THEM NEAR ENEMIES',
  'NIGHT SECTORS HIDE EARLIER THREATS — WATCH THE EDGES',
  'SCRAP DROPS PULL TOWARD YOU UNDER A MAGNET POWER-UP',
  'GOLIATH TRADES SPEED FOR ARMOR. ROADRUNNER DOES THE OPPOSITE.',
  'TAP P TO PAUSE · F FOR FULLSCREEN · Q TO CYCLE QUALITY',
  'BOSSES ENRAGE AT 30% HP — SAVE YOUR NITRO FOR THEN',
  'TAKING DAMAGE BREAKS YOUR COMBO. SHIELDS DO NOT.',
  'PHANTOM HAS 4 GUNS BUT GLASS ARMOR — STAY MOVING',
  'TIME ATTACK FAVORS COMBOS — DON\'T STOP TO CHASE PICKUPS',
  'DAILY CHALLENGE IS THE SAME WORLD FOR EVERYONE EACH DAY',
  'STORM SECTORS HAVE LIGHTNING — IT TARGETS METAL',
  // Zombie mode tips
  'ZOMBIE HORDE: MOW THROUGH RUNNERS BEFORE BRUISERS CLOSE IN',
  'ZOMBIE HORDE: REPAIRS ARE SCARCE — EVERY SCRATCH COUNTS',
  'ZOMBIE HORDE: BRUISERS TAKE 5 HITS — TARGET RUNNERS FIRST',
  'ZOMBIE HORDE: THE HORDE DOUBLES IN DENSITY PAST 10 KILOMETERS',
  'ZOMBIE HORDE: NITRO + CONTACT IS YOUR BEST CROWD CLEAR',
  'ZOMBIE HORDE: RUNNERS CHASE. BRUISERS WAIT. NEVER STOP MOVING.',
  // Hitchhiker tips
  'HITCHHIKERS WANDER INTO YOUR LANE — HIT ONE AND YOU LOSE CONTROL',
  'SPINOUT AHEAD: HITCHHIKERS NEAR THE SHOULDER CAN SEND YOU CRASHING',
];
let _loadingTipIdx = -1;
function pickLoadingTip() {
  // For gauntlet levels, show the sector story intro
  if (Game.mode === 'gauntlet' && Game.levelData && Game.levelData.story) {
    return Game.levelData.story;
  }
  // For zombie mode, prefer zombie-specific tips
  if (Game.mode === 'zombie') {
    const zombieTips = LOADING_TIPS.filter(t => t.startsWith('ZOMBIE'));
    const idx = Math.floor(Math.random() * zombieTips.length);
    return zombieTips[idx] || LOADING_TIPS[0];
  }
  // Uses whichever Math.random is currently active. In Daily mode the
  // seeded RNG is in effect, so the same tip is picked for every player
  // that day — a tiny but deliberate part of the "shared run" feel.
  const nonZombie = LOADING_TIPS.filter(t => !t.startsWith('ZOMBIE'));
  _loadingTipIdx = (_loadingTipIdx + 1 + Math.floor(Math.random() * 2)) % nonZombie.length;
  return nonZombie[_loadingTipIdx];
}

function drawLoadingOverlay() {
  // gentle dim, then big bold info card
  const k = clamp(Game.loadingT / Game.loadingDur, 0, 1);
  const alpha = k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15;
  ctx.save();
  ctx.globalAlpha = alpha;
  // dark band across center
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, H * 0.30, W, H * 0.22);
  ctx.fillStyle = 'rgba(245,215,110,0.5)';
  ctx.fillRect(0, H * 0.30, W, 1);
  ctx.fillRect(0, H * 0.52 - 1, W, 1);

  // big title
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5d76e';
  const titleSize = W < 500 ? 28 : 40;
  ctx.font = `bold ${titleSize}px "Courier New", monospace`;
  let title = 'ROLLING OUT';
  let sub = (Game.vehicle ? Game.vehicle.name : '');
  if (Game.mode === 'gauntlet' && Game.levelData) {
    title = 'SECTOR ' + Game.levelData.num;
    sub = Game.levelData.name + ' · ' + (Game.vehicle ? Game.vehicle.name : '');
  } else if (Game.mode === 'timeattack') {
    title = 'TIME ATTACK';
    sub = '60 SECONDS · ' + (Game.vehicle ? Game.vehicle.name : '');
  } else if (Game.mode === 'classic') {
    title = 'OPEN ROAD';
    sub = 'ENDLESS · ' + (Game.vehicle ? Game.vehicle.name : '');
  } else if (Game.mode === 'zombie') {
    title = 'ZOMBIE HORDE';
    sub = 'THE DEAD ARE COMING · ' + (Game.vehicle ? Game.vehicle.name : '');
  } else if (Game.mode === 'bossrush') {
    title = 'BOSS RUSH';
    sub = `CHAIN ${Game.bossRushStage}/${BOSS_RUSH_STAGES.length} · ` + (Game.vehicle ? Game.vehicle.name : '');
  } else if (Game.mode === 'daily') {
    title = 'DAILY CHALLENGE';
    sub = (Game.dailySeedKey || '') + ' · ' + (Game.vehicle ? Game.vehicle.name : '');
  }
  // typewriter wipe
  const reveal = clamp(k * 1.6, 0, 1);
  const chars = Math.ceil(title.length * reveal);
  ctx.fillText(title.slice(0, chars), W/2, H * 0.38);

  // subtitle
  ctx.font = `bold ${W < 500 ? 11 : 13}px "Courier New", monospace`;
  ctx.fillStyle = 'rgba(245,215,110,0.85)';
  ctx.fillText(sub, W/2, H * 0.46);

  // progress bar
  const barW = Math.min(280, W * 0.6), barH = 6;
  const bx = (W - barW) / 2, by = H * 0.50;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
  ctx.fillStyle = 'rgba(245,215,110,0.25)';
  ctx.fillRect(bx, by, barW, barH);
  ctx.fillStyle = '#f5d76e';
  ctx.fillRect(bx, by, barW * k, barH);

  // boss-level warning beneath
  if (Game.levelData && Game.levelData.obj === 'boss') {
    const def = BOSS_DEFS[Game.levelData.boss];
    const pulse = 0.6 + Math.sin(Game.animT * 8) * 0.4;
    ctx.globalAlpha = alpha * pulse;
    ctx.font = `bold ${W < 500 ? 13 : 16}px "Courier New", monospace`;
    ctx.fillStyle = '#ff5050';
    ctx.fillText('▲ BOSS: ' + (def ? def.name : 'UNKNOWN') + ' ▲', W/2, H * 0.58);
  } else if (Game.levelData && Game.levelData.obj === 'horde') {
    const pulse = 0.6 + Math.sin(Game.animT * 8) * 0.4;
    ctx.globalAlpha = alpha * pulse;
    ctx.font = `bold ${W < 500 ? 13 : 16}px "Courier New", monospace`;
    ctx.fillStyle = '#ffd86b';
    ctx.fillText('▲ BOSS HORDE — SIEGE MODE ▲', W/2, H * 0.58);
  } else if (Game.loadingTip) {
    // Tip-of-the-run rotator. Fades in slightly after the title so the
    // hierarchy reads as TITLE -> SUB -> PROGRESS -> TIP.
    const tipAlpha = alpha * clamp((k - 0.15) * 2.5, 0, 1) * 0.85;
    ctx.globalAlpha = tipAlpha;
    ctx.font = `bold ${W < 500 ? 10 : 12}px "Courier New", monospace`;
    ctx.fillStyle = 'rgba(245,215,110,0.85)';
    // word-wrap into max ~38 chars
    const tip = Game.loadingTip;
    if (tip.length > 38) {
      const mid = tip.lastIndexOf(' ', 38);
      const a = tip.slice(0, mid > 0 ? mid : 38);
      const b = tip.slice((mid > 0 ? mid : 38) + 1);
      ctx.fillText(a, W/2, H * 0.585);
      ctx.fillText(b, W/2, H * 0.61);
    } else {
      ctx.fillText(tip, W/2, H * 0.59);
    }
  }
  ctx.restore();
}

function drawBossWarning() {
  if (Game.bossWarning <= 0 || !Game.boss) return;
  const t = Game.bossWarning;
  const pulse = 0.5 + Math.sin(Game.animT * 14) * 0.5;
  // red flash bands
  ctx.save();
  ctx.globalAlpha = 0.15 + pulse * 0.15;
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(0, H * 0.35, W, 4);
  ctx.fillRect(0, H * 0.55, W, 4);
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, H * 0.39, W, H * 0.16);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff5050';
  ctx.font = `bold ${W < 500 ? 22 : 30}px "Courier New", monospace`;
  ctx.fillText('▲ WARNING ▲', W/2, H * 0.44);
  ctx.font = `bold ${W < 500 ? 14 : 18}px "Courier New", monospace`;
  ctx.fillStyle = '#fff3b0';
  ctx.fillText('BOSS APPROACHING', W/2, H * 0.50);
  ctx.restore();
}

function drawVictoryOverlay() {
  if (!Game.victorySeq) return;
  const seq = Game.victorySeq;
  const k = clamp(seq.t / seq.dur, 0, 1);
  // fade-in/out
  const a = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
  ctx.save();
  ctx.globalAlpha = a * 0.5;
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = a;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // bouncing letters
  const bounce = Math.sin(seq.t * 8) * 0.06 + 1;
  const titleSize = (W < 500 ? 38 : 56) * bounce;
  ctx.font = `bold ${titleSize}px "Courier New", monospace`;
  ctx.fillStyle = '#1a0f08';
  ctx.fillText('LEVEL CLEAR', W/2 + 3, H * 0.42 + 3);
  ctx.fillStyle = '#7af07a';
  ctx.fillText('LEVEL CLEAR', W/2, H * 0.42);
  // sub
  ctx.font = `bold ${W < 500 ? 13 : 16}px "Courier New", monospace`;
  ctx.fillStyle = '#1a0f08';
  ctx.fillText(seq.kind === 'boss' ? 'BOSS DOWN' : 'OBJECTIVE COMPLETE', W/2 + 1, H * 0.50 + 1);
  ctx.fillStyle = '#f5d76e';
  ctx.fillText(seq.kind === 'boss' ? 'BOSS DOWN' : 'OBJECTIVE COMPLETE', W/2, H * 0.50);
  ctx.restore();
}

function drawDeathOverlay() {
  if (!Game.deathSeq) return;
  const ds = Game.deathSeq;
  const k = clamp(ds.t / ds.dur, 0, 1);
  // red wash that fades in then out
  const wash = k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7;
  ctx.save();
  ctx.globalAlpha = wash * 0.45;
  ctx.fillStyle = '#3a0808';
  ctx.fillRect(0, 0, W, H);
  // RUN OVER text fades in toward the end
  if (k > 0.5) {
    const ta = (k - 0.5) / 0.5;
    ctx.globalAlpha = ta;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const sz = W < 500 ? 36 : 52;
    ctx.font = `bold ${sz}px "Courier New", monospace`;
    ctx.fillStyle = '#1a0f08';
    ctx.fillText('WRECKED', W/2 + 3, H * 0.45 + 3);
    ctx.fillStyle = '#ff5050';
    ctx.fillText('WRECKED', W/2, H * 0.45);
  }
  ctx.restore();
}

function render() {
  if (Game.state === 'playing' || Game.state === 'gameover' || Game.state === 'victory'
      || Game.state === 'loading' || Game.state === 'dying') {
    ctx.save();
    if (Game.shake > 0 && !Game.paused) {
      // Smoothed shake: interpolate offsets toward a randomly-picked target so
      // the camera oscillates instead of strobing one pixel per frame. We
      // re-pick a target every ~50ms (timer driven by Game.t) and lerp in
      // render() using a frame-rate independent factor.
      const amp = Game.shake * 14 * Settings.shake;
      const nowT = Game.t || 0;
      if (nowT >= Game.shakeRetargetT) {
        Game.shakeTX = (Math.random() - 0.5) * 2;
        Game.shakeTY = (Math.random() - 0.5) * 2;
        Game.shakeRetargetT = nowT + 0.05;
      }
      // Exponential approach (~70% of remaining gap per ~16ms frame); cheap
      // and stable across variable frame times.
      const k = 0.35;
      Game.shakeOX += (Game.shakeTX - Game.shakeOX) * k;
      Game.shakeOY += (Game.shakeTY - Game.shakeOY) * k;
      ctx.translate(Game.shakeOX * amp, Game.shakeOY * amp);
    } else {
      // Decay the smoothed offsets so the camera glides back to center after
      // the shake source ends, instead of snapping.
      Game.shakeOX *= 0.7; Game.shakeOY *= 0.7;
    }
    drawBackground();
    drawRoad();
    drawSkidMarks();
    drawDecor();
    drawDustDevils();

    for (const o of Game.obstacles) drawObstacle(o);
    // Threat indicator: a soft red halo under every enemy makes them visually
    // distinct from civilians/innocents (which have a yellow warning halo)
    // and from inert wreck/barrel obstacles. Drawn before the enemy sprite so
    // it sits as a ground-level glow.
    drawEnemyThreatHalos();
    for (const e of Game.enemies) drawEnemy(e);
    for (const pk of Game.pickups) drawPickup(pk);
    if (Game.boss) drawBoss();
    drawBullets();
    // player vehicle (none during dying — wreck takes its place)
    if (Game.state === 'dying') {
      drawWreck();
    } else if (Game.player && Game.state !== 'gameover') {
      if (Game.state === 'playing' && Math.random() < 0.22) {
        emitExhaustTrail(Game.player.x - 10, Game.player.y + Game.player.h/2 - 4, 1);
        emitExhaustTrail(Game.player.x + 10, Game.player.y + Game.player.h/2 - 4, 1);
      }
      // Soft elliptical ground shadow — replaces the harsh square shadow that
      // used to sit behind the chassis. Quality-gated via Settings.particles
      // so very-low quality skips the extra fill.
      drawPlayerGroundShadow();
      // NITRO afterimage trail: faint vehicle silhouettes at recent player
      // positions, oldest = most transparent. Captured in update() and only
      // drawn while at least one entry exists.
      drawPlayerNitroTrail();
      // hit flash overlay on the vehicle: tint white briefly
      drawVehicle(Game.player.x, Game.player.y, Game.vehicle, Game.player.vx, 42, 64,
        Game.spinout ? { forcedRot: Game.spinout.rot } : {});
      if (Game.hitFlash > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(Game.hitFlash / 0.35, 0, 1) * 0.55;
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(Game.player.x - Game.player.w/2 - 2, Game.player.y - Game.player.h/2 - 2,
                     Game.player.w + 4, Game.player.h + 4);
        ctx.restore();
      }
      drawShield();
      // muzzle flash glow on barrel
      if (Game.muzzleT > 0) {
        const a = clamp(Game.muzzleT / 0.08, 0, 1);
        ctx.save();
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = (Game.vehicle && Game.vehicle.color && Game.vehicle.color.glow) || '#fff3b0';
        ctx.beginPath();
        ctx.arc(Game.player.x, Game.player.y - Game.player.h/2 - 6, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    drawParticles();
    drawShockwaves();
    drawPopups();
    drawWeather();
    drawNitroOverlay();
    // Combo aura — pulsing chromatic vignette when the kill streak is hot.
    // Drawn after weather/nitro so it composites on top of the world but
    // still sits below the HUD layer.
    drawComboAura();

    if (Game.flash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${Game.flash * 0.4})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // vignette (cached gradient — rebuilt on resize)
    ctx.fillStyle = VIGNETTE_PLAY;
    ctx.fillRect(0, 0, W, H);

    if (Game.state === 'playing') {
      drawHUD();
      drawPowerupStrip();
      drawComboMeter();
    }
    if (Game.state === 'playing' && Game.paused) drawPause();
    if (Game.state === 'loading') drawLoadingOverlay();
    if (Game.state === 'playing' && Game.bossWarning > 0) drawBossWarning();
    if (Game.state === 'victory') drawVictoryOverlay();
    if (Game.state === 'dying')   drawDeathOverlay();
  } else {
    // menu — animated wasteland backdrop
    drawIdleBackground();
    ctx.fillStyle = VIGNETTE_MENU;
    ctx.fillRect(0, 0, W, H);
  }
}

// ============================================================
// VEHICLE PREVIEW (used in garage/upgrade)
// ============================================================
function renderVehiclePreview(canvas, vehicleId, cosmetics = null) {
  const v = VEHICLE_BY_ID[vehicleId];
  const c = canvas.getContext('2d');
  const cw = canvas.width = 80;
  const ch = canvas.height = 90;
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, cw, ch);
  // dummy ctx swap — do simplified inline draw
  const cx = cw/2, cy = ch/2;
  const w = 38, h = 60;
  const col = getVehiclePaint(v, cosmetics && cosmetics.equippedPaint);

  // ---- Cemetery Tank preview ----
  if (v.shape === 'tank') {
    const tw = w + 10, th = h;
    // shadow
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(cx - tw/2 + 4, cy - th/2 + 7, tw + 2, th);
    // tracks
    c.fillStyle = '#0a0a06';
    c.fillRect(cx - tw/2 - 6, cy - th/2, 11, th);
    c.fillRect(cx + tw/2 - 5, cy - th/2, 11, th);
    // track links
    c.fillStyle = '#1c1c10';
    for (let i = 0; i < 7; i++) {
      const ty = cy - th/2 + 2 + i * (th / 7);
      c.fillRect(cx - tw/2 - 6, ty, 11, 2);
      c.fillRect(cx + tw/2 - 5, ty, 11, 2);
    }
    // hull body
    c.fillStyle = col.body;
    c.fillRect(cx - tw/2, cy - th/2, tw, th);
    // front/rear armor
    c.fillStyle = col.hood;
    c.fillRect(cx - tw/2, cy - th/2, tw, 9);
    c.fillRect(cx - tw/2, cy + th/2 - 7, tw, 7);
    // turret base
    c.fillStyle = col.cab;
    c.fillRect(cx - tw/4, cy - th/4, tw/2, th/2.4);
    // turret top
    c.fillStyle = '#23231a';
    c.fillRect(cx - tw/4 + 2, cy - th/4, tw/2 - 4, th/5);
    // skull (simplified)
    c.fillStyle = col.glow;
    c.globalAlpha = 0.75;
    c.fillRect(cx - 6, cy - th/4 + 2, 12, 8);
    c.globalAlpha = 1;
    c.fillStyle = col.cab;
    c.fillRect(cx - 5, cy - th/4 + 4, 3, 3);
    c.fillRect(cx + 2, cy - th/4 + 4, 3, 3);
    // cannon
    c.fillStyle = '#0a0a06';
    c.fillRect(cx - 3, cy + th/4 - 4, 6, 18);
    c.fillRect(cx - 5, cy + th/4 + 13, 10, 4);
    // headlights
    c.fillStyle = col.glow;
    c.fillRect(cx - tw/2 + 2, cy - th/2 - 4, 7, 3);
    c.fillRect(cx + tw/2 - 9, cy - th/2 - 4, 7, 3);
    return;
  }

  if (cosmetics && cosmetics.equippedTrail) {
    const trail = getTrailDef(cosmetics.equippedTrail);
    const colors = trail.colors || ['rgba(120,90,60,0.5)'];
    for (let i = 0; i < 7; i++) {
      c.fillStyle = colors[i % colors.length];
      c.globalAlpha = 0.25 + (i / 7) * 0.35;
      c.beginPath();
      c.arc(cx + (i % 2 ? 9 : -9), cy + h/2 + 5 + i * 4, Math.max(2, (trail.size || 5) - i * 0.35), 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }
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
// GLOBAL SCOREBOARD — submit and fetch top scores via the relay server.
// Gracefully no-ops when running on static hosting without an API server.
// ============================================================
function submitGlobalScore() {
  const score = Math.floor(Game.score);
  if (score <= 0) return;
  const profile = Profile.active();
  const name = profile ? profile.name : 'DRIVER';
  const vehicle = Game.vehicle ? Game.vehicle.id : 'rustbucket';
  const payload = {
    name,
    score,
    mode: Game.mode || 'classic',
    kills: Math.floor(Game.kills),
    distance: Math.floor(Game.distance),
    vehicle,
  };
  try {
    fetch((window.RENDER_API || '') + '/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {}); // silently ignore network failures on static hosts
  } catch (_) {}
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
      const ch = CHARACTER_BY_ID[p.characterId] || CHARACTER_BY_ID[DEFAULT_CHARACTER_ID];
      card.innerHTML = `
        <div class="pc-left">
          <div class="portrait pc-portrait">${characterPortraitSVG(ch.id)}<div class="pframe"></div></div>
          <div>
            <div class="pname">${escapeHtml(p.name)}</div>
            <div class="pmeta">${escapeHtml(ch.title)}</div>
            <div class="pmeta">SCRAP ${p.scrap} · RUNS ${p.runs} · BEST ${p.bestClassic}</div>
          </div>
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
    const ch = Profile.character();
    document.getElementById('menu-name').textContent = p.name;
    document.getElementById('menu-ctitle').textContent = ch ? ch.title : '';
    document.getElementById('menu-portrait').innerHTML = characterPortraitSVG(ch ? ch.id : DEFAULT_CHARACTER_ID) + '<div class="pframe"></div>';
    document.getElementById('menu-runs').textContent = `RUNS ${p.runs} · BEST ${p.bestClassic}`;
    document.getElementById('menu-scrap').textContent = p.scrap;
    document.getElementById('menu-character-sub').textContent = (ch ? ch.name : '') + ' ◢';
    const v = VEHICLE_BY_ID[p.activeVehicle];
    document.getElementById('menu-garage-sub').textContent = (v ? v.name : '') + ' ◢';
    const _sk = p.activeSidekick ? SIDEKICK_BY_ID[p.activeSidekick] : null;
    const _skSub = document.getElementById('menu-sidekick-sub');
    if (_skSub) _skSub.textContent = _sk ? _sk.name + ' ◢' : 'NONE ◢';
    const _achSub = document.getElementById('menu-ach-sub');
    if (_achSub) {
      const earned = (p.achievements || []).length;
      _achSub.textContent = earned + ' / ' + ACHIEVEMENTS.length + ' ◢';
    }
    this.show('menu');
  },

  // ---- CHARACTER SELECT ----
  // mode: 'new'    — choosing for a brand-new profile (then prompts for callsign)
  //       'change' — changing the active profile's character
  showCharacters(mode) {
    this._charMode = mode || 'change';
    const active = Profile.active();
    const startId = (this._charMode === 'change' && active && active.characterId)
      ? active.characterId
      : DEFAULT_CHARACTER_ID;
    this._pendingChar = startId;
    document.getElementById('char-sub').textContent = (this._charMode === 'new')
      ? 'CHOOSE YOUR BADLANDS LEGEND' : 'SWITCH WARRIORS';
    document.getElementById('char-confirm-btn').textContent = (this._charMode === 'new')
      ? 'CHOOSE WARRIOR ▶' : 'CONFIRM ▶';
    this._renderCharacterList();
    this.show('character');
  },
  _renderCharacterList() {
    const list = document.getElementById('char-list');
    list.innerHTML = '';
    CHARACTERS.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'char-card' + (ch.id === this._pendingChar ? ' selected' : '');
      card.dataset.cid = ch.id;
      card.innerHTML = `
        <div class="portrait lg">${characterPortraitSVG(ch.id)}<div class="pframe"></div></div>
        <div class="cmeta">
          <div class="cname">${escapeHtml(ch.name)}</div>
          <div class="ctitle">${escapeHtml(ch.title)}</div>
          <div class="cbio">${escapeHtml(ch.bio)}</div>
          <div class="cperk">★ ${escapeHtml(ch.perk)}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        SFX.click();
        UI._pendingChar = ch.id;
        UI._renderCharacterList();
      });
      list.appendChild(card);
    });
  },

  // ---- GARAGE ----
  showGarage(tab) {
    const p = Profile.active(); if (!p) return;
    normalizeCosmetics(p);
    if (tab) this._garageTab = tab;
    if (!this._garageTab) this._garageTab = 'vehicles';
    document.getElementById('garage-scrap').textContent = p.scrap;
    document.querySelectorAll('[data-garage-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.garageTab === this._garageTab);
    });
    const list = document.getElementById('vehicle-list');
    const cosmeticList = document.getElementById('cosmetic-list');
    list.style.display = this._garageTab === 'vehicles' ? 'flex' : 'none';
    cosmeticList.style.display = this._garageTab === 'vehicles' ? 'none' : 'flex';
    if (this._garageTab !== 'vehicles') {
      this.showCosmeticTab(this._garageTab);
      this.show('garage');
      return;
    }
    list.innerHTML = '';
    cosmeticList.innerHTML = '';
    // Compute stat-bar scale maxes from all vehicle base stats so bars stay proportional
    const statMax = VEHICLES.reduce((m, vv) => ({
      maxV:     Math.max(m.maxV,     vv.base.maxV),
      accel:    Math.max(m.accel,    vv.base.accel),
      maxHp:    Math.max(m.maxHp,    vv.base.maxHp),
      fireRate: Math.min(m.fireRate, vv.base.fireRate),
      dmgGuns:  Math.max(m.dmgGuns,  vv.base.dmg * vv.base.guns),
    }), { maxV: 1, accel: 1, maxHp: 1, fireRate: 1, dmgGuns: 1 });
    VEHICLES.forEach(v => {
      const owned = !!p.ownedVehicles[v.id];
      const selected = p.activeVehicle === v.id;
      const stats = owned ? Profile.effectiveStats(v.id) : v.base;
      const tile = document.createElement('div');
      tile.className = 'vehicle-tile' + (selected ? ' selected' : '') + (!owned ? ' locked' : '') + (v.master ? ' master-vehicle' : '');

      // stat values normalized for bar display
      const norm = (val, max) => clamp(val / max, 0, 1) * 100;
      const speedN = norm(stats.maxV, statMax.maxV);
      const accelN = norm(stats.accel, statMax.accel);
      const armorN = norm(stats.maxHp, statMax.maxHp);
      const fireN  = norm(1 / stats.fireRate, 1 / statMax.fireRate);
      const dmgN   = norm(stats.dmg * stats.guns, statMax.dmgGuns);

      const masteryLocked = !!v.masteryUnlock && !owned;
      const costLabel = owned
        ? (selected ? 'EQUIPPED' : 'OWNED')
        : (v.masteryUnlock ? '👑 FULL MASTERY UNLOCK' : 'COST <b>' + v.cost + '</b> SCRAP');
      const buyBtn = owned
        ? (selected
            ? '<button class="btn primary" data-vact="upgrade" data-vid="'+v.id+'">UPGRADE ▲</button>'
            : '<div class="btn-row"><button class="btn" data-vact="select" data-vid="'+v.id+'">EQUIP</button><button class="btn" data-vact="upgrade" data-vid="'+v.id+'">UPGRADE</button></div>')
        : (v.masteryUnlock
            ? '<button class="btn primary" disabled>LOCKED — ACHIEVE FULL MASTERY</button>'
            : '<button class="btn primary" data-vact="buy" data-vid="'+v.id+'" '+(p.scrap < v.cost ? 'disabled' : '')+'>UNLOCK · '+v.cost+' SCRAP</button>');

      tile.innerHTML = `
        <div class="vt-head">
          <div>
            <div class="vt-name">${v.name}${selected ? ' ◀' : ''}${v.master ? ' <span class="master-badge">MASTER</span>' : ''}</div>
            <div class="vt-cost">${costLabel}</div>
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
        ${buyBtn}
      `;
      list.appendChild(tile);
      // render preview
      const previewCosmetics = selected ? p.cosmetics : null;
      renderVehiclePreview(tile.querySelector('canvas'), v.id, previewCosmetics);
    });
    this.show('garage');
  },

  showCosmeticTab(cat) {
    const p = Profile.active(); if (!p) return;
    normalizeCosmetics(p);
    const list = document.getElementById('cosmetic-list');
    list.innerHTML = '';
    const equippedKeyMap = { paint: 'equippedPaint', trail: 'equippedTrail', horn: 'equippedHorn' };
    const equippedKey = equippedKeyMap[cat];
    (COSMETICS[cat] || []).forEach(c => {
      const owned = p.cosmetics.owned.includes(c.id);
      const equipped = p.cosmetics[equippedKey] === c.id;
      const unlockedByCondition = isCosmeticConditionMet(c, p);
      const canBuy = !owned && unlockedByCondition && p.scrap >= (c.cost || 0);
      const card = document.createElement('div');
      card.className = 'cosmetic-card' + (equipped ? ' equipped' : '') + (!owned && !unlockedByCondition ? ' locked' : '');
      const state = equipped ? 'EQUIPPED' : owned ? 'OWNED' : cosmeticUnlockText(c);
      const buttonLabel = cosmeticBuyLabel(c, unlockedByCondition);
      const action = owned
        ? `<button class="btn${equipped ? ' primary' : ''}" data-cact="equip" data-cid="${c.id}" ${equipped ? 'disabled' : ''}>${equipped ? 'EQUIPPED' : 'EQUIP'}</button>`
        : `<button class="btn primary" data-cact="buy" data-cid="${c.id}" ${canBuy ? '' : 'disabled'}>${buttonLabel}</button>`;
      card.innerHTML = `
        <div class="cosmetic-head">
          <div>
            <div class="cosmetic-name">${escapeHtml(c.name)}</div>
            <div class="cosmetic-desc">${escapeHtml(COSMETIC_LABELS[cat])}</div>
          </div>
          <div class="cosmetic-state">${escapeHtml(state)}</div>
        </div>
        <div class="cosmetic-swatch"><span style="background:${cosmeticSwatchStyle(c)}"></span></div>
        <div class="cosmetic-desc">${escapeHtml(c.desc)}</div>
        ${action}
      `;
      list.appendChild(card);
    });
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
    const totalTiers = totalUpgradeTiers(p.vehicleUpgrades[vehicleId] || {});
    const branches = getVehicleBranches(vehicleId);
    if (branches.length) {
      const wrap = document.createElement('div');
      wrap.className = 'up-row';
      const unlocked = totalTiers >= (branches[0].unlockTotal || 8);
      const currentBranch = p.vehicleBranches && p.vehicleBranches[vehicleId];
      wrap.innerHTML = `
        <div class="up-head">
          <div class="up-name">SPECIALIZATION</div>
          <div class="up-tier">${unlocked ? 'UNLOCKED' : `${totalTiers}/${branches[0].unlockTotal || 8} TIERS`}</div>
        </div>
        <div class="up-desc">${unlocked ? 'Choose a permanent branch for this vehicle.' : 'Reach 8 total upgrade tiers to unlock branching builds.'}</div>
      `;
      branches.forEach(branch => {
        const btn = document.createElement('button');
        btn.className = 'btn' + (currentBranch === branch.id ? ' primary' : '');
        btn.setAttribute('data-bact', 'branch');
        btn.setAttribute('data-bid', branch.id);
        btn.disabled = !unlocked;
        btn.innerHTML = `${branch.name}<span class="sub">${branch.desc}</span>`;
        wrap.appendChild(btn);
      });
      list.appendChild(wrap);
    }
    this.show('upgrade');
  },

  // ---- MODE SELECT ----
  showMode() {
    const p = Profile.active(); if (!p) return;
    const v = VEHICLE_BY_ID[p.activeVehicle];
    const zombieUnlocked = Profile.isZombieModeUnlocked();
    const masteryUnlocked = Profile.isFullMasteryUnlocked();
    const campaignCleared = Profile.campaignLevelsCleared();
    document.getElementById('mode-vehicle').textContent = v.name;
    const list = document.getElementById('mode-list');
    list.innerHTML = '';
    // Banked power-up badge
    if (p.bankedPowerup && POWERUPS[p.bankedPowerup]) {
      const bdef = POWERUPS[p.bankedPowerup];
      const badge = document.createElement('div');
      badge.style.cssText = `text-align:center;padding:7px 10px;border:1px solid ${bdef.color};border-radius:4px;color:${bdef.color};font-size:13px;margin-bottom:6px;background:rgba(0,0,0,0.4)`;
      badge.innerHTML = `${bdef.glyph} <b>BANKED: ${escapeHtml(bdef.name)}</b> — ACTIVATES AT RUN START`;
      list.appendChild(badge);
    }
    MODES.forEach(m => {
      const tile = document.createElement('button');
      const zombieLocked = m.id === 'zombie' && !zombieUnlocked;
      const ironThroneLocked = m.id === 'ironthrone' && !masteryUnlocked;
      const isLocked = zombieLocked || ironThroneLocked;
      let desc = m.desc;
      let lockLine = '';
      if (zombieLocked) {
        desc = `${m.desc} Unlocks at campaign midpoint.`;
        lockLine = `<div class="mt-lock">🔒 ${campaignCleared} / ${ZOMBIE_UNLOCK_CAMPAIGN_LEVELS} CAMPAIGN LEVELS CLEARED</div>`;
      } else if (ironThroneLocked) {
        lockLine = `<div class="mt-lock">👑 REQUIRES FULL MASTERY — CLEAR ALL CAMPAIGN + ALL GAUNTLET</div>`;
      }
      tile.className = 'mode-tile' + (isLocked ? ' locked' : '');
      tile.dataset.mid = m.id;
      tile.innerHTML = `
        <div class="mt-name">${m.name}</div>
        <div class="mt-desc">${desc}</div>
        ${lockLine}
      `;
      list.appendChild(tile);
    });
    this.show('mode');
  },

  // ---- GAUNTLET ----
  showGauntlet() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('gauntlet-progress').textContent = `${p.gauntletCleared.length} / ${GAUNTLET_SECTORS.length}`;
    const grid = document.getElementById('gauntlet-grid');
    grid.innerHTML = '';
    LEVELS.forEach(L => {
      const cleared = p.gauntletCleared.includes(L.num);
      const unlocked = Profile.isLevelUnlocked(L.num);
      const isBoss = L.obj === 'boss' || L.obj === 'horde';
      const tile = document.createElement('button');
      tile.className = 'level-tile' + (cleared ? ' cleared' : '') + (!unlocked ? ' locked' : '') + (isBoss ? ' boss' : '');
      let objLabel = '';
      if (L.obj === 'survive') objLabel = L.target + 'S';
      else if (L.obj === 'kills') objLabel = L.target + ' KILLS';
      else if (L.obj === 'distance') objLabel = (L.target/1000).toFixed(1) + 'KM';
      else if (L.obj === 'boss') objLabel = 'BOSS';
      else if (L.obj === 'horde') objLabel = 'HORDE ' + L.target + 'S';
      const mapLabel = (L.map || 'wastes').toUpperCase();
      tile.innerHTML = `
        <div class="ln">${L.num}</div>
        <div class="lname">${L.name}</div>
        <div class="lobj">${objLabel} - ${mapLabel}</div>
        ${cleared ? '<div class="lcheck">✓</div>' : ''}
        ${isBoss && !cleared ? '<div class="star">★</div>' : ''}
      `;
      tile.dataset.level = L.num;
      grid.appendChild(tile);
    });
    this.show('gauntlet');
  },

  // ---- IRON THRONE ----
  showIronThrone() {
    const p = Profile.active(); if (!p) return;
    const ironThroneCleared = p.ironThroneCleared || [];
    document.getElementById('ironthrone-progress').textContent = `${ironThroneCleared.length} / ${IRON_THRONE_STAGES.length}`;
    const grid = document.getElementById('ironthrone-grid');
    grid.innerHTML = '';
    IRON_THRONE_STAGES.forEach(stage => {
      const cleared = ironThroneCleared.includes(stage.num);
      const unlocked = Profile.isIronThroneStageUnlocked(stage.num);
      const tile = document.createElement('button');
      tile.className = 'level-tile boss' + (cleared ? ' cleared' : '') + (!unlocked ? ' locked' : '');
      tile.innerHTML = `
        <div class="ln">${stage.num}</div>
        <div class="lname">${stage.name}</div>
        <div class="lobj">${stage.weapon}</div>
        ${cleared ? '<div class="lcheck">✓</div>' : ''}
        ${!cleared ? '<div class="star">☠</div>' : ''}
      `;
      tile.dataset.itstage = stage.num;
      grid.appendChild(tile);
    });
    this.show('ironthrone');
  },

  // ---- STATS ----
  showStats() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('stats-name').textContent = p.name;
    const list = document.getElementById('stats-list');
    const created = new Date(p.created).toLocaleDateString();
    const ownedCount = Object.keys(p.ownedVehicles).length;
    const ttlUpgrades = Object.values(p.vehicleUpgrades).reduce(
      (s, ups) => s + (ups.engine||0) + (ups.plating||0) + (ups.weapons||0) + (ups.reactor||0), 0);
    const rows = [
      ['CREATED', created],
      ['SCRAP CURRENT', p.scrap],
      ['SCRAP LIFETIME', p.lifetimeScrap],
      ['RUNS', p.runs],
      ['BEST CLASSIC', p.bestClassic],
      ['BEST TIME ATK', p.bestTime],
      ['BEST BOSS RUSH', p.bestBossRush || 0],
      ['BEST HORDE', p.bestZombie || 0],
      ['BEST IRON THRONE', p.bestIronThrone || 0],
      ['IRON THRONE', (p.ironThroneCleared || []).length + ' / ' + IRON_THRONE_STAGES.length],
      ['LONGEST RUN', p.bestDistance + ' M'],
      ['BEST KILL RUN', p.bestKills || 0],
      ['BEST COMBO', (p.bestCombo || 0) + KILL_STREAK_LABEL],
      ['BEST SCRAP RUN', p.bestScrapRun || 0],
      ['INNOCENTS HIT', p.totalCivilianHits || 0],
      ['CLEAN RUNS', p.cleanRuns || 0],
      ['VEHICLES OWNED', ownedCount + ' / ' + VEHICLES.length],
      ['UPGRADES BUILT', ttlUpgrades],
      ['GAUNTLET', p.gauntletCleared.length + ' / ' + GAUNTLET_SECTORS.length],
      ['CAMPAIGN', (() => {
        const c = Object.values(p.campaignCleared || {}).reduce((s, v) => s + ((v.levelsCleared || []).length), 0);
        const total = CAMPAIGN_LOCATIONS.reduce((s, l) => s + l.levels.length, 0);
        return c + ' / ' + total + ' LEVELS';
      })()],
    ];
    list.innerHTML = rows.map(([l, v]) =>
      `<div class="res-row"><div class="lbl">${l}</div><div class="val">${v}</div></div>`
    ).join('');
    this.show('stats');
  },

  // ---- ACHIEVEMENTS ----
  showAchievements() {
    const p = Profile.active(); if (!p) return;
    const earned = new Set(p.achievements || []);
    const earnedCount = earned.size;
    document.getElementById('ach-progress').textContent = earnedCount + ' / ' + ACHIEVEMENTS.length + ' BADGES';
    const list = document.getElementById('ach-list');
    list.innerHTML = '';
    // earned first, then locked
    const sorted = ACHIEVEMENTS.slice().sort((a, b) => {
      const aEarned = earned.has(a.id) ? 0 : 1;
      const bEarned = earned.has(b.id) ? 0 : 1;
      return aEarned - bEarned;
    });
    sorted.forEach(a => {
      const done = earned.has(a.id);
      const hiddenLocked = !!a.hidden && !done;
      const card = document.createElement('div');
      card.className = 'ach-card' + (done ? ' earned' : '');
      const icon = hiddenLocked ? '?' : a.icon;
      const name = hiddenLocked ? 'CLASSIFIED' : a.name;
      const desc = hiddenLocked ? (a.hint || 'Keep driving. The Mojave gets weird.') : a.desc;
      card.innerHTML = `<div class="ach-icon">${icon}</div><div class="ach-body"><div class="ach-name">${escapeHtml(name)}</div><div class="ach-desc">${escapeHtml(desc)}</div></div>${done ? '<div class="ach-check">\u2713</div>' : ''}`;
      list.appendChild(card);
    });
    this.show('achievements');
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
    } else if (Game.mode === 'zombie') {
      rows.push(['DISTANCE', Math.floor(Game.distance) + ' M', false]);
      rows.push(['KILLS', Game.kills, false]);
      rows.push(['BEST HORDE', p.bestZombie || 0, false]);
    } else if (Game.mode === 'timeattack') {
      rows.push(['BEST', p.bestTime, false]);
    } else if (Game.mode === 'bossrush') {
      rows.push(['BOSSES', Math.min(Game.bossRushStage, BOSS_RUSH_STAGES.length) + ' / ' + BOSS_RUSH_STAGES.length, false]);
      rows.push(['BEST', p.bestBossRush || 0, false]);
    } else if (Game.mode === 'ironthrone') {
      const clearedStage = ironThroneStagesCleared();
      rows.push(['WARLORDS', clearedStage + ' / ' + IRON_THRONE_STAGES.length, false]);
      rows.push(['BEST', p.bestIronThrone || 0, false]);
    } else if (Game.mode === 'daily' && Game.dailySeedKey) {
      const best = (p.dailyBest && p.dailyBest[Game.dailySeedKey]) || Math.floor(Game.score);
      rows.push(['DAILY', Game.dailySeedKey, false]);
      rows.push(['BEST TODAY', best, false]);
    } else if (Game.mode === 'gauntlet' && Game.levelData) {
      rows.push(['LEVEL', Game.levelData.num + ' · ' + Game.levelData.name, false]);
    } else if (Game.mode === 'campaign' && Game.campaignLevelId) {
      const _ce = CAMPAIGN_LEVEL_MAP[Game.campaignLevelId];
      if (_ce) {
        rows.push(['LOCATION', _ce.loc.name, false]);
        rows.push(['LEVEL', _ce.lvl.name, false]);
      }
    }
    rows.push(['KILLS', Game.kills, false]);
    rows.push(['INNOCENTS HIT', Game.civiliansHit || 0, false]);
    rows.push(['TOP COMBO', (Game.comboBest || 0) + KILL_STREAK_LABEL, false]);
    rows.push(['MOJAVE REP', getWastelandReputation(), false]);
    const bestMoment = (() => {
      if (Game.state === 'victory' && Game.mode === 'ironthrone') {
        const clearedStage = ironThroneStagesCleared();
        return clearedStage >= IRON_THRONE_STAGES.length ? 'ALL EIGHT WARLORDS FALL. THE THRONE IS YOURS.' : 'WARLORD SLAIN';
      }
      if (Game.state === 'victory' && Game.mode === 'bossrush') return 'BOSS CHAIN CLEARED';
      if (Game.state === 'victory' && Game.levelData && Game.levelData.obj === 'boss') return 'BOSS TAKEDOWN';
      if (Game.state === 'victory' && Game.levelData && Game.levelData.obj === 'horde') return 'HORDE BROKEN';
      if ((Game.civiliansHit || 0) >= CIVILIAN_INFAMY_HITS) return 'THE RADIO HOSTS ARE GOING TO COOK YOU';
      if ((Game.comboBest || 0) >= RUN_MOMENT_LEGENDARY_COMBO) return 'LEGENDARY ×10 MULTIPLIER';
      if ((Game.comboBest || 0) >= RUN_MOMENT_STRONG_COMBO) return 'HIGH-OCTANE COMBO';
      if (Game.scrapEarned >= RUN_MOMENT_BIG_SCRAP) return 'BIG SCRAP HAUL';
      if (Game.kills >= RUN_MOMENT_SWEEP_KILLS) return 'WASTELAND SWEEP';
      return Game.distance >= RUN_MOMENT_LONG_HAUL_DISTANCE ? 'LONG HAUL SURVIVAL' : 'ANOTHER RUN IN THE BOOKS';
    })();
    rows.push(['BEST MOMENT', bestMoment, false]);
    rows.push(['+ SCRAP EARNED', '+' + Game.scrapEarned, false]);

    document.getElementById('res-rows').innerHTML = rows.map(([l,v,big]) =>
      `<div class="res-row${big ? ' big' : ''}"><div class="lbl">${l}</div><div class="val">${v}</div></div>`
    ).join('');

    // next sector button (gauntlet / campaign victory)
    const nextBtn = document.getElementById('res-next');
    if (Game.state === 'victory' && Game.mode === 'gauntlet' && Game.levelData) {
      const nextNum = Game.levelData.num + 1;
      const next = LEVELS.find(L => L.num === nextNum);
      if (next && Profile.isLevelUnlocked(nextNum)) {
        nextBtn.style.display = '';
        nextBtn.textContent = 'NEXT: ' + next.name + ' ►';
        nextBtn.dataset.next = nextNum;
        nextBtn.dataset.nextmode = 'gauntlet';
      } else nextBtn.style.display = 'none';
    } else if (Game.state === 'victory' && Game.mode === 'campaign' && Game.campaignLevelId) {
      const _ce = CAMPAIGN_LEVEL_MAP[Game.campaignLevelId];
      if (_ce) {
        const { loc, lvl, locIdx, levelIdx } = _ce;
        const nextLvl = loc.levels[levelIdx + 1];
        const nextLoc = CAMPAIGN_LOCATIONS[locIdx + 1];
        let nextId = null, nextName = null;
        if (nextLvl && Profile.isCampaignLevelUnlocked(loc.id, nextLvl.num)) {
          nextId = loc.id + '-' + nextLvl.num; nextName = nextLvl.name;
        } else if (!nextLvl && nextLoc && Profile.isCampaignLevelUnlocked(nextLoc.id, 1)) {
          nextId = nextLoc.id + '-1'; nextName = nextLoc.name;
        }
        if (nextId) {
          nextBtn.style.display = '';
          nextBtn.textContent = 'NEXT: ' + nextName + ' ►';
          nextBtn.dataset.next = nextId;
          nextBtn.dataset.nextmode = 'campaign';
        } else nextBtn.style.display = 'none';
      } else nextBtn.style.display = 'none';
    } else if (Game.state === 'victory' && Game.mode === 'ironthrone') {
      // ironThroneStage was incremented on boss death; points to next stage
      const clearedStage = ironThroneStagesCleared();
      const nextStageNum = clearedStage + 1;
      const nextDef = IRON_THRONE_STAGES[nextStageNum - 1];
      if (nextDef && Profile.isIronThroneStageUnlocked(nextStageNum)) {
        nextBtn.style.display = '';
        nextBtn.textContent = 'NEXT: ' + nextDef.name + ' ►';
        nextBtn.dataset.next = nextStageNum;
        nextBtn.dataset.nextmode = 'ironthrone';
      } else nextBtn.style.display = 'none';
    } else nextBtn.style.display = 'none';

    // share button (daily challenge)
    const shareBtn = document.getElementById('res-share');
    if (shareBtn) {
      if (Game.mode === 'daily' && Game.dailySeedKey) {
        shareBtn.style.display = '';
        shareBtn.dataset.score = String(Math.floor(Game.score));
        shareBtn.dataset.seed = Game.dailySeedKey;
      } else {
        shareBtn.style.display = 'none';
      }
    }

    // Submit score to global scoreboard after run ends
    submitGlobalScore();

    // show any badges earned this run
    const badgesEl = document.getElementById('res-badges');
    if (badgesEl) {
      const nb = Game._pendingBadges || [];
      const nc = Game._pendingCosmetics || [];
      if (nb.length || nc.length) {
        badgesEl.style.display = '';
        const badgeHtml = nb.length ? '<div class="res-badge-title">BADGE' + (nb.length > 1 ? 'S' : '') + ' EARNED</div>' +
          nb.map(a =>
            `<div class="res-badge-item"><span class="res-badge-icon">${a.icon}</span><div><div class="res-badge-name">${escapeHtml(a.name)}</div><div class="res-badge-desc">${escapeHtml(a.desc)}</div></div></div>`
          ).join('') : '';
        const cosmeticHtml = nc.length ? '<div class="res-badge-title">CUSTOMIZATION UNLOCKED</div>' +
          nc.map(c =>
            `<div class="res-badge-item"><span class="res-badge-icon">✦</span><div><div class="res-badge-name">${escapeHtml(c.name)}</div><div class="res-badge-desc">${escapeHtml(COSMETIC_LABELS[c.category] || 'COSMETIC')}</div></div></div>`
          ).join('') : '';
        badgesEl.innerHTML = badgeHtml + cosmeticHtml;
      } else {
        badgesEl.style.display = 'none';
      }
      Game._pendingBadges = [];
      Game._pendingCosmetics = [];
    }

    this.show('results');
  },

  // ---- PAUSE ----
  showPause() {
    this.show('pause');
  },

  // ---- SCOREBOARD ----
  showScoreboard(mode) {
    const el = document.getElementById('scoreboard-list');
    const titleEl = document.getElementById('scoreboard-mode');
    const modeId = mode || Game.mode || 'classic';
    titleEl.textContent = (MODES.find(m => m.id === modeId) || { name: 'GLOBAL' }).name;
    el.innerHTML = '<div class="small center" style="padding:14px">LOADING...</div>';
    this.show('scoreboard');
    const url = (window.RENDER_API || '') + '/api/scores?mode=' + encodeURIComponent(modeId);
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(data => {
        if (!data || !data.scores || data.scores.length === 0) {
          el.innerHTML = '<div class="small center" style="padding:14px">NO SCORES YET. BE THE FIRST!</div>';
          return;
        }
        el.innerHTML = data.scores.map((s, i) =>
          `<div class="res-row${i === 0 ? ' big' : ''}">
            <div class="lbl">#${i+1} ${escapeHtml(s.name || '???')}</div>
            <div class="val">${(s.score | 0).toLocaleString()}</div>
          </div>`
        ).join('') +
        `<div class="small center" style="margin-top:8px;opacity:.5">${data.scores.length} ENTRIES · TOP ${Math.min(data.scores.length,50)}</div>`;
      })
      .catch(() => {
        el.innerHTML = '<div class="small center" style="padding:14px;color:var(--danger)">SCOREBOARD UNAVAILABLE<br><span style="font-size:10px">ONLINE SCORES REQUIRE SERVER HOSTING</span></div>';
      });
    // populate mode selector buttons
    const btnRow = document.getElementById('scoreboard-modes');
    if (btnRow) {
      btnRow.innerHTML = MODES.map(m =>
        `<button class="btn${m.id === modeId ? ' primary' : ''}" data-act="scoreboard-mode" data-mode="${m.id}" style="font-size:10px;min-height:36px;padding:6px 8px">${m.name}</button>`
      ).join('');
    }
  },

  // ---- SETTINGS ----
  showSettings() {
    // Build the body each time so the controls reflect the current values.
    // Each `data-set` action is mapped in the action router below.
    const wrap = document.getElementById('settings-list');
    if (!wrap) return; // DOM not ready
    const slider = (label, key, min, max, step, suffix) => {
      const v = Settings[key];
      const pct = Math.round(((v - min) / (max - min)) * 100);
      return `<div class="set-row">
        <div class="set-head"><div class="set-name">${label}</div><div class="set-val">${pct}%${suffix || ''}</div></div>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-set="${key}" />
      </div>`;
    };
    const toggle = (label, key, sub) => {
      const on = !!Settings[key];
      return `<div class="set-row">
        <div class="set-head">
          <div><div class="set-name">${label}</div>${sub ? `<div class="set-sub">${sub}</div>` : ''}</div>
          <button class="btn set-toggle ${on ? 'on' : ''}" data-toggle="${key}">${on ? 'ON' : 'OFF'}</button>
        </div>
      </div>`;
    };
    const qopts = ['auto','high','medium','low']
      .map(m => `<button class="btn set-q ${PerfMon.mode === m ? 'on' : ''}" data-quality="${m}">${m.toUpperCase()}</button>`)
      .join('');
    wrap.innerHTML = `
      <h2>AUDIO</h2>
      ${slider('MASTER VOLUME', 'master', 0, 1, 0.05)}
      ${slider('SFX VOLUME',    'sfx',    0, 1, 0.05)}
      <h2>VISUAL</h2>
      ${slider('SCREEN SHAKE',  'shake',     0, 1.5, 0.1)}
      ${slider('PARTICLE DENSITY','particles', 0, 1.5, 0.1)}
      <div class="set-row">
        <div class="set-head"><div class="set-name">QUALITY</div></div>
        <div class="set-q-row">${qopts}</div>
      </div>
      ${toggle('HIGH CONTRAST HUD', 'hudContrast', 'STRONGER HUD BACKDROP + BRIGHTER LABELS')}
      <h2>CONTROLS</h2>
      ${toggle('HAPTICS', 'haptics', 'VIBRATE ON HIT / KILL / DEATH')}
      ${toggle('LARGE TOUCH TARGETS', 'bigButtons', 'EASIER TO TAP ON SMALL SCREENS')}
      ${toggle('AUTO FIRE', 'autoFire', 'CONTINUOUS FIRE ASSIST DURING RUNS')}
      <h2>READABILITY</h2>
      ${toggle('DAMAGE NUMBERS', 'damageNumbers', 'SHOW DAMAGE POPUPS ON HITS')}
    `;
    this.show('settings');
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
        // choose a warrior first, then prompt for callsign
        UI.showCharacters('new');
        break;
      case 'menu-character':
        UI.showCharacters('change');
        break;
      case 'character-cancel':
        if (UI._charMode === 'new') UI.showProfiles();
        else UI.showMenu();
        break;
      case 'character-confirm': {
        const cid = UI._pendingChar || DEFAULT_CHARACTER_ID;
        if (UI._charMode === 'new') {
          UI.prompt('NEW DRIVER NAME', name => {
            try {
              Profile.create(name, cid);
              UI.showMenu();
              const ch = CHARACTER_BY_ID[cid];
              UI.toast((ch ? ch.title + ' · ' : '') + (name || '').toUpperCase() + ' READY');
            } catch (e) {
              UI.toast(e.message);
              // re-open the character select so the user can retry naming
              UI.showCharacters('new');
            }
          });
        } else {
          if (Profile.setCharacter(cid)) {
            const ch = CHARACTER_BY_ID[cid];
            UI.toast('NOW RIDING AS ' + (ch ? ch.name : ''));
          }
          UI.showMenu();
        }
        break;
      }
      case 'menu-play':
        UI.showMode();
        break;
      case 'menu-campaign':
        UI.showCampaign();
        break;
      case 'menu-garage':
        UI.showGarage();
        break;
      case 'menu-stats':
        UI.showStats();
        break;
      case 'menu-scoreboard':
        UI.showScoreboard(Game.mode || 'classic');
        break;
      case 'scoreboard-mode':
        UI.showScoreboard(data);
        break;
      case 'back-scoreboard':
        UI.showMenu();
        break;
      case 'res-scoreboard':
        UI.showScoreboard(Game.mode || 'classic');
        break;
      case 'menu-achievements':
        UI.showAchievements();
        break;
      case 'menu-sidekick':
        UI.showSidekick();
        break;
      case 'menu-settings':
        UI._settingsFrom = 'menu';
        UI.showSettings();
        break;
      case 'pause-resume':
        if (Game.state === 'playing') Game.paused = false;
        UI.hideAllScreens();
        break;
      case 'pause-restart': {
        const m = Game.mode, lvl = Game.level;
        UI.hideAllScreens();
        Game.paused = false;
        startRun(m, lvl);
        break;
      }
      case 'pause-settings':
        UI._settingsFrom = 'pause';
        UI.showSettings();
        break;
      case 'pause-quit':
        // abandon the run and return to the menu without recording
        Game.paused = false;
        Game.state = 'menu';
        releaseWakeLock();
        pauseBtn.classList.remove('show');
        fsBtn.classList.remove('hidden');
        restoreRng();
        UI.showMenu();
        break;
      case 'back-pause':
        UI.showPause();
        break;
      case 'back-settings-origin':
        // Settings can be opened from the main menu or from the in-game
        // pause screen — return wherever we came from.
        if (UI._settingsFrom === 'pause') UI.showPause();
        else UI.showMenu();
        UI._settingsFrom = null;
        break;
      case 'menu-switch':
        UI.showProfiles();
        break;
      case 'mode-select': {
        const m = data;
        if (m === 'zombie' && !Profile.isZombieModeUnlocked()) {
          const remaining = getZombieUnlockLevelsRemaining(Profile.active());
          UI.toast(zombieLockedMessage('LOCKED', remaining));
        }
        else if (m === 'ironthrone' && !Profile.isFullMasteryUnlocked()) {
          UI.toast('IRON THRONE LOCKED — CLEAR ALL CAMPAIGN LOCATIONS AND ALL GAUNTLET SECTORS');
        }
        else if (m === 'gauntlet') UI.showGauntlet();
        else if (m === 'campaign') UI.showCampaign();
        else if (m === 'ironthrone') UI.showIronThrone();
        else startRun(m);
        break;
      }
      case 'gauntlet-start': {
        const num = data;
        if (Profile.isLevelUnlocked(num)) startRun('gauntlet', num);
        else UI.toast('LOCKED');
        break;
      }
      case 'ironthrone-start': {
        const stageNum = typeof data === 'number' ? data : parseInt(data, 10);
        if (Profile.isIronThroneStageUnlocked(stageNum)) {
          UI.hideAllScreens();
          startRun('ironthrone', stageNum);
        } else {
          UI.toast('STAGE LOCKED — CLEAR PREVIOUS WARLORD FIRST');
        }
        break;
      }
      case 'res-again': {
        const m = Game.mode, lvl = Game.level;
        UI.hideAllScreens();
        startRun(m, lvl);
        break;
      }
      case 'res-next': {
        const _rnBtn = document.getElementById('res-next');
        const _rnMode = _rnBtn.dataset.nextmode || 'gauntlet';
        const _rnVal  = _rnBtn.dataset.next;
        UI.hideAllScreens();
        if (_rnMode === 'campaign') startRun('campaign', _rnVal);
        else if (_rnMode === 'ironthrone') startRun('ironthrone', parseInt(_rnVal, 10));
        else startRun('gauntlet', parseInt(_rnVal, 10));
        break;
      }
      case 'res-share': {
        const btn = document.getElementById('res-share');
        const score = btn.dataset.score || '0';
        const seed = btn.dataset.seed || '';
        const text = `MOJAVE RUN — DAILY ${seed}\nSCORE: ${score}\n${SHARE_BASE_URL}`;
        let shared = false;
        try {
          if (navigator.share) {
            navigator.share({ title: 'Mojave Run — Daily', text }).catch(() => {});
            shared = true;
          }
        } catch (_) {}
        if (!shared) {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(
                () => UI.toast('SCORE COPIED'),
                () => UI.toast('COULD NOT COPY')
              );
            } else {
              UI.toast(text.split('\n')[1]);
            }
          } catch (_) { UI.toast('COULD NOT SHARE'); }
        }
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

  // ---- CAMPAIGN ----
  showCampaign() {
    const p = Profile.active(); if (!p) return;
    document.getElementById('campaign-progress').textContent = Profile.campaignLevelsCleared() + ' / ' + CAMPAIGN_LEVEL_TOTAL;
    document.getElementById('campaign-map').innerHTML = buildUSMapSVG();
    // auto-select the first unlocked-but-incomplete location
    const firstLoc = CAMPAIGN_LOCATIONS.find((loc, i) => {
      if (i === 0) return !Profile.isCampaignLocationCleared(loc.id);
      return Profile.isCampaignLocationCleared(CAMPAIGN_LOCATIONS[i - 1].id) && !Profile.isCampaignLocationCleared(loc.id);
    }) || CAMPAIGN_LOCATIONS[0];
    updateCampaignDetail(firstLoc.id);
    this.show('campaign');
  },

  // ---- SIDEKICK ----
  showSidekick() {
    const p = Profile.active(); if (!p) return;
    const list = document.getElementById('sidekick-list');
    list.innerHTML = '';
    SIDEKICKS.forEach(sk => {
      const unlocked = Profile.isSidekickUnlocked(sk.id);
      const active = p.activeSidekick === sk.id;
      const lockLoc = CAMPAIGN_LOCATIONS.find(l => l.id === sk.unlockLoc);
      const card = document.createElement('div');
      card.className = 'sidekick-card' + (active ? ' active' : '') + (!unlocked ? ' locked' : '');
      card.innerHTML = `
        <div class="sk-header">
          <div>
            <div class="sk-name" style="color:${unlocked ? sk.color : 'var(--gold-dim)'}">${escapeHtml(sk.name)}</div>
            <div class="sk-title">${escapeHtml(sk.title)}</div>
          </div>
          ${active ? '<div class="sk-badge">ACTIVE</div>' : ''}
          ${!unlocked ? '<div class="sk-lock">🔒</div>' : ''}
        </div>
        <div class="sk-bio">${escapeHtml(sk.bio)}</div>
        <div class="sk-perk" style="color:${unlocked ? sk.color : 'var(--gold-dim)'}">★ ${escapeHtml(sk.perk)}</div>
        ${!unlocked ? `<div class="sk-unlock-hint">UNLOCK: CLEAR ${escapeHtml(lockLoc ? lockLoc.name.toUpperCase() : sk.unlockLoc.toUpperCase())}</div>` : ''}
        ${unlocked && !active ? `<button class="btn" style="margin-top:8px" data-skact="equip" data-skid="${sk.id}">EQUIP</button>` : ''}
        ${unlocked && active ? `<button class="btn danger" style="margin-top:8px" data-skact="unequip" data-skid="${sk.id}">UNEQUIP</button>` : ''}
      `;
      list.appendChild(card);
    });
    this.show('sidekick');
  },

  // ---- CINEMATIC HELPERS ----
  // Duration (ms) for each fullscreen cinematic before auto-dismiss.
  _LOCATION_INTRO_DURATION: 6500,
  _ZOMBIE_CUTSCENE_DURATION: 6000,

  // Force CSS animations to replay by removing them, triggering a reflow, then
  // restoring them. Used before showing any animated cinematic overlay.
  _resetAnimations(screenId, selectors) {
    const el = document.getElementById('screen-' + screenId);
    if (!el) return;
    el.querySelectorAll(selectors).forEach(child => {
      child.style.animation = 'none';
      void child.offsetWidth; // force reflow so the browser acknowledges the reset
      child.style.animation = '';
    });
  },

  // Show a fullscreen cinematic overlay (screenId without 'screen-' prefix),
  // then call cb when dismissed (tap or auto-dismiss after durationMs).
  _showCinematic(screenId, durationMs, cb) {
    this.show(screenId);
    const overlay = document.getElementById('screen-' + screenId);
    const dismiss = () => {
      if (overlay) overlay.removeEventListener('pointerdown', once);
      clearTimeout(timer);
      UI.hideAllScreens();
      cb();
    };
    const timer = setTimeout(dismiss, durationMs);
    const once = () => dismiss();
    if (overlay) overlay.addEventListener('pointerdown', once);
  },

  // ---- LOCATION INTRO CINEMATIC ----
  // Shown before the first level of a new campaign location — animates in the
  // region name, state, and backstory intro text. Auto-dismisses or tap-to-skip.
  showLocationIntro(loc, cb) {
    const nameEl  = document.getElementById('loc-intro-name');
    const stateEl = document.getElementById('loc-intro-state');
    const textEl  = document.getElementById('loc-intro-text');
    if (nameEl)  nameEl.textContent  = loc.name.toUpperCase();
    if (stateEl) stateEl.textContent = loc.state.toUpperCase();
    if (textEl)  textEl.textContent  = loc.intro;
    this._resetAnimations('loc-intro', '.loc-intro-eyebrow,.loc-intro-name,.loc-intro-state,.loc-intro-divider,.loc-intro-text');
    this._showCinematic('loc-intro', this._LOCATION_INTRO_DURATION, cb);
  },

  // ---- ZOMBIE PORT EMOTIONAL CUTSCENE ----
  // Plays the first time zombie mode unlocks — connects the civilian deaths the
  // player caused throughout the campaign to the zombie horde rising against them.
  showZombiePortCutscene(civCount, cb) {
    const titleEl = document.getElementById('zombie-cut-title');
    const countEl = document.getElementById('zombie-cut-count');
    const textEl  = document.getElementById('zombie-cut-text');
    if (titleEl) titleEl.textContent = 'THE DEAD REMEMBER';
    if (countEl) {
      countEl.textContent = civCount > 0
        ? civCount + ' INNOCENT' + (civCount !== 1 ? 'S' : '') + ' LEFT ON THE ROAD BEHIND YOU'
        : 'YOU DROVE CLEAN — BUT THE ROAD REMEMBERS ANYWAY';
    }
    if (textEl) {
      textEl.textContent = civCount > 0
        ? 'Every car you crushed. Every body you left in the dust. Every civilian you clipped and didn\'t look back at. They didn\'t stay down. The Mojave doesn\'t forget. The dead are rising — and they know your engine noise. They\'re coming for you. The zombie horde begins here.'
        : 'You didn\'t pull the trigger on them yourself. But the violence you drove through left a wake. The dead rise from every battlefield you passed through. They\'re coming. The zombie horde begins here.';
    }
    this._resetAnimations('zombie-cut', '.zombie-cut-icon,.zombie-cut-title,.zombie-cut-count,.zombie-cut-text');
    this._showCinematic('zombie-cut', this._ZOMBIE_CUTSCENE_DURATION, cb);
  },

  // ---- CAMPAIGN STORY OVERLAY ----
  showCampaignStory(levelId, sidekickId, zombieUnlocked, cb) {
    // If zombie mode just unlocked, show the emotional cutscene first before the
    // regular level-cleared story card.
    if (zombieUnlocked) {
      const p = Profile.active();
      const civCount = (p && p.totalCivilianHits) || 0;
      this.showZombiePortCutscene(civCount, () => {
        this._showCampaignStoryCard(levelId, sidekickId, true, cb);
      });
      return;
    }
    this._showCampaignStoryCard(levelId, sidekickId, false, cb);
  },

  _showCampaignStoryCard(levelId, sidekickId, zombieUnlocked, cb) {
    const entry = levelId ? CAMPAIGN_LEVEL_MAP[levelId] : null;
    if (!entry) { cb(); return; }
    const loc = entry.loc;
    const lvl = entry.lvl;
    const isLocCleared = Profile.isCampaignLocationCleared(loc.id);
    const titleEl = document.getElementById('story-title');
    const textEl  = document.getElementById('story-text');
    const portEl  = document.getElementById('story-portrait');
    const skLine  = document.getElementById('story-sk-line');
    titleEl.textContent = isLocCleared ? loc.name.toUpperCase() + ' CLEARED' : lvl.name.toUpperCase() + ' CLEARED';
    textEl.textContent  = isLocCleared ? loc.outro : (lvl.obj === 'boss' ? 'BOSS ELIMINATED. THE ROAD OPENS.' : lvl.obj === 'horde' ? 'HORDE BROKEN. THE STREETS ARE QUIET — FOR NOW.' : 'OBJECTIVE COMPLETE. KEEP MOVING.');
    if (skLine) {
      const notices = [];
      if (sidekickId) {
        const sk = SIDEKICK_BY_ID[sidekickId];
        if (sk) notices.push('★ ' + sk.name.toUpperCase() + ' JOINS YOUR CREW!');
      }
      if (zombieUnlocked) notices.push('☣ ZOMBIE HORDE UNLOCKED');
      if (notices.length) {
        skLine.textContent = notices.join(' | ');
        skLine.style.display = '';
      } else {
        skLine.style.display = 'none';
      }
    }
    const ch = Profile.character();
    portEl.innerHTML = characterPortraitSVG(ch ? ch.id : DEFAULT_CHARACTER_ID) + '<div class="pframe"></div>';
    this.show('story');
    const dismiss = () => {
      UI.hideAllScreens();
      cb();
    };
    const timer = setTimeout(dismiss, 3600);
    const overlay = document.getElementById('screen-story');
    const once = () => { overlay.removeEventListener('pointerdown', once); clearTimeout(timer); dismiss(); };
    overlay.addEventListener('pointerdown', once);
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============================================================
// CAMPAIGN MAP + DETAIL
// ============================================================
function buildUSMapSVG() {
  // Simplified continental US polygon (300×185 space)
  const outline = '10,62 14,82 12,140 32,145 68,148 100,155 118,150 143,153 165,150 188,151 204,163 216,148 238,141 255,128 275,110 284,90 292,72 296,60 298,48 287,38 268,33 266,22 256,27 244,18 264,10 248,14 228,21 206,21 175,19 150,23 130,19 105,21 85,19 63,17 44,21 25,21 10,38';
  const roadPts = CAMPAIGN_LOCATIONS.map(l => l.mapPos.join(',')).join(' ');
  let dots = '';
  CAMPAIGN_LOCATIONS.forEach((loc, i) => {
    const [x, y] = loc.mapPos;
    const prevLoc = i > 0 ? CAMPAIGN_LOCATIONS[i - 1] : null;
    const unlocked = i === 0 || (prevLoc && Profile.isCampaignLocationCleared(prevLoc.id));
    const cleared  = Profile.isCampaignLocationCleared(loc.id);
    const col = cleared ? '#7af07a' : unlocked ? '#f5d76e' : 'rgba(245,215,110,.3)';
    const cls = 'camp-dot' + (cleared ? ' cleared' : unlocked ? ' unlocked' : ' locked');
    dots += `<circle class="${cls}" cx="${x}" cy="${y}" r="5" fill="${col}" stroke="#1a0f08" stroke-width="1.5" data-locid="${escapeHtml(loc.id)}"/>`;
    dots += `<text x="${x}" y="${y - 7}" text-anchor="middle" font-size="5.5" fill="${col}" font-family="'Courier New',monospace" pointer-events="none" font-weight="bold">${i + 1}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 185" style="width:100%;display:block">
    <polygon points="${outline}" fill="rgba(58,35,15,.55)" stroke="rgba(245,215,110,.25)" stroke-width=".8"/>
    <polyline points="${roadPts}" fill="none" stroke="rgba(245,215,110,.2)" stroke-width="1.2" stroke-dasharray="4,3"/>
    ${dots}
  </svg>`;
}

function updateCampaignDetail(locId) {
  const p = Profile.active(); if (!p) return;
  const loc = CAMPAIGN_LOCATIONS.find(l => l.id === locId); if (!loc) return;
  const locIdx = CAMPAIGN_LOCATIONS.findIndex(l => l.id === locId);
  const isLocUnlocked = locIdx === 0 || Profile.isCampaignLocationCleared(CAMPAIGN_LOCATIONS[locIdx - 1].id);
  const isLocCleared  = Profile.isCampaignLocationCleared(locId);
  const clearedLevels = ((p.campaignCleared || {})[locId] || {}).levelsCleared || [];
  const levelsHTML = loc.levels.map(lvl => {
    const levelId   = loc.id + '-' + lvl.num;
    const isCleared  = clearedLevels.includes(lvl.num);
    const isUnlocked = Profile.isCampaignLevelUnlocked(locId, lvl.num);
    const isBoss     = lvl.obj === 'boss' || lvl.obj === 'horde';
    let objLabel = '';
    if (lvl.obj === 'survive')  objLabel = lvl.target + 'S';
    else if (lvl.obj === 'kills')    objLabel = lvl.target + ' KILLS';
    else if (lvl.obj === 'distance') objLabel = (lvl.target / 1000).toFixed(1) + ' KM';
    else if (lvl.obj === 'boss')     objLabel = 'BOSS';
    else if (lvl.obj === 'horde')    objLabel = 'HORDE ' + lvl.target + 'S';
    const cls = 'camp-level-tile' + (isCleared ? ' cleared' : '') + (!isUnlocked ? ' locked' : '') + (isBoss ? ' boss' : '');
    return `<div class="${cls}" data-campid="${levelId}">
      <div class="clt-num">${lvl.num}</div>
      <div class="clt-name">${escapeHtml(lvl.name)}</div>
      <div class="clt-obj">${objLabel}</div>
      ${isCleared ? '<div class="clt-check">✓</div>' : ''}
      ${isBoss && !isCleared ? '<div class="clt-star">★</div>' : ''}
    </div>`;
  }).join('');
  const detail = document.getElementById('campaign-detail');
  detail.innerHTML = `
    <div class="camp-loc-header">
      <div class="camp-loc-name">${escapeHtml(loc.name)}</div>
      <div class="camp-loc-state">${escapeHtml(loc.state)}</div>
      ${!isLocUnlocked ? '<div class="camp-locked-msg">LOCKED — CLEAR PREVIOUS REGION</div>' : ''}
      ${isLocCleared   ? '<div class="camp-cleared-msg">✓ REGION CLEARED</div>' : ''}
    </div>
    <div class="camp-loc-intro">${escapeHtml(loc.intro)}</div>
    <div class="camp-levels-grid">${levelsHTML}</div>
  `;
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
  // gauntlet / iron throne tile
  const lt = e.target.closest('.level-tile');
  if (lt && !lt.classList.contains('locked')) {
    if (lt.dataset.itstage) {
      UI.act('ironthrone-start', parseInt(lt.dataset.itstage, 10));
    } else {
      UI.act('gauntlet-start', parseInt(lt.dataset.level, 10));
    }
    return;
  }
  // campaign map dot
  const campDot = e.target.closest('.camp-dot');
  if (campDot) {
    SFX.click();
    const locId = campDot.dataset.locid;
    if (locId) updateCampaignDetail(locId);
    const det = document.getElementById('campaign-detail');
    if (det) det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  // campaign level tile
  const campTile = e.target.closest('.camp-level-tile');
  if (campTile && !campTile.classList.contains('locked')) {
    SFX.click();
    const campId = campTile.dataset.campid;
    if (campId) {
      const _ce = CAMPAIGN_LEVEL_MAP[campId];
      // Show animated location intro cinematic when entering the first level of
      // a new location (level num === 1) — gives the campaign its sense of place.
      if (_ce && _ce.lvl.num === 1) {
        UI.hideAllScreens();
        UI.showLocationIntro(_ce.loc, () => startRun('campaign', campId));
      } else {
        UI.hideAllScreens();
        startRun('campaign', campId);
      }
    }
    return;
  }
  // sidekick card actions
  const ska = e.target.closest('[data-skact]');
  if (ska) {
    SFX.click();
    const sid = ska.dataset.skid;
    const sact = ska.dataset.skact;
    if (sact === 'equip' && sid) {
      Profile.setSidekick(sid);
      const sk = SIDEKICK_BY_ID[sid];
      UI.toast((sk ? sk.name : '') + ' EQUIPPED');
      UI.showSidekick();
    } else if (sact === 'unequip') {
      Profile.setSidekick(null);
      UI.toast('SIDEKICK UNEQUIPPED');
      UI.showSidekick();
    }
    return;
  }
  const gt = e.target.closest('[data-garage-tab]');
  if (gt) {
    SFX.click();
    UI.showGarage(gt.dataset.garageTab);
    return;
  }
  const ca = e.target.closest('[data-cact]');
  if (ca) {
    SFX.click();
    const cid = ca.dataset.cid;
    const c = COSMETIC_BY_ID[cid];
    if (!c) return;
    if (ca.dataset.cact === 'buy') {
      if (Profile.buyCosmetic(cid)) {
        UI.toast('UNLOCKED ' + c.name);
        Profile.equipCosmetic(cid);
      } else {
        const p = Profile.active();
        const unmetRequirement = p && !isCosmeticConditionMet(c, p);
        UI.toast(unmetRequirement ? 'REQUIREMENTS NOT MET' : 'INSUFFICIENT SCRAP');
      }
    } else if (ca.dataset.cact === 'equip') {
      if (Profile.equipCosmetic(cid)) UI.toast('EQUIPPED ' + c.name);
    }
    UI.showGarage(c.category);
    return;
  }
  // garage actions
  const va = e.target.closest('[data-vact]');
  if (va) {
    SFX.click();
    const vid = va.dataset.vid;
    const act = va.dataset.vact;
    if (act === 'buy') {
      if (Profile.unlock(vid)) {
        UI.toast('UNLOCKED ' + VEHICLE_BY_ID[vid].name);
        Profile.checkAchievements().forEach(a => UI.toast(a.icon + ' BADGE: ' + a.name, 2500));
        Profile.checkCosmetics().forEach(c => UI.toast('CUSTOM: ' + c.name, 2500));
        UI.showGarage();
      }
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
      Profile.checkAchievements().forEach(a => UI.toast(a.icon + ' BADGE: ' + a.name, 2500));
      Profile.checkCosmetics().forEach(c => UI.toast('CUSTOM: ' + c.name, 2500));
      UI.showUpgrade(vid);
    } else UI.toast('NOT ENOUGH SCRAP');
    return;
  }
  const ba = e.target.closest('[data-bact]');
  if (ba) {
    SFX.click();
    const vid = UI._upVid;
    const branchId = ba.dataset.bid;
    if (Profile.selectBranch(vid, branchId)) {
      SFX.levelUp();
      UI.toast('SPECIALIZATION SET');
      UI.showUpgrade(vid);
    } else UI.toast('BRANCH LOCKED');
    return;
  }
  // settings: quality preset or boolean toggle
  const sq = e.target.closest('[data-quality]');
  if (sq) {
    setQualityMode(sq.dataset.quality, /*persist*/ true);
    SFX.click();
    UI.showSettings();
    return;
  }
  const st = e.target.closest('[data-toggle]');
  if (st) {
    const key = st.dataset.toggle;
    if (key in Settings && typeof Settings[key] === 'boolean') {
      Settings[key] = !Settings[key];
      Settings.save();
      SFX.click();
      UI.showSettings();
    }
    return;
  }
});

// settings sliders: live-update on input, persist on change
document.addEventListener('input', e => {
  const sl = e.target.closest('[data-set]');
  if (!sl) return;
  const key = sl.dataset.set;
  const v = parseFloat(sl.value);
  if (!(key in Settings) || !isFinite(v)) return;
  Settings[key] = v;
  // update the live percentage label without rebuilding the whole screen
  const row = sl.closest('.set-row');
  if (row) {
    const valEl = row.querySelector('.set-val');
    const min = parseFloat(sl.min), max = parseFloat(sl.max);
    if (valEl) valEl.textContent = Math.round(((v - min) / (max - min)) * 100) + '%';
  }
});
document.addEventListener('change', e => {
  const sl = e.target.closest('[data-set]');
  if (!sl) return;
  Settings.save();
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
// Adaptive quality governor: tracks an EWMA of frame cost and dials runtime
// caps up/down. Quality 1 = full detail, 0 = stripped (fewer particles, no
// weather, smaller bullet/popup buffers). The governor only nudges by small
// steps each second so frame rate stays smooth instead of stuttering between
// modes.
const PerfMon = {
  ewmaMs: 16.7,
  quality: 1,
  lastAdjustAt: 0,
  lastScaleAdjustAt: 0,
  hidden: false,
  // Frame counter + EWMA-derived FPS for the debug HUD.
  frames: 0,
  fps: 60,
  lastFpsAt: 0,
  // 'auto' lets the governor adjust quality each second; the named presets
  // (low/medium/high) pin quality and disable auto-adjustment.
  mode: 'auto',
};

const QUALITY_PRESETS = { low: 0, medium: 0.5, high: 1 };
const QUALITY_KEY = 'mojaverun.quality.v1';
// Frame-cost thresholds: >28ms (~35fps) means severe pressure, >22ms (~45fps)
// means moderate pressure, <13ms means enough headroom to recover sharpness.
// Ramp-down is intentionally stronger than ramp-up to quickly stabilize jank
// while avoiding visible oscillation on recovery.
const SCALE_ADJUST_INTERVAL_MS = 1200;
const SCALE_THRESHOLD_SEVERE_MS = 28;
const SCALE_THRESHOLD_HIGH_MS = 22;
const SCALE_THRESHOLD_RECOVER_MS = 13;
const SCALE_STEP_DOWN_SEVERE = 0.12;
const SCALE_STEP_DOWN = 0.06;
const SCALE_STEP_UP = 0.04;
const RENDER_SCALE_CHANGE_THRESHOLD = 0.001;
const DEBUG_HUD = (() => {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('debug') === '1' || p.get('debug') === 'true';
  } catch (_) { return false; }
})();

function loadQualityPref() {
  // URL param wins (handy for testing), then localStorage, else 'auto'.
  let pref = null;
  try {
    const p = new URLSearchParams(window.location.search).get('quality');
    if (p && (p === 'auto' || p in QUALITY_PRESETS)) pref = p;
  } catch (_) {}
  if (!pref) {
    try {
      const s = localStorage.getItem(QUALITY_KEY);
      if (s && (s === 'auto' || s in QUALITY_PRESETS)) pref = s;
    } catch (_) {}
  }
  setQualityMode(pref || 'auto', /*persist*/ false);
}
function setQualityMode(mode, persist) {
  if (mode !== 'auto' && !(mode in QUALITY_PRESETS)) mode = 'auto';
  PerfMon.mode = mode;
  if (mode !== 'auto') PerfMon.quality = QUALITY_PRESETS[mode];
  applyQualityCaps();
  if (persist) {
    try { localStorage.setItem(QUALITY_KEY, mode); } catch (_) {}
  }
}
function cycleQualityMode() {
  const order = ['auto', 'low', 'medium', 'high'];
  const i = order.indexOf(PerfMon.mode);
  setQualityMode(order[(i + 1) % order.length], /*persist*/ true);
}
function applyQualityCaps() {
  // Scale a few non-essential caps; gameplay-critical ones (enemies, obstacles,
  // pickups) stay fixed so the simulation is identical at any quality level.
  const q = PerfMon.quality;
  RUNTIME_CAPS.particles    = Math.round(300 + 400 * q);
  RUNTIME_CAPS.bullets      = Math.round(120 + 80 * q);
  RUNTIME_CAPS.enemyBullets = Math.round(140 + 110 * q);
  RUNTIME_CAPS.popups       = Math.round(40 + 40 * q);
  RUNTIME_CAPS.shockwaves   = Math.round(12 + 12 * q);
}

document.addEventListener('visibilitychange', () => {
  PerfMon.hidden = (document.visibilityState !== 'visible');
  // Reset the dt baseline when we come back so the first post-resume frame
  // doesn't carry a giant elapsed time.
  if (!PerfMon.hidden) last = performance.now();
});

function frame(now) {
  // When the tab is hidden, skip the frame entirely — saves CPU/battery and
  // prevents the throttled-tab catch-up burst that the dt clamp can only
  // partially hide.
  if (PerfMon.hidden) {
    last = now;
    requestAnimationFrame(frame);
    return;
  }
  // Clamp dt: anything >50ms (tab throttled / long stall) becomes a single 50ms tick,
  // which prevents giant catch-up updates that blew up enemy/bullet/particle counts
  // and froze the simulation mid-match.
  const rawDt = (now - last) / 1000;
  const dt = (!isFinite(rawDt) || rawDt <= 0) ? 0.016 : Math.min(0.05, rawDt);
  last = now;
  const frameStart = now;
  try {
    if (Game.state === 'playing' || Game.state === 'loading'
        || Game.state === 'dying' || Game.state === 'victory') {
      update(dt);
      capRuntimeArrays();
    }
    if (window.MP && MP.connected) {
      MP.pruneStale();
      sendMpState();
    }
    render();
    if (window.MP && MP.connected) drawMpGhosts();
    updateHint();
    if (DEBUG_HUD) drawDebugHud();
  } catch (err) {
    // Never let one bad frame kill the loop. Log + continue.
    console.error('[frame]', err);
  }
  // EWMA of total frame cost — used by the quality governor below and the
  // debug HUD overlay.
  const cost = performance.now() - frameStart;
  PerfMon.ewmaMs = PerfMon.ewmaMs * 0.92 + cost * 0.08;
  // Sliding 1s FPS window for the debug HUD.
  PerfMon.frames++;
  if (PerfMon.lastFpsAt === 0) PerfMon.lastFpsAt = now;
  if (now - PerfMon.lastFpsAt >= 1000) {
    PerfMon.fps = PerfMon.frames * 1000 / (now - PerfMon.lastFpsAt);
    PerfMon.frames = 0;
    PerfMon.lastFpsAt = now;
  }
  // Auto-governor only nudges quality when the user is on 'auto'. Manual
  // presets pin quality so the player gets a predictable look.
  if (PerfMon.mode === 'auto' && now - PerfMon.lastAdjustAt > 1000) {
    PerfMon.lastAdjustAt = now;
    // 22ms ≈ 45fps floor. Above it we shed quality; well below it we recover.
    if (PerfMon.ewmaMs > 22 && PerfMon.quality > 0) {
      PerfMon.quality = Math.max(0, PerfMon.quality - 0.15);
      applyQualityCaps();
    } else if (PerfMon.ewmaMs < 14 && PerfMon.quality < 1) {
      PerfMon.quality = Math.min(1, PerfMon.quality + 0.1);
      applyQualityCaps();
    }
  }
  // Adaptive render scale: changes canvas pixel density (not gameplay logic)
  // so low-end phones/tablets can stay smooth while high-end devices regain
  // sharpness when there's headroom.
  if (now - PerfMon.lastScaleAdjustAt > SCALE_ADJUST_INTERVAL_MS) {
    PerfMon.lastScaleAdjustAt = now;
    const prev = renderScale;
    // Intentional deadband between high and recover thresholds to avoid
    // oscillating scale around borderline frame times.
    if (PerfMon.ewmaMs > SCALE_THRESHOLD_SEVERE_MS) {
      renderScale = Math.max(MIN_RENDER_SCALE, renderScale - SCALE_STEP_DOWN_SEVERE);
    } else if (PerfMon.ewmaMs > SCALE_THRESHOLD_HIGH_MS) {
      renderScale = Math.max(MIN_RENDER_SCALE, renderScale - SCALE_STEP_DOWN);
    } else if (PerfMon.ewmaMs < SCALE_THRESHOLD_RECOVER_MS && renderScale < 1) {
      renderScale = Math.min(1, renderScale + SCALE_STEP_UP);
    }
    if (Math.abs(renderScale - prev) > RENDER_SCALE_CHANGE_THRESHOLD) resize();
  }
  requestAnimationFrame(frame);
}

// Debug HUD — only attached when the page was opened with `?debug=1`. Shows
// FPS, the EWMA frame cost (ms), entity counts, current quality preset, and
// MP peer count. Drawn last so it sits above everything; uses a fixed,
// monospace block so it's easy to read on a phone.
function drawDebugHud() {
  const lines = [
    `FPS ${PerfMon.fps.toFixed(0)}  ${PerfMon.ewmaMs.toFixed(1)}ms`,
    `Q ${PerfMon.mode}${PerfMon.mode === 'auto' ? ` (${PerfMon.quality.toFixed(2)})` : ''}  DPR ${DPR}  RS ${renderScale.toFixed(2)}`,
    `enem ${Game.enemies.length}  obst ${Game.obstacles.length}  pick ${Game.pickups.length}`,
    `bull ${Game.bullets.length}  ebul ${Game.enemyBullets.length}  part ${Game.particles.length}`,
    `pop ${Game.popups.length}  sw ${Game.shockwaves.length}` +
      (window.MP && MP.connected ? `  peers ${MP.peers.size}` : ''),
  ];
  ctx.save();
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  let maxW = 0;
  for (let i = 0; i < lines.length; i++) maxW = Math.max(maxW, ctx.measureText(lines[i]).width);
  const pad = 6;
  const x = 8, y = 8;
  const boxW = maxW + pad * 2;
  const boxH = lines.length * 14 + pad * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.fillStyle = PerfMon.ewmaMs > 22 ? '#ff8a8a' : '#7af07a';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + pad, y + pad + i * 14);
  }
  ctx.restore();
}

// Hard caps to prevent unbounded growth from runaway spawns / boss enrage / lag
// catch-up. These limits are well above normal gameplay maxima but bound the
// worst case so the canvas/CPU never spirals into a freeze.
const RUNTIME_CAPS = {
  particles: 700,
  bullets: 200,
  enemyBullets: 250,
  popups: 80,
  shockwaves: 24,
  enemies: 60,
  obstacles: 60,
  pickups: 20,
};
function capRuntimeArrays() {
  for (const k in RUNTIME_CAPS) {
    const arr = Game[k];
    if (arr && arr.length > RUNTIME_CAPS[k]) {
      arr.splice(0, arr.length - RUNTIME_CAPS[k]);
    }
  }
}

// ============================================================
// MULTIPLAYER (ghost overlay co-op)
// ============================================================
function sendMpState() {
  if (!window.MP || !MP.connected) return;
  const inGame = (Game.state === 'playing' || Game.state === 'loading'
    || Game.state === 'dying' || Game.state === 'victory');
  if (!inGame || !Game.player) {
    MP.sendState({ inMenu: true, score: Game.score | 0, kills: Game.kills | 0 });
    return;
  }
  // Normalize x/y as fractions of canvas so peers on different screen sizes line up.
  MP.sendState({
    nx: Game.player.x / W,
    ny: Game.player.y / H,
    vx: Game.player.vx | 0,
    score: Game.score | 0,
    kills: Game.kills | 0,
    dist: Game.distance | 0,
    hp: Math.max(0, Math.round((Game.health / Math.max(1, Game.maxHealth || Game.health)) * 100)),
    state: Game.state,
    mode: Game.mode || null,
    level: Game.level || null,
  });
}

function drawMpGhosts() {
  if (!window.MP || !MP.connected) return;
  const inGame = (Game.state === 'playing' || Game.state === 'loading'
    || Game.state === 'dying' || Game.state === 'victory');
  if (!inGame) return;
  const now = performance.now();
  ctx.save();
  for (const [id, p] of MP.peers) {
    const s = p.s; if (!s || s.inMenu) continue;
    if (typeof s.nx !== 'number' || typeof s.ny !== 'number') continue;
    // Interpolate between previous and current sample to smooth out the
    // ~15Hz update rate. Fall back to raw position if we have no history.
    let nx = s.nx, ny = s.ny;
    if (p.prev && p.prev.s && typeof p.prev.s.nx === 'number') {
      const span = Math.max(16, p.recvAt - p.prev.t);
      const k = Math.min(1, (now - p.recvAt) / span + 1); // 0..1 across last span
      const t = Math.max(0, Math.min(1, k));
      nx = p.prev.s.nx + (s.nx - p.prev.s.nx) * t;
      ny = p.prev.s.ny + (s.ny - p.prev.s.ny) * t;
    }
    const v = VEHICLE_BY_ID[p.vehicleId] || (Game.vehicle ? VEHICLE_BY_ID[Game.vehicle.id] : null) || VEHICLES[0];
    const x = nx * W;
    const y = ny * H;
    // Fade ghost out as samples grow stale — looks better than freezing in place.
    const stale = Math.max(0, now - p.recvAt - 250);
    const alpha = Math.max(0.12, 0.45 - stale / 4000);
    ctx.globalAlpha = alpha;
    drawVehicle(x, y, v, s.vx || 0, 42, 64, { noCosmetic: true });
    ctx.globalAlpha = 1;
    // name tag
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const name = (p.name || 'PEER').toUpperCase();
    ctx.font = 'bold 11px "Courier New", monospace';
    const tw = ctx.measureText(name).width + 10;
    ctx.fillRect(x - tw/2, y - 50, tw, 16);
    ctx.fillStyle = p.color || '#f5d76e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y - 42);
  }
  ctx.restore();
}

function mpStatusText() {
  if (!window.MP) return 'OFFLINE';
  if (MP.connected) {
    const ping = (typeof MP.pingMs === 'number') ? ` · ${MP.pingMs}MS` : '';
    return `ROOM ${MP.room}${ping}`;
  }
  if (MP.joining) return 'JOINING…';
  if (MP._wantConnected) return 'RECONNECTING…';
  return 'DISCONNECTED';
}

function mpRefreshPeerList() {
  const list = document.getElementById('mp-peers');
  if (!list) return;
  const status = document.getElementById('mp-status-bar');
  if (status) status.textContent = mpStatusText();
  const leaveBtn = document.getElementById('mp-leave-btn');
  if (leaveBtn) leaveBtn.style.display = (MP.connected || MP._wantConnected) ? '' : 'none';
  list.innerHTML = '';
  if (!MP.connected) {
    const msg = MP._wantConnected
      ? 'CHASING SIGNAL THROUGH THE DUST…'
      : 'JOIN A ROOM TO SEE OTHER DRIVERS';
    list.innerHTML = `<div class="small center" style="padding:12px 0;opacity:.6">${msg}</div>`;
    return;
  }
  // self
  const self = document.createElement('div');
  self.className = 'mp-peer self';
  self.innerHTML = `<div><span class="pdot" style="background:#f5d76e"></span>${escapeHtml(MP.name)} <span class="small">(YOU)</span></div><div class="pscore">${Game.score|0}</div>`;
  list.appendChild(self);
  for (const [id, p] of MP.peers) {
    const row = document.createElement('div');
    row.className = 'mp-peer';
    const sc = (p.s && p.s.score) || 0;
    row.innerHTML = `<div><span class="pdot" style="background:${escapeHtml(p.color || '#f5d76e')}"></span>${escapeHtml(p.name || 'PEER')}</div><div class="pscore">${sc}</div>`;
    list.appendChild(row);
  }
}

(function initMp() {
  if (!window.MP) return;
  MP.on('open', mpRefreshPeerList);
  MP.on('close', mpRefreshPeerList);
  MP.on('peers', mpRefreshPeerList);
  MP.on('latency', () => {
    // Only refresh the status line — avoid rebuilding the full peer list each ping.
    const status = document.getElementById('mp-status-bar');
    if (status) status.textContent = mpStatusText();
  });
  // Themed status events surfaced as toasts so the user always knows what's
  // happening with the radio link. Codes are stable; detail is presentation.
  MP.on('status', (st) => {
    if (!st) return;
    const code = st.code;
    const detail = st.detail || '';
    // Suppress noise when the player isn't on the MP screen for trivial events.
    const onMpScreen = (UI.current === 'mp');
    switch (code) {
      case 'connecting':
      case 'reconnecting':
        if (onMpScreen) UI.toast(detail || 'RECONNECTING…');
        break;
      case 'joined':
        UI.toast(detail || 'LINKED UP');
        break;
      case 'dropped':
        UI.toast(detail || 'SIGNAL LOST');
        break;
      case 'error':
        UI.toast(detail || 'COMMS FAULT');
        break;
      case 'giveup':
        UI.toast(detail || 'RADIO SILENT — STOPPING');
        break;
      case 'kicked':
        UI.toast('BOOTED: ' + detail);
        break;
      case 'peer-join':
      case 'peer-leave':
        if (onMpScreen) UI.toast(detail);
        break;
      case 'disconnected':
        if (onMpScreen) UI.toast(detail || 'OFF THE GRID');
        break;
    }
    mpRefreshPeerList();
  });
})();

// extend UI
UI.showMP = function showMP() {
  Game.state = 'menu';
  pauseBtn.classList.remove('show');
  // prefill name & vehicle from active profile
  const p = Profile.active();
  if (p) {
    const v = VEHICLE_BY_ID[p.activeVehicle] || VEHICLES[0];
    if (window.MP) MP.sendMeta({ name: p.name, vehicleId: v.id });
  }
  const urlEl = document.getElementById('mp-url');
  const roomEl = document.getElementById('mp-room');
  // Pre-fill with the resolved default URL so the user can see (and override)
  // exactly which relay we'll connect to. On a static-only host this exposes
  // the configured wss:// URL instead of leaving the field misleadingly blank.
  if (urlEl && !urlEl.value && window.MP) urlEl.value = MP.defaultUrl();
  if (roomEl && !roomEl.value) roomEl.value = 'LOBBY';
  this.show('mp');
  mpRefreshPeerList();
};

// patch UI.act to handle multiplayer actions
const _origAct = UI.act.bind(UI);
UI.act = function(action, data) {
  if (action === 'menu-mp') { UI.showMP(); SFX.click(); return; }
  if (action === 'mp-join') {
    SFX.click();
    const url = document.getElementById('mp-url').value.trim();
    const room = document.getElementById('mp-room').value.trim() || 'LOBBY';
    const p = Profile.active();
    const name = p ? p.name : 'DRIVER';
    const v = p ? (VEHICLE_BY_ID[p.activeVehicle] || VEHICLES[0]) : VEHICLES[0];
    if (window.MP) {
      MP.connect({ url: url || undefined, room, name, vehicleId: v.id });
      UI.toast('JOINING ' + room.toUpperCase() + '…');
    }
    setTimeout(mpRefreshPeerList, 60);
    return;
  }
  if (action === 'mp-leave') {
    SFX.click();
    if (window.MP) MP.disconnect();
    mpRefreshPeerList();
    return;
  }
  return _origAct(action, data);
};

// ============================================================
// CLOUD SAVE / RESTORE (Render back-end accounts)
// ============================================================
const CLOUD_ID_KEY    = 'mojaveRun_cloud_id';
const CLOUD_TOKEN_KEY = 'mojaveRun_cloud_token';

function cloudApiBase() {
  return (typeof window.RENDER_API === 'string' && window.RENDER_API.trim())
    ? window.RENDER_API.trim()
    : '';
}

function cloudModal(title, bodyHtml, { showInput = false, inputPlaceholder = '', okLabel = 'OK', onOk } = {}) {
  const m    = document.getElementById('cloud-modal');
  const tEl  = document.getElementById('cloud-modal-title');
  const bEl  = document.getElementById('cloud-modal-body');
  const iEl  = document.getElementById('cloud-modal-input');
  const eEl  = document.getElementById('cloud-modal-err');
  const okEl = document.getElementById('cloud-modal-ok');
  const cxEl = document.getElementById('cloud-modal-cancel');
  tEl.textContent = title;
  bEl.innerHTML   = bodyHtml;
  eEl.textContent = '';
  iEl.value       = '';
  iEl.placeholder = inputPlaceholder || 'XXXXXX-XXXXXX';
  iEl.style.display = showInput ? '' : 'none';
  okEl.textContent  = okLabel;
  m.style.display   = 'flex';
  if (showInput) setTimeout(() => iEl.focus(), 80);
  const cleanup = () => {
    m.style.display = 'none';
    okEl.onclick  = null;
    cxEl.onclick  = null;
    iEl.onkeydown = null;
  };
  const handleOk = () => {
    cleanup();
    if (onOk) onOk(iEl.value.trim().toUpperCase());
  };
  okEl.onclick  = handleOk;
  cxEl.onclick  = cleanup;
  iEl.onkeydown = (e) => { if (e.key === 'Enter') handleOk(); if (e.key === 'Escape') cleanup(); };
}

function cloudSave() {
  const base = cloudApiBase();
  if (!base) { UI.toast('CLOUD NOT CONFIGURED'); return; }
  const p = Profile.active();
  if (!p) { UI.toast('NO ACTIVE DRIVER'); return; }
  const allProfiles = Profile.list();
  const data = { profiles: allProfiles };

  const doSave = (id, token) => {
    fetch(base + '/api/accounts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, data }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(() => {
        const code = id + '-' + token;
        cloudModal('CLOUD SAVED ☁', `YOUR CLOUD CODE:<br/><br/><b style="font-size:18px;letter-spacing:4px;color:var(--gold)">${escapeHtml(code)}</b><br/><br/>WRITE THIS DOWN TO RESTORE YOUR ACCOUNT ON ANY DEVICE.`, {
          okLabel: 'COPY CODE',
          onOk: () => {
            try { navigator.clipboard.writeText(code).catch(() => {}); } catch (_) {}
            UI.toast('CODE COPIED!');
          },
        });
      })
      .catch(err => UI.toast('CLOUD SAVE FAILED: ' + err.message));
  };

  const existingId    = localStorage.getItem(CLOUD_ID_KEY);
  const existingToken = localStorage.getItem(CLOUD_TOKEN_KEY);
  if (existingId && existingToken) {
    doSave(existingId, existingToken);
    return;
  }
  // Register a new account first
  fetch(base + '/api/accounts/register', { method: 'POST' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(resp => {
      localStorage.setItem(CLOUD_ID_KEY, resp.id);
      localStorage.setItem(CLOUD_TOKEN_KEY, resp.token);
      doSave(resp.id, resp.token);
    })
    .catch(err => UI.toast('COULD NOT REACH CLOUD: ' + err.message));
}

function cloudRestore() {
  const base = cloudApiBase();
  if (!base) { UI.toast('CLOUD NOT CONFIGURED'); return; }
  const existing = localStorage.getItem(CLOUD_ID_KEY);
  const existingToken = localStorage.getItem(CLOUD_TOKEN_KEY);
  const hintHtml = existing
    ? `YOUR CURRENT CODE: <b style="color:var(--gold)">${escapeHtml(existing + '-' + existingToken)}</b><br/><br/>ENTER A CODE TO RESTORE A DIFFERENT ACCOUNT.`
    : 'ENTER THE CLOUD CODE YOU WERE GIVEN WHEN YOU SAVED.';
  cloudModal('☁ CLOUD RESTORE', hintHtml, {
    showInput: true,
    inputPlaceholder: 'XXXXXX-XXXXXX',
    okLabel: 'RESTORE',
    onOk: (code) => {
      if (!code) { UI.toast('INVALID CLOUD CODE'); return; }
      const parts = code.split('-');
      if (parts.length !== 2 || parts[0].length !== 6 || parts[1].length !== 6) {
        UI.toast('INVALID CLOUD CODE — FORMAT MUST BE XXXXXX-XXXXXX');
        return;
      }
      const id    = parts[0];
      const token = parts[1];
      fetch(base + '/api/accounts/load?id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token))
        .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
        .then(resp => {
          if (!resp.data || !Array.isArray(resp.data.profiles)) throw new Error('bad data');
          // Merge server profiles into local store
          const merged = Profile._data;
          const existing2 = new Map(merged.profiles.map(pp => [pp.id, pp]));
          resp.data.profiles.forEach(pp => existing2.set(pp.id, pp));
          merged.profiles = Array.from(existing2.values());
          Profile.save();
          localStorage.setItem(CLOUD_ID_KEY, id);
          localStorage.setItem(CLOUD_TOKEN_KEY, token);
          UI.showProfiles();
          UI.toast('CLOUD RESTORE COMPLETE!');
        })
        .catch(err => UI.toast('RESTORE FAILED: ' + err.message));
    },
  });
}

// Wire cloud actions into UI.act
const _origActCloud = UI.act.bind(UI);
UI.act = function(action, data) {
  if (action === 'cloud-save') { SFX.click(); cloudSave(); return; }
  if (action === 'cloud-restore') { SFX.click(); cloudRestore(); return; }
  return _origActCloud(action, data);
};

function boot() {
  resize();
  loadQualityPref();
  Settings.load();
  Settings.applyBodyClass();
  Profile.load();
  // seed decor for menu backdrop
  Game.player = { x: W * 0.5, y: H - 110, w: 42, h: 64, vx: 0 };
  for (let i = 0; i < 36; i++) Game.decor.push(makeDecor(Math.random() * H));

  // PWA shortcut deep-links: `?mode=daily` jumps straight into the daily run,
  // `?continue=1` skips the title screen if a profile already exists. Falls
  // back to the normal first-run UX if no driver exists yet.
  let bootHandled = false;
  try {
    const params = new URLSearchParams(window.location.search);
    const wantMode = params.get('mode');
    const wantContinue = params.get('continue');
    if (Profile.active() && wantMode && MODES.some(m => m.id === wantMode)) {
      if (wantMode === 'gauntlet') UI.showGauntlet();
      else startRun(wantMode);
      bootHandled = true;
    } else if (Profile.active() && wantContinue) {
      UI.showMenu();
      bootHandled = true;
    }
  } catch (_) {}
  if (!bootHandled) {
    if (Profile.list().length === 0) UI.showProfiles();
    else UI.showTitle();
  }
  requestAnimationFrame(frame);

  ['pointerdown','keydown','touchstart'].forEach(ev =>
    document.addEventListener(ev, ensureAudio, { once:false, passive:true })
  );
}
boot();

})();
