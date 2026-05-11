# Game Racing Strategy Plan

## Objective
Build a practical strategy for improving retention, progression depth, and replayability in Mojave Run while keeping the current mobile-first, zero-build architecture intact.

## Product Goals
- Strengthen the core loop (drive → survive → earn scrap → upgrade → repeat).
- Increase session variety without sacrificing readability on small screens.
- Improve short-term motivation (daily/weekly) and long-term goals (prestige/collection mastery).
- Expand social competition using existing leaderboard and multiplayer foundations.

## Strategy Pillars

### 1) Core Driving Feel & Combat Rhythm
- Tune vehicle differentiation to make each purchase feel meaningful.
- Keep handling readable across touch, keyboard, and controller.
- Add mode-specific rhythm targets (aggressive, survival, precision).
- Preserve performance-first effects tuning for low-end devices.

### 2) Progression & Economy
- Calibrate scrap income versus upgrade costs for steady but non-trivial progress.
- Add milestone rewards tied to campaign, gauntlet, and event completion.
- Expand branching specialization identity so builds create distinct playstyles.
- Ensure no single farm path invalidates the rest of the mode ecosystem.

### 3) Mode Portfolio Growth
- Keep existing modes distinct with clear reward/identity boundaries.
- Introduce rotating mutators and event packs to refresh legacy modes.
- Position Daily Challenge and weekly objectives as consistent return hooks.
- Add small mode-specific challenge ladders before introducing major new modes.

### 4) Player Mastery & Accessibility
- Offer layered mastery: basic survival, optimization, advanced route/risk play.
- Improve onboarding cues for upgrades, perks, and objective reading.
- Maintain accessibility toggles (haptics, contrast, large targets, quality) as first-class features.
- Keep controller/touch parity so platform does not decide competitive viability.

### 5) Live-Ops & Social Loop
- Use seasonal themes and weekly definitions as predictable cadence anchors.
- Expand global/per-mode leaderboard stories (streaks, rank deltas, personal best context).
- Tie co-op ghost sessions to lightweight cooperative goals and bragging rights.
- Use account/cloud-save hooks to reinforce cross-device continuity.

## Execution Roadmap

### Phase 1: Baseline & Metrics Readiness
- Define key KPIs: D1/D7 return, avg run length, mode selection share, upgrade completion rate.
- Instrument profile and run-summary events required for KPI tracking.
- Capture economy snapshots by profile segment (new, mid, late).

### Phase 2: Balance & Progression Pass
- Rebalance vehicle unlock pacing and upgrade value clarity.
- Normalize reward scaling between Classic, Campaign, Gauntlet, and Daily.
- Add targeted progression milestones with visible in-game feedback.

### Phase 3: Retention Systems
- Expand weekly and seasonal objective pools with varied difficulty.
- Introduce recurring event windows that remix mutators and rewards.
- Add progression-safe catch-up mechanics for returning players.

### Phase 4: Social/Competitive Expansion
- Improve leaderboard UX for comparison and mode filtering.
- Add friend-room goal tracking for ghost multiplayer sessions.
- Roll out rank history snapshots and personal best timelines.

### Phase 5: Content Cadence
- Deliver periodic vehicle/build content in additive drops.
- Rotate biome-driven visual/event packs to maintain novelty.
- Refresh challenge sets on fixed cadence with light narrative framing.

## Delivery Guardrails
- Keep additions additive and backward-compatible with existing save/profile data.
- Prioritize deterministic behavior for seeded and daily content.
- Maintain offline-first viability for core gameplay loops.
- Preserve current performance envelope on mobile browsers.

## Risks & Mitigations
- **Risk:** Progression inflation makes upgrades feel mandatory grind.  
  **Mitigation:** Enforce target time-to-unlock bands and monitor economy telemetry.
- **Risk:** Feature sprawl weakens mode identity.  
  **Mitigation:** Require each new system to map to one primary mode purpose.
- **Risk:** Social features outpace anti-cheat/validation rigor.  
  **Mitigation:** Gate high-trust rankings behind stronger server-side verification.

## Definition of Success
- Higher repeat play frequency and longer engagement windows.
- Broader mode adoption rather than concentration in a single farm mode.
- Increased late-game progression completion and seasonal participation.
- Improved leaderboard participation and multiplayer room activity.
