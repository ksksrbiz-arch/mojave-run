# MOJAVE RUN

A mobile-first wasteland arcade driver. Survive the Mojave, earn scrap, upgrade your rig, and push deeper into the road war.

🎮 **Live:** https://mojave-run.netlify.app
🛰️ **Relay/API:** https://mojave-run-lw3g.onrender.com

Version: **3.0.1**

## Features

- **Driver profiles** — up to 6 named drivers per device with local persistence and optional cloud save/restore.
- **18 vehicles** — base garage rigs, mastery/prestige rewards, Wasteland Empire vehicles, and Storm Frontier vehicles.
- **Garage progression** — 4 upgrade tracks × 5 tiers, per-vehicle specialization branches, cosmetics, weapon specializations, and crafting mods.
- **13 modes** — Classic, Winding Run, Campaign, Gauntlet, Time Attack, Daily Challenge, Boss Rush, Zombie Wasteland, Iron Throne, Wasteland Run, Extraction, Custom Run, and Versus.
- **36-location campaign** — original coast-to-coast route plus epilogue locations with story, bosses, sidekicks, and unlocks.
- **18-sector Gauntlet + boss horde levels** — survive, elimination, distance, and boss objectives across multiple biome maps.
- **Iron Throne** — 8-stage mastery boss campaign with unique boss cars and weapon patterns.
- **Expanded biomes** — Wastes, Salt Flats, Ash Fields, Red Canyon, Midnight Rift, Neon Ruins, Irradiated Zone, Scrap Archipelago, Thunder Plains, and Frostwaste.
- **Zombie Wasteland** — wave survival with special infected, survivor rescues, zombie-only powerups, and boss zombies.
- **Wasteland Run** — roguelite seeded runs with rotating mutators and local seed leaderboards.
- **Platform hub** — prestige/New Game+, seasons, weekly challenges, crafting, level editor, rivals, replays, clan tags, photo mode, cloud operations, and native-service hooks.
- **Multiplayer relay** — room-based ghost co-op presence, shared events/revive messages, global/per-mode scoreboards, and an authoritative Versus mode through the Node relay.
- **Experimental split-screen** — controller input preview is available in the Platform hub; full shared local co-op gameplay is not yet final.
- **Offline-first PWA** — service worker caches the game for repeat loads and offline play.

## Controls

**Touch:** drag to steer · hold to fire · tap pause/fullscreen icons
**Keyboard:** `◄ ►` / `A D` steer · `Space` / `Z` / `X` fire · `R` restart · `P` pause · `F` fullscreen
**Controller:** left stick / D-pad steer · `A` fire · `B` special · `Start` pause

## Vehicles

| Group | Vehicles |
| --- | --- |
| Base garage | Rust Bucket, Junker, Roadrunner, Goliath, Phantom, Sand Viper, Ironclad |
| Mastery / prestige | Warlord King, Cemetery Tank, Apex Warlord |
| Wasteland Empire | Vortex Hover, Blood Raven Bomber, Iron Titan, Spectre Stealth, Doom Hauler, Neon Phantom |
| Storm Frontier | Storm Reaver, Grave Warden, Sun Lancer |

## Modes

- **Classic** — endless survival with escalating difficulty.
- **Winding Run** — procedural winding highway with faster rhythm.
- **Campaign** — 36 US road-trip locations with story progression.
- **Gauntlet** — 18 objective sectors plus horde challenges.
- **Time Attack** — 60-second score frenzy.
- **Daily Challenge** — deterministic daily seed and shareable score.
- **Boss Rush** — five boss tiers back-to-back.
- **Zombie Wasteland** — special infected, survivor rescues, zombie tools.
- **Iron Throne** — mastery-only 8-stage boss campaign.
- **Wasteland Run** — roguelite mutator mode unlocked after campaign completion.
- **Extraction** — convoy escort survival to an evac marker.
- **Custom Run** — play a share-code level from the in-browser editor.
- **Versus** — server-authoritative 1v1 via the relay.

## Mobile-first stack

- HTML5 Canvas game with DOM menus and mobile tap targets.
- Pointer Events for mouse/touch/stylus input.
- iOS safe-area-inset support, touch-action locking, viewport-fit cover.
- Wake Lock, visibility pause, fullscreen, and portrait orientation support.
- PWA manifest, SVG icon, and offline service worker cache.
- Adaptive render scale and quality governor for mobile/desktop performance.
- Vanilla JavaScript, synthesized WebAudio SFX, localStorage persistence, and no client build step.

## Local play

Static single-player/PWA testing:

```bash
python3 -m http.server 8000  # → http://localhost:8000
```

Full relay/API testing:

```bash
npm install
npm start                    # → http://localhost:8787
```

## Multiplayer relay and API

`server.js` serves the static game, relays WebSocket rooms, runs authoritative Versus matches, and exposes:

- `GET /healthz`
- `GET /api/scores?mode=...`
- `GET /api/leaderboards`
- `POST /api/scores`
- `POST /api/accounts/register`
- `POST /api/accounts/save`
- `GET /api/accounts/load?id=&token=`
- `POST /api/push/register`
- `POST /api/iap/validate`

The public Netlify frontend is static-only, so it points to the Render relay via `index.html`:

```html
<meta name="mp-server-url" content="wss://mojave-run-lw3g.onrender.com/ws" />
<script>window.RENDER_API = 'https://mojave-run-lw3g.onrender.com';</script>
```

Configs included in this repo:

- **Render** — `render.yaml`, health check at `/healthz`.
- **Fly.io** — `Dockerfile` + `fly.toml`.
- **Railway** — `railway.json`.
- **Any container host** — `docker build -t mojave-run . && docker run -p 8787:8787 mojave-run`.

## Native/mobile service notes

Push notifications and IAP hooks are implemented for native Capacitor builds, but require the appropriate platform plugins and production Apple/Google credentials at runtime. Web builds show these as unavailable unless running in a native shell.

## Deploy health check

From a network with DNS/internet access, verify:

```bash
curl -I https://mojave-run.netlify.app/
curl https://mojave-run-lw3g.onrender.com/healthz
```

This sandbox could not resolve those public hostnames during the 2026-05-11 audit, so live deploy health must be confirmed from an external network.

---

Built by 1Commerce LLC.
