# Tour leaderboard rebuild

## Delivered
Board-only event pills, event summary, conditional field-average/low statistics (20 completed rounds), member-owned followed-player section, shared column header, avatar/pick/follow marks, movement under position, continuous tie brackets, absolute-order 18-hole strips, single-row inline scorecards and matching FullBoardSheet. Full scorecard and player-page actions keep existing destinations. Hero/MiniBoard remains untouched.

Ben's colour ruling preserves scoreColor.ts, including existing over/even opacity. System typography stays rather than the mock's Geist. No new negative tracking.

## Data and privacy
useBoardHoles performs one cached tournament/round sr_scorecards query without a player filter; leaderboard cache updates refresh it. Existing sync source iterates the whole provider field; no new provider calls or sync changes. Live guest proof returned 68 strips across 122 board players, not a claim that every provider hole is present.

useTourPlayerFollows reads/writes the member identity, never a business actor or guest. Follow/unfollow is optimistic with rollback on refusal; guests open the existing follow action gate. Your players is unit-tested only as requested, not claimed as signed-in persistence verification.

## Tests and count reconciliation
Baseline: 4,972 tests across 500 files. Final: **5,004/5,004 across 502 files**.

Commands:
- `bunx vitest run src/test/tourLeaderboardRebuild.test.tsx src/test/tourLeaderboardReads.test.tsx src/test/tourOverviewDesignA.test.ts --maxWorkers=2`: 93/93.
- `bunx vitest run --shard=1/2 --maxWorkers=2`: 2,445/2,445 across 251 files.
- `bunx vitest run --shard=2/2 --maxWorkers=2`: 2,559/2,559 across 251 files.

Delta +32 tests/+2 files: tourLeaderboardRebuild.test.tsx adds 27 (summary/gate/ties, hole grading/order, inline open/switch/close, full-scorecard and separate follow/player doors); tourLeaderboardReads.test.tsx adds five (bulk filters, insert, delete, guest gate/no write, refusal rollback). No tests deleted.

One existing test renamed and its explicitly superseded alignment assertions updated in src/test/tourOverviewDesignA.test.ts:455:
- Old: `BoardTable right-aligns THRU and round columns and keeps POS centred`.
- New: `BoardTable centres THRU and round columns and keeps POS centred`.
- Four alignment assertions (THRU header/cells and round headers/cells) change `toBe('right')` to `toBe('center')`; POS remains `toBe('center')`. Reason: signed-off rebuilt full-board geometry centres these columns. Independent 32px hero test unchanged. Count unchanged.

No unexpected test failures. Existing act warnings remain non-failing. Automatic preview compilation: build OK at 2026-10-31T18:55:23Z; no separate manual typecheck was run because the harness owns compilation/type checks.

## Visual proof
390×844 real guest captures in /tmp/browser/tour-board:
- top-comparison.png: event top beside mock.
- ties-comparison.png: ties/strips beside mock.
- expanded-comparison.png: live row expanded beside mock.
- sheet-comparison.png: real 120-player completed-event FullBoardSheet beside mock.
- guest-follow.png: real guest follow gate.

Live event: VidantaWorld Mexico Open, round 3; row opens inline without page error. Live values differ from mock snapshots; average/low are absent because the completed-round gate is not met. FullBoardSheet opened for Butterfield Bermuda Championship. Browser page errors on the live board: none. Mock is rendered from the uploaded HTML; comparisons inspected visually.

No SQL, migrations, RPC/edge deployments, feed_config, round_pool_cap, native or Median changes.