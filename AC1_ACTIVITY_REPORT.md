# AC1 Activity — completed-edit stop

## Status
Implemented the requested summary-only round rows, score tiles, hole strips, neutral unread ground/left dot and Tour system tiles. **Not complete: automatic typecheck reports the error below.** No correction or rerun after detecting the surviving error, in accordance with Ben's stop rule.

```
src/test/ac1ActivityRounds.test.tsx(103,60): error TS2345: Argument of type '(holes: any) => void' is not assignable to parameter of type '() => Awaitable<void>'.
Target signature provides too few arguments. Expected 1 or more, but got 0.
```

The new `it.each([null, []])` empty/null-strip fixture at line 103 executes successfully in Vitest but its callback fails TypeScript's inferred overload. Proposed narrowly scoped follow-up: explicitly type/wrap the two table rows so each supplies one `hole_to_par` argument; retain both assertions and all cases. Await authorisation; no fix applied.

## Diff
- Added `hooks/useActivityRoundSummaries.ts`: sorted/deduplicated-id queries, viewer-scoped keys, one RPC call per loaded feed page and merged Map; no fallback table reads or stale figures on loading/error.
- `ActivityPageV2.tsx` passes matching summaries into existing LedgerRow instances; grouping, Records and read lifecycle unchanged.
- Added `components/ActivityRoundContent.tsx`: shared shortCourseName and signed formatter; >=3 other rounds / >=1 raw improvement gate; rounded difference, no worse-round observation; score tile, 9-hole label and per-entry scorecard palette strip.
- `LedgerRow.tsx`: rounds suppress thumbnails, not-ready rows show no score; destinations and overlay navigation unchanged. System rows with resolved `/tour` destinations show `data.tour_short_name` or `Tour`. Other system rows keep their existing icon.
- Added `activity-rounds.css`; semantic colour tokens in `src/index.css`; neutral unread ground and 6px white left pseudo-dot, no right amber dot. ResolvePill and other amber controls untouched.
- Added `src/test/ac1ActivityRounds.test.tsx`, 28 cases. Existing test files unchanged; none deleted, renamed, rewritten or assertions changed. Header/chips/group headings in the mock were frozen and intentionally not adopted. No tour short-name key is documented in the current feed type/server digest; optional `tour_short_name` is supported, otherwise `Tour` as specified. No live payload short-name proof.

## Tests and count reconciliation
Before: **5,430/5,430 across 519 files**. After: **5,458/5,458 across 520 files**; +28/+1 solely `src/test/ac1ActivityRounds.test.tsx`. No failed or skipped Vitest cases, no pre-existing failures, no removed cases.

Focused command:
`bunx vitest run src/test/ac1ActivityRounds.test.tsx src/test/postPageFollowup.test.tsx src/test/roundNotificationOverlay.test.ts src/features/activity-v2/utils/__tests__ --maxWorkers=2 --reporter=json --outputFile=/tmp/ac1/focused.json`

Result: **149/149**, including all 28 AC1 cases.

Full-suite commands and results:
- `bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac1/shard1.json` — 1,333/1,333, 130 files.
- `bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac1/shard2.json` — 1,305/1,305, 130 files.
- `bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac1/shard3.json` — 1,364/1,364, 130 files.
- `bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac1/shard4.json` — 1,456/1,456, 130 files.

Latest automatic build log: **2026-11-01T18:50:50Z**, typecheck error above; no build-clean claim. The shards were already launched when the automatic typecheck signal was inspected. No manual build/typecheck run.

## Unverified and protected scope
Browser/computed-colour and signed-off geometry comparisons not performed after the stop; unit checks do not establish exact visual parity or pseudo-element colours. Real signed-in summary readback and scorecard flow remain unverified. No SQL, migrations, RPC/edge edits, feed_config, round_pool_cap, native or Median changes. AC2 batching and Records wording untouched.