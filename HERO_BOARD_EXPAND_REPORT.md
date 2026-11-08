# Hero board expansion

## Result
Implemented ten hero-board rows, the full-field-count Full leaderboard button, and one in-place round panel with chips, ordered shared marks, complete-nine totals, selected-score underline and the existing full-scorecard target. Full leaderboard and the retained photo link receive the same handler. The leaderboard page and Also this week/round posts were not changed.

Ben's availability ruling: scored rounds initially enable chips and select the current/latest default; only the selected round is read, and a successful empty result disables that chip. No closed-row hole hook is invoked.

## Changed files
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`
- `src/features/tourhub/tournament-v2/sections/HeroRoundPanel.tsx` (new)
- `src/features/tourhub/tournament-v2/sections/heroRoundRules.ts` (new)
- `src/features/tourhub/tournament-v2/sections/heroRoundPanel.css` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
- `src/features/tourhub/components/overview-v3/HybridHero.tsx`
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
- `src/features/tourhub/components/overview-v3/useHeroFullBoard.ts` (new)
- `src/index.css` (semantic tokens)
- `src/test/heroBoardExpand.test.tsx` (15 new cases)
- `src/test/removeBoardHoleMarks.test.tsx`
- `src/test/tourOverviewScorecardTap.test.tsx`
- `roadmap.md`, this report and project memory.

Local ownership rules are documented in the new module headers, per AGENTS.md's module-local architecture rule. No SQL, migrations, server/RPC/edge changes, feed_config, round_pool_cap or native/Median changes.

## Authorized assertion ledger
No tests deleted; test counts in the two updated files remain 10 and 6.

- `removeBoardHoleMarks.test.tsx`, two parameterised cases: renamed `hero %s has one line, no marks/key or hole reads, and preserves sheet taps` to `hero %s stays single-line when closed and opens a lazy round panel`. Old: `expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'player-a')`. New: row `aria-expanded='true'`, panel `data-player-id='player-a'`, and no dialog. Reason: the brief replaces hero direct-sheet taps only; closed-row no-read and geometry assertions remain.
- `tourOverviewScorecardTap.test.tsx`, `opens the sheet for the tapped player and keeps analytics` renamed to `opens the tapped player panel and preserves the full-scorecard door`; suite renamed from direct scorecard to round panel. Old row selector `button[aria-haspopup="dialog"]`; new `button[data-hero-board-row]`. The existing target assertion `data-target='pb'` remains but is reached after clicking the new full-scorecard footer. Added row-expanded/no-dialog assertions. Reason: direct hero tap now opens the panel. Team and movement assertions unchanged.
- Production hero limit and `HERO_BOARD_ROWS`: 5 → 10. No existing count assertion needed updating. The old test fixture's explicit limit=5 is retained because it tests two supplied players, not the hero's production limit.

## Tests
Last reported full-suite baseline: **7,759**. Now **7,774 passed / 7,774 executed**, delta **+15**, entirely from the 15 cases in `heroBoardExpand.test.tsx`; no other case additions/deletions. Shard distribution shifts when the new test file is included.

Focused command: `bunx vitest run src/test/heroBoardExpand.test.tsx src/test/removeBoardHoleMarks.test.tsx src/test/tourOverviewScorecardTap.test.tsx src/test/tourHeroRefinements.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx --maxWorkers=2`: **59/59**.

Each shard ran in its own sequential command:
- `bunx vitest run --shard=1/4 --maxWorkers=2`: **2,007**, 170 files.
- `bunx vitest run --shard=2/4 --maxWorkers=2`: **1,867**, 170 files.
- `bunx vitest run --shard=3/4 --maxWorkers=2`: **1,994**, 170 files.
- `bunx vitest run --shard=4/4 --maxWorkers=2`: **1,906**, 169 files.

Zero failures; known FW1 failure did not appear. Logs: `docs/verification/hero-board-expand/shard1.log` through `shard4.log`.

## Screens
Actual MiniBoard, actual global/mark/panel stylesheets and seeded React Query cards at **320, 390, 430px**: ten rows, field-size button, one open row, all four chips on one line, ordered card and footer; no horizontal overflow or page errors. Switching R1 then back to R3 read back selected round 3. Screenshots:
- `/tmp/browser/hero-board-expand/open_320.png`
- `/tmp/browser/hero-board-expand/open_390.png`
- `/tmp/browser/hero-board-expand/open_430.png`

Double-square inner line is visible at 320. Fixture removed after checks. Frozen rows keep the existing columns/name truncation and original 20px gutters; panel/button use the signed-off 16px inset at 320 and 20px above that. This is deliberately not a restyle of the frozen board.

## Unverified/device checks
Authenticated end-to-end checks are unavailable (`external_unmanaged`). Fixtures prove layout and switching, not live provider data. Ben should check real live/completed hero default-round availability, live round updates, pre-tee direct scorecard, full-scorecard contents, and both Full board/Full leaderboard actions (live navigation and finished-event sheet). Shared handler wiring is implemented, but that navigation pair was not driven end-to-end in the live app. Latest preview verification is recorded separately by the build log.