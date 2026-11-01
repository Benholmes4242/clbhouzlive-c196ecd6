# Also this week — stopped validation

## Implemented
- Event rows, calculated state sentences, chase, top-three/tie board, followed-player rows, finished winner block, starting facts/draw facepile.
- User ruling: completed slides ended within three days are eligible. Added concrete two-day eligible/four-day excluded tests. Existing live/upcoming filter, carousel order, viewed-event exclusion and four-event cap retained.
- Shared `todayFromEntry`, newly exported `fmtThru`, `leaderSummary`, `boardTieRole`, BoardTable's bracket CSS, `getScoreColor` and canonical avatar candidates. Hero unchanged.
- One `sr_leaderboards` request for all section IDs, one optional round-one tee-times request for upcoming IDs, cached `useTourPlayerFollows`.
- World Rankings negative movement uses `var(--tour-board-dim)` (rgba(248,250,252,.42)); positive movement retains TREND_UP. Updated ownership comment. No existing assertions changed.

## Stop: exact errors
1. Automatic typecheck:
```text
src/test/alsoWeekRebuild.test.tsx(14,133): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.
```
This is the newly added i18next provider fixture. No correction applied after completed-edit stop.

2. Full-suite shard 1:
```text
FAIL src/test/islandsNav.test.tsx > IndexGlance > shows the move, sparkline and stats once data settles
AssertionError: expected 'Your handicap index12.4▾ 0.2 on 30 Oc…' to contain '▾ 0.2 this month'
Expected: "▾ 0.2 this month"
Received: "Your handicap index12.4▾ 0.2 on 30 Oct3 rounds agoNow12.2Low index73Last round+1vs parOpen your handicap"
src/test/islandsNav.test.tsx:190:32
```
Unrelated to changed Tour files: fixture `iso(2)` is now 30 October, whereas today is 1 November. Its assertion assumes those two dates share a calendar month. This test/component was not modified. It was passing at the previous 5,004 baseline; a pre-existing failure at that run is not claimed.

## Tests and counts
- `bunx vitest run src/test/alsoWeekRebuild.test.tsx src/test/alsoWeekReads.test.ts src/test/tourOverviewDesignA.test.ts src/test/tourOverviewMovementColumn.test.ts`: 100/100, four files.
- `bunx vitest run --shard=1/2`: 2,447 passed + 1 failed = 2,448 executed; 251 passed + 1 failed file.
- `bunx vitest run --shard=2/2`: 2,591/2,591; 252 files.
- Full total: **5,038 passed / 1 failed / 5,039 executed across 504 files**.
- Baseline **5,004/502**; delta **+35 tests/+2 files**, solely `alsoWeekRebuild.test.tsx` (+32) and `alsoWeekReads.test.ts` (+3).
- No test deleted, renamed or rewritten. No old/new assertions to quote.

## Data authority and caveats
- Hero totalRounds comes from `deriveHeroState` → `roundsFromSchedule`: inclusive start/end calendar days, fallback four. This section only accepts valid 2–4-day schedules; unknown schedules omit OF total and holes-left figures instead of printing the hero fallback as fact. No new provider call.
- Refresh 60 seconds follows the shared tournaments-cache cadence. Hero carousel itself has focus refresh but no interval; cache polling does not automatically invalidate its static ready key. No unrelated hero change was made.
- Pre-round field comes from deduplicated players in the published round-one draw, not formatted hero tee groups or invented counts. Absent draw omits FIELD and followed-player line.
- Playoff winner uses hero winner sr_id matching a tied-score board entry, the established tournament-contest inference; no new winner view read.
- System font retained instead of frozen-out mock Geist. Canonical hairline avatar ring retained; stack's canvas wrappers are facepile separation.

## Phone proof
- Real guest Tour opened at `http://localhost:8080/tourhub`, 390×844; no page errors. Screenshot `/tmp/browser/also-week/section.png` visibly shows Simmons Bank Championship (live, before final round) and Maybank Championship (finished). Leaderboard rows, chase and final winner block render.
- `/tmp/browser/also-week/mock.png` and `/tmp/browser/also-week/comparison.png` capture the reference and side-by-side comparison.
- Current eligible section has **one live and one finished** event; two live events and a starting-this-week event cannot be shown without changing the frozen selection. Member followed rows have unit coverage only.
- Event tap navigation has not yet been exercised end-to-end; more mock state/coverage verification remains outstanding.

## Outstanding
- Clear the two validation stops above, then rerun full suite.
- Add remaining locale keys beyond English and complete all requested specific state/heading/navigation tests.
- Place the architecture pointer within AGENTS.md budget: attempted addition was refused (12,498 > 12,288 bytes). Local ownership headers already exist; no existing rule compressed.
- No SQL, migrations, RPC/edge/provider/native/Median/feed_config changes; round_pool_cap remains 30.