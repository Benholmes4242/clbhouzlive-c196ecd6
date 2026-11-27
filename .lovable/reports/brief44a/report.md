# Brief 44A — Live chart end labels fit

## Files changed
- `src/features/tourhub/tournament-v2/data/raceChartEdge.ts` (new): `measureRaceLabel` (canvas measureText at 10.5px, 700 leader/champion, 600 others; 6.4px/char fallback) and `raceEdge` = clamp(350 − 8 − widest, 190, 262).
- `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx` (RaceSection): round x positions (and so START/R labels, polylines, end dots) and grid `x2` use the edge; labels at edge + 8. Text, colours, sizes and `labelPositions` unchanged.

Note: the brief says "same as before (262)" for short labels, so the edge is capped at 262 — short names never move.

## Tests
- Added `src/test/brief44aRaceLabels.test.ts` (3): long label fits ≤350 with edge <262; "Smith −9" edge = 262; edge never <190.
- Rewritten tests: none — no existing test asserted the fixed 262/270 positions.
- Four sequential shards: 2,591 + 2,553 + 2,712 + 2,889 = **10,745 tests / 946 files**, zero failures. Baseline Brief 44: 10,742 / 945. Delta +3 / +1 = the new file.

## Screenshots (temporary harness, test data; removed afterwards)
- `390_race_chart.png`: edge 226.04; "Von Dellingshausen −13" right 366 vs svg right 370.
- `320_race_chart.png`: label right 297 vs svg right 300.

No SQL, no migrations, feed_config untouched, round_pool_cap 30, no security "Fix all".
