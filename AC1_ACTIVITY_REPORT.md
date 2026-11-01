# AC1 Activity — final report

## Status
Implemented the requested summary-only round rows, score tiles, hole strips, neutral unread ground/left dot and Tour system tiles. **Complete.** AC1.1, an authorised test-only type fix, resolved the previously reported typecheck error.

```
src/test/ac1ActivityRounds.test.tsx(103,60): error TS2345: Argument of type '(holes: any) => void' is not assignable to parameter of type '() => Awaitable<void>'.
Target signature provides too few arguments. Expected 1 or more, but got 0.
```

AC1.1 applied exactly the authorised fix at line 103: `it.each<[number[] | null]>([[null], [[]]])('omits a missing or empty strip %j', holes => { … })`. Each case now supplies its own single argument and the table carries an explicit type. Both cases and both assertions are unchanged; no other line was touched. `npx tsgo --noEmit` exits clean.

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

Latest automatic build log: **2026-11-01T19:07:54Z**, build OK.

## AC1.1 verification (2026-11-01T19:07 UTC)
- Typecheck: `npx tsgo --noEmit` — exit 0, no errors.
- Targeted: `npx vitest run src/test/ac1ActivityRounds.test.tsx` — 28/28, file passes.
- Full suite, sharded (all four passed, zero failures anywhere):
  - `npx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac11/shard1.json` — 1,333/1,333.
  - `npx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac11/shard2.json` — 1,305/1,305.
  - `npx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac11/shard3.json` — 1,364/1,364.
  - `npx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/ac11/shard4.json` — 1,456/1,456.
- Total: **5,458/5,458 across 520 files** — matches the 5,458/520 baseline; test count unchanged by AC1.1 (type-only edit). No pre-existing failures; none named because there are none.

## Unverified and protected scope
Browser/computed-colour and signed-off geometry comparisons not performed; unit checks do not establish exact visual parity or pseudo-element colours. Real signed-in summary readback and scorecard flow remain unverified. No SQL, migrations, RPC/edge edits, feed_config, round_pool_cap, native or Median changes. AC2 batching and Records wording untouched.