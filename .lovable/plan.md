## Blocker before I build

The brief tells me to compose `HybridHero` as `PhotoBand → HeroWireTicker`, with `MiddleBand` and `LeaderboardBand` removed from the composition. But the current `HybridHero.tsx` doesn't render the three-band path for live/results/upcoming — it routes those states to `CinematicHeroFullBleed` (a 1,243-line full-bleed hero that owns title, eyebrow, venue, insight, moment row, dots, and even leaderboard rows). The three-band path only fires for the `cancelled` variant today.

The brief says "CinematicFrame/CinematicHeroFullBleed — if the current design uses them for specific slides, they keep doing so." Read literally against the current code, that means "keep doing so for all three primary states", which conflicts with "compose PhotoBand + HeroWireTicker" and the demo reference (which is a PhotoBand+ticker layout).

**Please confirm one of these two intents before I build:**

**A) Retire CinematicHeroFullBleed for live/results/upcoming.** The new `PhotoBand` (reworked per demo) + `HeroWireTicker` becomes the hero for all non-cancelled states. `CinematicHeroFullBleed` stops being reached by `HybridHero` (I'll leave the file in place and report it as dead-code for the sweep). This matches the demo reference and the "MiddleBand + LeaderboardBand out, HeroWireTicker in" file-composition line.

**B) Keep CinematicHeroFullBleed as-is for those states.** Then this brief only rewires the `cancelled` path (the sole three-band consumer), which nobody looks at, and the ticker never actually reaches the tour overview. I don't think this is what you want.

Assuming **A** (most consistent reading), here's the plan:

## Plan (assuming A)

### Part 1 — Extract `TickerShell`
- New: `src/components/shared/wire/TickerShell.tsx` — presentation-only marquee shell (chip, 36px row, gap 24, marquee keyframes with per-instance duration var, pause-on-touch/hover, prefers-reduced-motion → native horizontal scroll, static-when-fits detection via `ResizeObserver` on track vs viewport).
- Refactor `src/components/explore-tab-new/WireTicker.tsx` to render `<TickerShell>` with its existing chip/rows. Preserve the exact `#15171F` background, height 36, gap 24, chip colors, and `almanac-ticker-*` cadence. Screenshot compare in ship report.

### Part 2 — `HeroWireTicker`
- New: `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroWireTicker.tsx`.
- Reuses `TickerShell` with `background = "#15171F"` (same constant, extracted to `shared/wire/tokens.ts` so both consumers import it), `dividerTop`.
- Data:
  - `results` / `live`: `safeLeaderboard.filter(r => r.position != null && r.position <= 10)` — full tie inclusion, no slice. `T{n}` label when `position_tied` (or derived duplicate-position). Reuse `getScoreColor` from `_shared/scoreColor` on dark theme.
  - `live`: append `THRU {thru}` per row when `r.thru != null` and round incomplete.
  - `upcoming`: rows from `useAIPredictions(tournament.id).topContenders`, sorted by `worldRanking` asc, right slot shows `OWGR {n}` muted. Zero new fetch — reuse the query-cache key already used by TI section. No predictions → return `null` (band absent).
- Chip variants: `TOP 10` (red), `LIVE` (red bg + white pulsing dot — reuse existing `hybrid-live-pulse` class), `THE FIELD` (amber).
- Team events: team rows (name + score, optional crest), same `<=10` rule.

### Part 3 — `PhotoBand` content rework
Rebuild the lower-third stack per demo. Bottom-anchored (`left/right/bottom 16`):
1. Eyebrow (10.5/800/ls1.2) — state-driven (`🏆 FINAL · TOUR`, `LIVE · TOUR` with pulse dot, `UPCOMING · TOUR`) + optional gold `MAJOR` chip.
2. Title — 38/800/-1.1 uppercase, 2-line clamp, verified against `ISPS HANDA WOMEN'S SCOTTISH OPEN`.
3. Venue line — 13/600, state-specific suffix (`Final round complete` / `Round {n} in play` / `{date range}`).
4. Insight — 13.5/500, `courseAnalysis.insight` from `useAIPredictions`, 2-line clamp, omitted when empty.
5. Moment row — champion (gold ring, `★ CHAMPION`, score + `Won by {margin}`) / leader (plain ring, `LEADER` or `TIED LEAD · n`, score + `THRU`) / defender + countdown (`D:H:M` clusters, or far-variant start-date).
6. Dots + `TOURNAMENT ›` row moved inside PhotoBand.

Preserves the current `PhotoBand` height contract (no new height token). All avatars via existing `PlayerAvatar` (PGA-first candidates untouched).

### Part 4 — `HybridHero` composition
- Route `live | results | upcoming` (non-cancelled) to `PhotoBand → HeroWireTicker`.
- `cancelled` → keep existing three-band path (restyled cancelled message only).
- Keep untouched: `useHeroCarouselData`, `useTournamentPulse`, `useTourLeaderboard`, `useAIPredictions`, carousel dots, `onSelectTour`, tournament link.
- Grep `MiddleBand` / `LeaderboardBand` importers post-change; if zero, report for dead-code sweep (don't delete tonight).

### Part 5 — i18n
Add to `public/locales/en/tourhub.json` under `hero.*`:
`finalRoundComplete`, `roundInPlay` (with `{{n}}`), `leader`, `tiedLead` (with `{{n}}`), `champion`, `defends`, `top10`, `live`, `theField`, `wonBy` (with `{{margin}}`).

### Ship report contents
- Side-by-side screenshot: courses Discover wire before/after `TickerShell` refactor.
- Slide-by-slide capture: results (with ties — verify against The Open if data present), live (chip pulse + THRU), upcoming (predictions → THE FIELD; no predictions → no band), team event, cancelled.
- Network diff: zero added requests on overview mount.
- `CinematicHeroFullBleed` / `MiddleBand` / `LeaderboardBand` importer counts post-change.
- `tsc` output.

## Reply with **A** or **B**, or amend, and I'll ship.
