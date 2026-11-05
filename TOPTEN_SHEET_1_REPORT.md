# TOPTEN_SHEET_1 — implemented; verification stopped

## Changes
- `AddCourseModal.tsx`: header action `color: A.AMBER` → `color: A.INK`, shared by Cancel and Done. All other amber accents and handlers unchanged.
- One 24px end spacer after either body, inside the existing scrolling region. BottomSheet is untouched and retains its independent safe-area padding.
- New `src/test/topTenSheet1.test.tsx`: four render cases (two modes × header computed ink/not amber; two modes × last scrolling child with 24px height).
- No existing assertions, case names, expected values or test files rewritten/deleted. No interaction logic changed.

## Tests and stop
Focused command: `bunx vitest run src/test/topTenSheet1.test.tsx src/test/topTenOwnerLabel.test.ts src/test/topTenOwnerLabelRender.test.tsx src/test/topTenShareCard.test.tsx src/test/topTenTileWidth.test.tsx --maxWorkers=2`.
**25/25 passed, five files.** Protected Top 10 tests passed.

Full-suite command attempted: `bunx vitest run --maxWorkers=2 --shard=1/4`.
**Shard 1: 1,843 passed, 1 failed; 155 files passed, 1 failed.** Shards 2–4 not run under the stop rule.

Pre-existing Tour menu failure, left untouched:
```text
FAIL src/test/tourIsland.test.tsx > TourGlance > anchors left to the left island, not the right
AssertionError: expected '' to be 'min(346px, calc(100vw - 24px))' // Object.is equality
❯ src/test/tourIsland.test.tsx:235:30
expect(card.style.width).toBe('min(346px, calc(100vw - 24px))');
```
Full output retained in `docs/verification/top-ten-sheet-1/shard1.log`; focused output in `focused.log` beside it.

Last expected inventory: **7,042 / 622**, not previously suite-green. This change adds four cases and one file: **expected 7,046 / 623**, not full-suite verified. Last confirmed green baseline remains **7,024 / 620**; pre-existing EXP_RING_1 added 3 / 1 and Tour menu added 15 / 1 before this work.

Other known pre-existing blockers were not rerun or changed: `expRing1.test.tsx` two border assertions (`expected '' to be 'none'` at line 31); `ws3WatchBottom.test.tsx` 17 missing `DARK_HAIRLINE` mock-export failures, documented in EXP_RING_1_REPORT.md.

## Requested live checks
1. 390×844 notched iPhone, new account, empty add query: **not verified**. Source retains `max(env(safe-area-inset-bottom, 0px), 16px)`; this is not proof of non-zero live iPhone padding. No primitive repair attempted.
2. Populated list/Done/end clearance: **not live-verified**; render action/gutter coverage passes.
3. 320px overflow/title collision: **not verified**.
4. Picking, full-ten swap, drag reorder: **not live-verified**; their implementation unchanged.

Browser checks stopped after the suite failure. Current preview log: `build OK` at 2026-11-05T21:53:21Z; no manual build invoked.
No SQL, migrations, deployed RPC/edge edits, feed_config, pool-cap, native/Median, guest browsing, review wizard, news or round-plot changes.