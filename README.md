# MOJAVE RUN

A wasteland arcade driver. Survive the Mojave.

**Mobile-first. Plays in any browser.** Single-file HTML5 Canvas, zero deps, zero build.

🎮 **Live:** https://mojave-run.netlify.app

## Controls

**Touch (mobile/tablet):**
- Drag anywhere to steer (truck follows your finger)
- Hold to auto-fire
- Tap the title mode panel to switch Solo / Co-op / PvP
- Co-op / PvP: left half controls P1, right half controls P2
- Tap to start / restart / unpause

**Keyboard (desktop):**
| Key | Action |
|---|---|
| `M` / `C` or `1` `2` `3` | Switch Solo / Co-op / PvP on title |
| `◄ ►` / `A D` | Solo steer |
| `Space` / `Z` / `X` | Solo fire |
| `A D` + `Space` | P1 steer/fire in Co-op and PvP |
| `◄ ►` + `Enter` / `Shift` / `/` | P2 steer/fire in Co-op and PvP |
| `R` / `Enter` | Restart |
| `P` | Pause |
| `F` | Toggle fullscreen |

## Mobile-first features

- Drag-to-steer + hold-to-fire (no virtual buttons)
- Multi-touch via Pointer Events (mouse + touch + stylus unified)
- iOS safe-area-inset support (notch + home indicator)
- `touch-action: none` — kills pinch/zoom/scroll/pull-to-refresh
- Wake Lock API — screen stays on while playing
- Auto-pause on tab switch / app background
- Adaptive road width (wider on narrow screens)
- DPR cap at 1.5 + reduced particle counts on mobile for perf
- PWA manifest + SVG icon — installable to home screen
- Fullscreen toggle with portrait orientation lock
- Apple touch icon, theme-color, status-bar styling

## Mechanics

- **Solo Run** — classic one-truck survival.
- **Co-op Convoy** — two local trucks share the run and score; the run ends when both are wrecked.
- **PvP Duel** — two local trucks fight each other while the wasteland keeps spawning hazards; last truck rolling wins.
- **Scrap (gold diamond)** — +75 score
- **Repair (green cross)** — +30 hull
- **Wrecked car** — 35 dmg on contact
- **Barrel** — 18 dmg on contact, **shoot to chain-explode** for splash
- **Raider buggy** — 2 hp, fires at you, 40 dmg on ram, drops scrap on kill
- **Sector** — difficulty tier, ramps every 1500m

Best score persists in `localStorage`.

## Stack

- Vanilla JS + HTML5 Canvas
- WebAudio synthesized SFX (no asset files)
- Pointer Events for unified input
- Local same-screen multiplayer with split touch zones
- Wake Lock API
- Fullscreen API + Screen Orientation API
- PWA (manifest + apple-touch-icon)
- Netlify static deploy

## Local

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Manual deploy used for v1. To wire CI:
Netlify admin → Site config → Build & deploy → Link repository → `ksksrbiz-arch/mojave-run`

---

Built by 1Commerce LLC.
