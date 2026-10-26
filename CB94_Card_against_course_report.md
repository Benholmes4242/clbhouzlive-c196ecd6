# CB94 — Card against course

## Diff summary
- `src/features/business/clubAnalytics/sections.tsx`: IndexDisagreesSection no longer renders the crossing-lines SiLadder chart. It calls the unchanged buildSiLadder once and renders only flagged rows, shotsFloor and rounds. Harder/easier groups are rank-ordered and omit empty groups. Singular/plural group grammar and title counts through nine/from ten follow the brief. Shots use the shared two-decimal signed formatter, neutral ink/muted ink, never red or green. Null helper results render nothing; eligible no-flags results show the agreement state. Card reuses HIP paint and geometry.
- Import wiring removes the club-only SiLadder import and adds shared SI_PLACES_GATE, number/ordinal helpers and signed formatter. No shared chart/helper or other section output changed.
- Added `src/test/cb94CardAgainstCourse.test.tsx`: eight new cases. No existing tests retargeted, rewritten, renamed or deleted. Audit found no club chart/legend assertions needing retargeting.
- Roadmap and requirement memory updated; local header documents club-only presentation ownership. No new architecture module.

## Test results and reconciliation
- `bunx vitest run src/test/cb94CardAgainstCourse.test.tsx src/test/cb93HoleByHole.test.tsx src/test/cb92HowItPlays.test.tsx src/test/cb91CoursesTop.test.tsx`: **39 passed**, four files.
- `bunx vitest run`: **3,208 passed**, **373 files**, zero failures. Previous reported baseline **3,200 / 372** plus exactly **eight new cases / one new file** in cb94CardAgainstCourse.test.tsx. No pre-existing failures observed.
- Automatic preview build: **build OK**, 2026-10-26T14:16:51Z. No separate manual typecheck under environment policy.

## Verification scope
- The supplied Sundridge four-row result (+0.40/+0.12/−0.12/−0.17, floor0.07) is tested as a stubbed helper result, explicitly not a live input fixture. No reusable Sundridge input fixture was found. Real helper agreement at100 and absence at99 are tested without stubs. Flagging logic is not copied or changed.
- Controlled real component at438×970: four flagged rows in harder/easier groups, agreement, and under100 absence verified; screenshots reviewed and no card overflow. The browser's illustrative raw inputs produce different shot figures/floor; they are not claimed as live Sundridge data and were not added to production.
- No direct course-detail SiLadder chart tests were found by audit. Its source/helper and production consumers remain untouched, and all existing tests pass; authenticated course-detail chart rendering was not verified.
- Live authenticated course readback unavailable for externally managed authentication. No live-data validation claim.

## Protected scope
CB91–CB93 and all other sections unchanged. No SQL, migrations or migration files, deployed RPC/edge edits, feed_config edits, round_pool_cap changes (30 retained), or native/Median changes.