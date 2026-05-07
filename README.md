# MOJAVE RUN

A wasteland arcade driver. Survive the Mojave.

🎮 **Live:** https://mojave-run.netlify.app

Mobile-first browser game. Zero deps, zero build, zero backend. Single-page app, ~80KB JS.

## Features

- **Driver profiles** — up to 6 named drivers per device, persistent locally
- **5 vehicles** — Rust Bucket / Junker / Roadrunner / Goliath / Phantom — each with unique stats
- **3 upgrade tracks × 5 tiers** — Engine, Plating, Weapons; per-vehicle progression
- **3 modes** — Classic (endless), Gauntlet (12 tiered sectors with 3 bosses), Time Attack (60s frenzy)
- **12-level Gauntlet** — survive / kill / distance / boss objectives; bosses every 4 levels
- **3 boss tiers** — Alpha Raider, Twin Demons, The Overlord — each with unique attack patterns and enrage at 30% HP
- **Day / night / sandstorm** — late levels feature night sky with stars + headlight cones, or sandstorm streaks
- **Currency loop** — earn SCRAP from runs (10% of score + boss bonuses), spend on vehicles & upgrades
- **Stats screen** — lifetime tracking per driver

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

Upgrades stack multiplicatively: +60% accel/speed at engine T5, +100% HP at plating T5, -40% fire delay at weapons T5.

## Mobile-first stack

- HTML5 Canvas (game) + DOM screens (menus) — proper tap targets
- Pointer Events for unified mouse/touch/stylus input
- iOS safe-area-inset support, touch-action: none, viewport-fit cover
- Wake Lock API + visibility-change pause
- Fullscreen API + portrait orientation lock
- PWA manifest + SVG icon — installable to home screen
- DPR cap 1.5 + reduced particle counts on mobile

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

## Future (not built)

- **Cloud sync** via Supabase — would need a 3rd Supabase project (currently capped at 2: Cathy + PrecisionCore). Local-first profiles cover 95% of perceived value at 5% complexity.
- **Global leaderboard** — depends on cloud sync.
- **Versus / shared simulation multiplayer** — would need server-authoritative state. Current MP is cosmetic ghost overlay.
- **More vehicles / cosmetics / weapons** — open ended.

---

Built by 1Commerce LLC.
