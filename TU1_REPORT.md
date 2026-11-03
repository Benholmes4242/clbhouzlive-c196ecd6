# TU1 — two-up video grids complete

## Result
Applied the queued TU1 brief and signed-off `tu1-two-up-grid.html` to `/watch/top100`, `/watch/courses` and `/watch/region/:region` only, on the completed CM1 baseline.

- Two columns, 10px column gap, 18px row gap, 14px side inset, top-aligned tiles.
- One whole-tile button with a 4:5, radius12 cover poster; no fixed172px height, gradient overlay or overlaid course name.
- Extracted/exported SolidDurationBadge unchanged from WatchFeed; Shorts and Community retain their existing calls. Duration stays bottom-right6px, white10px/700, dark62% fill, radius5, padding2px5px, tabular figures.
- Top 100 only: positive numeric `list_rank` produces the existing `review-tile-chip` glass chip at top-left7px, #9px/700 and white rank13px/700. Optional rank added to shared row type; no data read changed.
- Full short course name below poster (14px/700, top8px, line1.3); full creator/display-name-or-handle beneath (12px/400, white55%, top2px, line1.35); no truncation, empty creator omitted.
- Header B, PageTitle/subtitle, region chips/IslandDock, non-region14px spacer, NAV_CLEARANCE, empty state, sentinel, pagination, analytics and canonical viewer list/index remain unchanged.

All new grid colours use semantic CSS tokens in `watch-grid.css`; extracted badge constants remain byte-for-byte equivalent to the brief's explicitly unchanged presentation. No guest browsing, review wizard, news, round plots, SQL/migrations, deployed RPC/edge-function, feed_config, round_pool_cap or native/Median edits.

## Tests: no obsolete assertions rewritten
Inspected all three requested files. None contained old **WatchGridPage** 172px/gradient/top-right badge/one-line overlay assertions to replace. Their shelf badge/geometry assertions target other tiles and remain untouched.

- `ws2WatchMiddle.test.tsx`: **26→26**, untouched. Existing Shorts badge render assertion and canonical grid list/index2 tap assertion pass.
- `ws3WatchBottom.test.tsx`: **41→41**, untouched. Top 100 shelf geometry/badges remain protected, independent of TU1 grids.
- `g2dVideoGrids.test.tsx`: **9→22**, +13 new executed cases, no existing case deleted/renamed/rewritten. Added controllable rows to the existing empty-row fixture, resetting rows and viewer spy before each case; original nine assertions remain unchanged.

Exact fixture changes:
```diff
-const f = vi.hoisted(() => ({ regions: [...], sources: [], track: vi.fn(), open: vi.fn() }));
+const f = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], regions: [...], sources: [], track: vi.fn(), open: vi.fn() }));
-data: { pages: [[]] }
+data: { pages: [f.rows] }
+f.rows = []; f.open.mockClear();
```
Why: exercise actual rendered grid rows without altering existing chrome/empty-state test inputs. No unrelated assertion weakened.

### Thirteen added cases, reconciled by name
1. “uses two columns, 10px column gaps and 18px row gaps” — also14px side inset/start alignment.
2. “a positive Top 100 rank renders #4 with the existing glass chip”.
3–5. “Top 100 rank %s renders no rank chip” — undefined,0,−1.
6–7. “%s never renders a rank even when supplied” — courses,region with rank4.
8. “56 seconds renders the shared bottom-right 0:56 badge”.
9. “full course and creator text sit below the frame without truncation”.
10. “no display name or handle omits the creator element”.
11. “a missing display name uses the full handle”.
12. “the entire second tile opens the loaded list at index one” — `openVideoList(f.rows,1)`, one call and unchanged analytics.
13. “preserves portrait and semantic colour source values jsdom cannot retain” — asserts source `aspectRatio: '4 / 5'`, `var(--watch-grid-poster)` and rank ink variable; rejects old172px/DurationChip/gradient. Aspect-ratio and var colour assertions use source because jsdom may drop those properties; wrapping, gap, labels, rank and duration use rendered DOM.

## Commands and results
Focused:
`bunx vitest run src/test/g2dVideoGrids.test.tsx src/test/ws2WatchMiddle.test.tsx src/test/ws3WatchBottom.test.tsx src/test/cm1Community.test.tsx src/test/er1ExploreCommunity.test.tsx --maxWorkers=2`

**128/128 tests, 5/5 files, zero failures/unhandled errors, exit0.** Before scope115; after128, exactly +13 in G2D.

| Exact full-suite command | Passed / executed | Files |
|---|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,681 /1,681 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,556 /1,556 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,648 /1,648 | 145 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,642 /1,642 | 143 |
| **Total** | **6,527 /6,527** | **578** |

**Zero failures, zero unhandled errors; all exit0.** Full logs persist in `docs/verification/tu1/{focused,shard-1,shard-2,shard-3,shard-4}.log`. No failing shard exists in this run. React/test-environment warnings are not represented as failures or unhandled errors.

Last verified baseline **CM1 6,514 tests /578 files** → **TU1 6,527 /578**: **+13 tests /0 files**, exclusively the thirteen named G2D cases above. Shard2 moves1543→1556; other shards unchanged. No unexplained delta, no deleted/renamed tests.

Pre-existing failures named for history: ws1 Community See all jsdom scrollTo error; Integrated Picks DG6 whole-row assertion; Merged Airy upcoming/live/completed spacing assertions. All were separately authorised/fixed before TU1 and none recurred. No exemptions used.

## Build and verification limits
Automatic build log is clean: **2026-11-03T23:39:27Z — build OK**. Component tests verify actual grid taps and viewer handoff with populated rows. Real signed-in browser end-to-end checks remain unavailable (`external_unmanaged`); no credentials requested and no live screenshot/parity claim. Uploaded HTML is reference-only, not embedded as app media.

## Every file touched
- `src/features/explore-magazine/watch/SolidDurationBadge.tsx` (new exported shared badge)
- `src/features/explore-magazine/watch/watch-grid.css` (new semantic grid colour tokens)
- `src/features/explore-magazine/watch/WatchFeed.tsx` (unchanged badge extraction/import)
- `src/features/explore-magazine/watch/watchMiddle.ts` (optional rank type only)
- `src/pages/WatchGridPage.tsx` (TU1 grid/tile presentation)
- `src/test/g2dVideoGrids.test.tsx` (fixture plus13 cases)
- `AGENTS.md` (shared ownership rule), `roadmap.md`, `TU1_REPORT.md`
- `docs/verification/tu1/focused.log`, `shard-1.log`, `shard-2.log`, `shard-3.log`, `shard-4.log`

Referenced WS4/ratings memory files were unavailable when read; core injected rules and the explicit unchanged badge/white rating requirements were preserved.