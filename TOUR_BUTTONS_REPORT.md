# Tour buttons close-out

## Verification
- Previous full-suite baseline: 7,810. Prior-turn reported shards: 2,008 / 1,876 / 2,001; their raw runner logs are unavailable in this sandbox.
- Fresh final command: `bunx vitest run --shard=4/4 --maxWorkers=2`: 1,931 passed, zero failures (170 files).
- Combined reported total: **7,816**. Difference from 7,810: +9 cases in `overviewTourButtons.test.tsx`, -3 net cases in the authorized Full-board replacement tests in `tourOverviewPicksChipsFullBoard.test.tsx`. The previous message incorrectly called the new file eight tests; it contains nine.
- Previous focused result reported: 64/64. No production or test code changed during this close-out.
- Actual PhotoBand + RailChips fixtures with real stylesheets at 320/390/430: 350px live photograph, 14px chip top padding, selected Korn Ferry reachable by scrolling, no viewport overflow or browser errors. Screenshots: `/tmp/browser/tour-buttons/buttons_320.png`, `_390.png`, `_430.png`.
- This verifies the component fixture, not authenticated live carousel data or native swipe/island behavior; those remain device checks.

## Prior build assertion ledger (reported previously)
- `overviewHeroBStrip`: Full-board presence `not.toBeNull()` → `toBeNull()`.
- `tourOverviewMergedAiry`: nested Full-board click/keyboard isolation case → tournament-door click/keyboard case plus Full-board absence.
- `tourOverviewPicksChipsFullBoard`: former link presence/opening tests → absence and sheet-not-mounted cases; net -3 tests. Existing first-tee intent retained as absence cases.
- `tourChampionAvatarCandidates`: mounted HybridHero champion → mounted OverviewChampionBlock champion (extracted below chips).
- No tests deleted in this close-out. These historical changes are described from the previous build report; exact historical command logs are not independently available here.