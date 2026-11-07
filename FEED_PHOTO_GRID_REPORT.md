# Feed photo grid — implemented; suite stopped

## Shared verification close-out — 7 November 2026
No photo-grid production/test changes. Only the authorised tight-chips test line changed:
`src/test/tourOverviewPicksChipsFullBoard.test.tsx:130`
- Old: `expect(text?.style.flex).toBe('1 1 0%');`
- New: `expect(['1', '1 1 0%']).toContain(text?.style.flex);`
No added/deleted/renamed tests or other assertion changes in this close-out; count delta **0**.

Focused chips **116/116** across7files; focused photo-grid **50/50** across5files, with the commands already documented in the two reports. Fresh logs: `/tmp/chips-grid-closeout/chips-focused.log`, `grid-focused.log`.

Each shard was run once, `bunx vitest run --maxWorkers=2 --shard=N/4`:
| Shard | Passed | Failed | Total executed | Files |
|---|---:|---:|---:|---:|
| 1/4 | 1,984 | 0 | 1,984 | 167 passed |
| 2/4 | 1,824 | 1 | 1,825 | 166 passed,1 failed |
| 3/4 | Not run | — | — | Stopped |
| 4/4 | Not run | — | — | Stopped |
Combined **3,808 passed + 1 failed = 3,809 executed / 334 files**. Full-suite total remains unverified. Reconciliation: last green W1 **7,607 tests/664files**, then tight-chips **+3/+1**, then photo-grid **+22/+2**; expected current scope **7,632/667**, not a completed full-suite result.

**Stop on unexpected, unauthorised failure:**
```text
FAIL src/test/tourHeroRefinements.test.tsx > Tour hero refinements > renders the Needs gross as a separate untruncated white figure and omits leading/level picks
AssertionError: expected  to have a length of 1 but got +0
src/test/tourHeroRefinements.test.tsx:98:19
expect(lines).toHaveLength(1);
Expected: 1; Received: 0
```
The unchanged test expects the removed NEEDS subtree. No repair, skip, rerun or shards3–4 after this failure. The permitted FW1 meta-line failure did not appear. Shard outputs retained in `/tmp/chips-grid-closeout/`.

### Outstanding 320px checks: real feed-list composition now measured
Actual **CardFeed** (Clubhouse) and **LightCardFeed** (business author, mediaFirst) rendered their real **FeedCard/FeedPhotoGrid** at320×844 in a temporary unsigned fixture harness, with synthetic photos and real global CSS. Only network/side-effect/secondary modules and virtual-list mounting were isolated; these are no longer bare-grid fixture labels. Complete authenticated Clubhouse/business page chrome/live reads are not claimed.
| Actual feed fixture | Post | Grid width | Height | Gap | Cap | Feed client/scroll width |
|---|---|---:|---:|---:|---:|---:|
| Clubhouse CardFeed | 5 upright |320px|400px|2px|539px|320/320px|
| Clubhouse CardFeed |12 wide|320px|287.344px|2px|539px|320/320px|
| Business LightCardFeed |5 upright|320px|400px|2px|539px|320/320px|
| Business LightCardFeed |12 wide|320px|287.344px|2px|539px|320/320px|
All four: no horizontal overflow, 2px gaps, height below existing media cap. Screenshots inspected, +1/+8 overlays visible; **zero final page errors**.

Overview checks in the same run: picks and movers each had three **46px** chips within x20–300; long names visibly ellipsised (picks37px vs174px content, movers36px vs174px), no horizontal overflow. Full measurements/screenshots/harness: `/tmp/browser/chips-grid-closeout/`. Temporary bundling/runtime dependencies were resolved in `/tmp` only before the successful final run. No guest access or sign-in altered. Device/fullscreen/live-data checks remain for Ben. Preview log **build OK** at `2026-11-07T19:11:10Z`.

Original stopped results below are historical and superseded by the fresh results above.

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