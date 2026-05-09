# MOJAVE RUN

A wasteland arcade driver. Survive the Mojave.

🎮 **Live:** https://mojave-run.netlify.app

Mobile-first browser game. Zero build for the client, with an optional Node relay for multiplayer ghost co-op.

## Features

- **Driver profiles** — up to 6 named drivers per device, persistent locally
- **7 vehicles** — Rust Bucket / Junker / Roadrunner / Goliath / Phantom / Sand Viper / Ironclad — each with unique stats
- **4 upgrade tracks × 5 tiers + specialization branches** — Engine, Plating, Weapons, Reactor plus unlockable per-vehicle build branches
- **7 modes** — Classic (endless), Campaign (18-location story road trip), Gauntlet (18 tiered sectors with 5 bosses), Time Attack (60s frenzy), **Daily Challenge** (seeded run, same world for everyone, shareable score), Boss Rush (5 chained bosses), Zombie Horde
- **18-level Gauntlet** — survive / kill / distance / boss objectives across multiple biome maps
- **5 boss tiers** — Alpha Raider, Twin Demons, The Overlord, Warlord Titan, The Chimera — each with unique attack patterns and enrage at 30% HP
- **Biome map themes** — Wastes, Salt Flats, Ash Fields, Red Canyon, Midnight Rift with distinct visual palettes
- **Driver perks** — each character now has active gameplay bonuses (scrap, vision, or kill-score boosts)
- **Day / night / sandstorm** — late levels feature night sky with stars + boosted headlight cones, or sandstorm streaks
- **Currency loop** — earn SCRAP from runs (10% of score + boss bonuses), spend on vehicles & upgrades
- **Stats screen** — lifetime tracking per driver
- **Dynamic run events** — raider ambushes, scrap convoys, hazard fields, rotating mutators, elite enemies
- **Expanded item pool** — shield / triple / rapid / nitro / magnet / x2 plus overdrive / salvage / pulse / supply caches
- **Settings panel** — master/SFX volume, screen-shake intensity, particle density, haptics toggle, large touch targets, graphics quality, auto-fire, damage numbers, HUD contrast
- **In-game pause menu** — resume / restart / settings / quit, with full DOM tap targets
- **Offline-first PWA** — service worker caches the game so it loads instantly and plays without a network

## Controls

**Touch:** drag to steer · hold to fire · tap pause/fullscreen icons

**Keyboard:** `◄ ►` / `A D` steer · `Space` / `Z` / `X` fire · `R` restart · `P` pause · `F` fullscreen

## Vehicles

| Vehicle    | HP  | Top Speed | Accel | Fire Rate | Damage | Cost |
|------------|-----|-----------|-------|-----------|--------|------|
| Rust Bucket| 100 | 460       | 1800  | 0.18s     | 1×2    | FREE |
| Junker     | 160 | 380       | 1400  | 0.22s     | 1×2    | 500  |
| Roadrunner | 70  | 580       | 2400  | 0.14s     | 1×2    | 1200 |
| Goliath    | 200 | 360       | 1200  | 0.32s     | 3×1    | 2500 |
| Phantom    | 60  | 520       | 2000  | 0.10s     | 1×4    | 4500 |
| Sand Viper | 85  | 640       | 2700  | 0.12s     | 1×3    | 6200 |
| Ironclad   | 260 | 340       | 1250  | 0.34s     | 4×2    | 8800 |

Upgrades stack multiplicatively: +60% accel/speed at engine T5, +100% HP at plating T5, -40% fire delay at weapons T5, +52% shot damage at reactor T5.

## Mobile-first stack

- HTML5 Canvas (game) + DOM screens (menus) — proper tap targets
- Pointer Events for unified mouse/touch/stylus input
- iOS safe-area-inset support, touch-action: none, viewport-fit cover
- Wake Lock API + visibility-change pause
- Fullscreen API + portrait orientation lock
- PWA manifest + SVG icon — installable to home screen
- Adaptive canvas render scale + quality governor for smoother Android/iPhone/iPad/desktop play

## Stack

Vanilla JS + HTML5 Canvas. Synthesized WebAudio SFX. localStorage persistence. Netlify static deploy.

## Local (single-player only)

```bash
python3 -m http.server 8000  # → http://localhost:8000
```

## Multiplayer (co-op ghost run)

Host a Node.js server that serves the game **and** relays player positions
between everyone in the same room. Each player sees other players as
translucent "ghost" cars on their own road, plus a shared scoreboard.
Gameplay itself stays per-player — no shared simulation, no lag spikes.

```bash
npm install      # one-time, installs `ws`
npm start        # → http://localhost:8787
```

Then in the browser:

1. Open the served URL on every device.
2. Tap **MULTIPLAYER** on the menu.
3. Pick a room code (e.g. `FRIENDS`) and tap **JOIN ROOM**.
4. Tap **◄ BACK → ▶ PLAY** and start any mode. Ghosts appear automatically.

### Joining from anywhere (not just LAN)

The simplest cross-internet path is a Cloudflare quick tunnel — no account, no
config, no port forwarding:

```bash
# in a second terminal, while `npm start` runs
cloudflared tunnel --url http://localhost:8787
```

Cloudflare prints a public `https://*.trycloudflare.com` URL. Share it with
friends; they open it in any browser, the page loads from your machine, and
the multiplayer WebSocket connects to the same host automatically. Works on
phones, Chromebooks, anywhere.

For LAN play (same WiFi) you can skip the tunnel and just share
`http://<your-lan-ip>:8787`.

### Deploying the relay so the public Netlify site can use it

The Netlify deploy is **static-only** — it cannot run `server.js`, so the
client cannot connect to `wss://mojave-run.netlify.app/ws` (there is no
server there). Host `server.js` separately on any Node container host, then
point the static site at it via the `mp-server-url` `<meta>` tag in
`index.html`.

Configs included in this repo:

- **Render** — push to GitHub, then *New + → Blueprint* and pick the repo.
  `render.yaml` is wired up; health check hits `/healthz`.
- **Fly.io** — `fly launch --copy-config --no-deploy` then `fly deploy`.
  Uses the included `Dockerfile` and `fly.toml`.
- **Railway** — `railway up` from the repo root. `railway.json` configures
  the start command + health check.
- **Any container host** — `docker build -t mojave-run . && docker run -p 8787:8787 mojave-run`.

Once deployed, copy the public URL (e.g. `https://mojave-run.onrender.com`)
and edit `index.html`:

```html
<meta name="mp-server-url" content="wss://mojave-run.onrender.com/ws" />
```

Redeploy Netlify. The multiplayer screen now pre-fills with the right URL
and connects automatically. (Players can still override the field
manually — handy for self-hosting on LAN.)

## Future (not built)

- **Cloud sync** via Supabase — would need a 3rd Supabase project (currently capped at 2: Cathy + PrecisionCore). Local-first profiles cover 95% of perceived value at 5% complexity.
- **Global leaderboard** — depends on cloud sync.
- **Versus / shared simulation multiplayer** — would need server-authoritative state. Current MP is cosmetic ghost overlay.
- **More vehicles / cosmetics / weapons** — open ended.

---

Built by 1Commerce LLC.
