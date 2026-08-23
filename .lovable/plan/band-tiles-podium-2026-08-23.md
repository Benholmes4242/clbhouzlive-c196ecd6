# Band Tiles Podium

## Goal
Replace the four Discover leader ladders with equal-height podium cards while preserving all current qualification floors, winners, member deduplication, data sources, and scorecard navigation.

## Implementation

### 1. Record the metal meaning
- Extend the Discover token documentation so gold explicitly means “best/top” across BEST THIS WEEK and hole-score gold, while platinum means “rarest” on the Honours Board.
- Record that BEST THIS WEEK’s entire figure line remains gold even when the winning round is over par; this is intentional, not a score-color override to correct later.

### 2. Build one reusable podium grammar
- Replace the current three-row ladder markup in `GolfThisWeek.tsx` with a shared podium renderer driven by tile configuration.
- Keep the eyebrow row with emoji/label and optional right-aligned unit.
- Render a 40px leader avatar with a 3.5px accent ring, 34px figure, and member name beneath.
- Add the leader-to-second gap chip only when second place exists; render ties neutrally.
- Add a full-width hairline and up to two compact chaser rows with rank, 16px avatar, name, figure, and signed deficit.
- Keep `flex: 1 0 230px`, 9px rail gap, radius 8, no progress bars, and no reserved internal rows for sparse tiles.

### 3. Apply the four semantic accents
- BEST THIS WEEK: shared gold token for gross, to-par, avatar ring, and clear chip—including an over-par winner.
- BEST STABLEFORD: white figure/ring and low-alpha white chip.
- MOST BIRDIES: canonical dark under-par red.
- MOST IMPROVED: canonical improved-index green.
- Preserve amber exclusively for the viewing member’s name; add no “YOU” chip.

### 4. Compute margins from one direction flag
- Give every tile one `lowerWins` flag and one numeric value accessor.
- Compute the leader gap and each chaser deficit from those shared inputs instead of category-specific branches.
- For MOST IMPROVED, compare improvement magnitude so a leader at −0.4 beats a chaser at −0.2; the chaser displays `−0.2`, meaning 0.2 behind rather than ahead.

### 5. Localize the gap chip
- Add complete i18next keys in all six course locales for:
  - singular/plural shot clear
  - singular/plural point clear
  - generic clear
  - tied
- Pass `count` through i18next plural resolution; do not concatenate localized fragments.

### 6. Resync the loading shell
- Rebuild the leader-band portion of `DiscoverCourseLedSkeleton.tsx` as three equal podium shells: eyebrow, leader block, gap chip, hairline, and two compact chaser rows.
- Match the measured settled height of the tallest live tile.

## Verification and report
- Run focused tests/type validation supplied by the project harness.
- Use the live Discover page to measure each rendered tile and its skeleton model.
- Capture an equal-height rail screenshot containing a one-qualifier tile; if the empty area exceeds roughly one-third of the card, stop and report before shipping.
- Click a leader and a chaser and verify each interaction opens exactly one scorecard sheet.
- Report the MOST IMPROVED sign proof, all six locales’ strings and plural forms, measured live/skeleton heights, interaction result, screenshot path, and any incorrect assumption found in the brief.
