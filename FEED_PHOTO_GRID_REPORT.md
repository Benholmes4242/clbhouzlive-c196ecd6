# Feed photo grid — implemented; suite stopped

## Result
Image-only posts with at least four photos now render the signed-off four-tile grid through shared FeedCard. Upright/missing-dimension leads use the 4:5 two-column layout; square/wide leads use the clamped lead above three square tiles. Fourth tile shows the remaining count. Tile taps open the real photo index with its origin/poster; double taps use the existing like path. First-tile hole/tag overlays stay on the lead. Grid rendering ignores restored carousel slides. One–three photos, any video and words-first review fill frames retain the carousel/single-media rendering.

## Files changed
- `src/components/feed/feedPhotoGrid.ts` — pure eligibility/layout helper.
- `src/components/feed/FeedPhotoGrid.tsx` — tiles, canonical sources/LQIP, lead image ref and deferred ResizeObserver width measurement.
- `src/components/feed/feedPhotoGrid.css` — geometry, 2px seams and media cap.
- `src/components/feed/SingleMediaTapButton.tsx` — extracted existing tap surface, shared without changing its behavior.
- `src/components/feed/FeedCard.tsx` — grid branch and primary-image readiness, preserving non-grid paths.
- `src/index.css` — grid overlay/white ink tokens.
- `src/test/feedPhotoGrid.test.ts` — 14 new helper cases.
- `src/test/feedPhotoGridCard.test.tsx` — 8 new mounted FeedCard cases.
- `roadmap.md` — completion/blocker tracking; architecture/memory notes document shared ownership and signed-off appearance.

## Tests and assertions
22 new tests across two files. No existing test was deleted, renamed, rewritten or updated; therefore no old/new assertion changes. Helper cases cover the specified counts, all five possible video positions, orientation, square, clamping and missing dimensions. Mounted cases cover four visible tiles, more count, real index/origin/poster, carousel preservation, double-tap like, lead-only hole overlay/restored-index exclusion and primary image readiness.

Focused command:
`bunx vitest run src/test/feedPhotoGrid.test.ts src/test/feedPhotoGridCard.test.tsx src/test/pf1bFeedCard.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/reviewFeedMediaSizing.test.tsx --maxWorkers=2`

**50 passed / 50 tests, five files.** Existing review tests emit jsdom CSS container-query parse diagnostics but pass.

| Fresh shard | Passed | Failed | Total | Files |
|---|---:|---:|---:|---:|
| 1/4 | 1,983 | 1 | 1,984 | 166 passed, 1 failed |
| 2/4 | Not run | — | — | Stopped |
| 3/4 | Not run | — | — | Stopped |
| 4/4 | Not run | — | — | Stopped |

Shard command: `bunx vitest run --maxWorkers=2 --shard=1/4`.

**Stop: not an allowed known failure.**
`src/test/tourOverviewPicksChipsFullBoard.test.tsx:130:30`
Test: `picks chips (Board B) > uses a 46px border-box chip for a pre-round tee with a 1px gap`
Tool output: `AssertionError: expected '1' to be '1 1 0%' // Object.is equality`
Expected: `"1 1 0%"`; received: `"1"`.

This assertion belongs to the separate tight-chips work, was already recorded in its report, and was not modified here. It is not classified as permitted by this brief. No repair, skip or further test execution. Full output retained in `/tmp/feed-photo-grid/shard1.log`.

Last reported green full-suite baseline: **7,607 tests / 664 files** (W1). This task adds **22 tests / 2 files**; any intervening tight-chips delta is independent. Current complete-suite total is unverified because the fresh run stopped after shard 1. A non-executing `vitest list` inventory attempt also timed out at 120 seconds; no total is claimed from it.

## 320px checks
Rendered the actual FeedPhotoGrid in an isolated unsigned browser harness at **320×844**, loading the real global CSS. Synthetic image fixture, no sign-in/guest creation. All four configurations fit horizontally (scrollWidth = clientWidth = 320), show 2px gaps, open index 2 when the third tile is tapped and emit no page errors.

| Fixture label | Photos/layout | Width | Height | Existing cap | Gap |
|---|---|---:|---:|---:|---:|
| Clubhouse | 5 / upright | 320px | 400px | 539px | 2px |
| Clubhouse | 12 / wide | 320px | 287.344px | 539px | 2px |
| Business profile | 5 / upright | 320px | 400px | 539px | 2px |
| Business profile | 12 / wide | 320px | 287.344px | 539px | 2px |

Screenshots inspected; +1/+8 overlays and full-bleed geometry visible. These are **isolated shared-component checks**, not authenticated Clubhouse/business-page checks: fixture labels do not prove those page shells. Mounted FeedCard coverage verifies the integration; actual live-feed/page-shell checks and fullscreen swipe-through remain for Ben. Harness/results/screenshots are under `/tmp/browser/feed-photo-grid/`. The initial temporary fixture bundling failed on ambiguous case-sensitive extension resolution; explicit `.ts`/`.tsx` fixture imports resolved it without app changes.

Latest preview build log: **build OK** at `2026-11-07T18:59:36Z`.

## Preserved boundaries
No SQL, migrations/migration files, deployed RPC/edge-function edits, `feed_config`, cap changes, native/Median changes, composer, fullscreen engine, guest browsing, review-wizard, news or round-plot edits. Existing media ratio constants and mediaMaxHeight are unchanged.