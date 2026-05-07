# MOJAVE RUN

A wasteland arcade driver. Survive the Mojave.

Single-file HTML5 Canvas game. No build step. Pure vanilla JS.

## Controls

| Key | Action |
|---|---|
| `◄ ►` / `A D` | Steer |
| `Space` / `Z` / `X` | Fire |
| `R` / `Enter` | Restart |
| Tap | Start / restart (mobile) |

Mobile: on-screen pad bottom-left (steer), bottom-right (fire).

## Mechanics

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
- Netlify static deploy

## Local

```bash
# any static server works
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Auto-deploys to Netlify on push to `main`.

---

Built by 1Commerce LLC.
