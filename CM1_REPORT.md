# CM1 — focused checks passed; shard 2 stops on non-exempt spacing failures

## CM1 resumption — 22:52 UTC
The Integrated Picks case “no pick combines question, exact lock copy, digit circle count and action” is **pre-existing**, originating in the Integrated Our picks stop at 22:25, not caused by CM1. Its subsequent text-span correction was separately authorised in the Picks continuation; it was not a CM1/TU1 edit. No test or product source was edited in this resumption.

The user's single named exception permits that Picks failure only. Reran `bunx vitest run --maxWorkers=2 --shard=2/4`: **1,540 passed /3 failed /1,543 executed**, **144 passed /1 failed file (145 total)**; zero unhandled errors, exit1. The three non-exempt failures are:
```text
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in upcoming
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in live
FAIL src/test/tourOverviewMergedAiry.test.tsx > Merged Airy lower sections > adds the picks hairline and tighter cards in completed
AssertionError: expected '16px' to be '14px' // Object.is equality
Expected: "14px"
Received: "16px"
❯ src/test/tourOverviewMergedAiry.test.tsx:78:98
```
Full output retained at `docs/verification/cm1-resume/shard-2.log`. These same failures were recorded in the preceding Picks continuation; they are **not** the one authorised exception. Therefore shards 3–4 were not run and TU1 did not start, per “any other failure is STOP AND REPORT”. Latest shard1 from the separately authorised continuation passed **1,681/1,681**; the earlier CM1 shard1 had **1,680 passed /1 pre-existing Picks failure /1,681 executed**. Do not merge these different runs into a four-shard green claim.

No tests added, removed, renamed or rewritten in this resumption: inventory delta **0**. Latest documented candidate remains **6,514 tests /578 files**, not a verified current full-suite total: FIX_GRID_1 baseline **6,472/576**, CM1 +14/net0 files, Integrated Picks +23/+1, guest lock rule tests +5/+1; authorised selector/mock changes +0. Complete current-suite totals remain unavailable because shards 3–4 did not execute. No fresh build entry was available this resumption; prior clean build evidence is **22:42:13Z build OK** from the Picks continuation.

Files touched this resumption: `CM1_REPORT.md`, `roadmap.md`, `docs/verification/cm1-resume/shard-2.log` only. All preceding sections below are historical records.

## Authorised continuation — 2026-11-03

Only `src/test/ws1WatchTop.test.tsx` changed in this continuation's tests. No product code or `getScrollParent.ts` edits were made. The existing case “the community rail's See all selects Community without changing the path” retains its name, path/search, selected-chip and analytics assertions. The exact authorised additions are:

```diff
 const f = vi.hoisted(() => ({
+  scroll: vi.fn(),
 }));
+vi.mock('@/lib/getScrollParent', async (orig) => ({ ...(await orig<Record<string, unknown>>()), scrollPageToTop: f.scroll }));
 beforeEach(() => {
+  f.scroll.mockClear();
 });
 expect(screen.getByRole('tab', { name: 'Community' }).getAttribute('aria-selected')).toBe('true');
+expect(f.scroll).toHaveBeenCalledOnce();
```

Why: replace jsdom's unavailable element-scrolling implementation with the same partial module mock as ER3 and assert the actual Community See all scroll command. No cases added, deleted, renamed or otherwise rewritten; **ws1 remains 44 tests before/after**. The focused scope remains **148 before/after**. This continuation has **zero full-suite inventory delta**. Last verified baseline remains **6,472 tests /576 files**; the latest documented candidate before/after is **6,509 /577**, reconciled in `INTEGRATED_OUR_PICKS_REPORT.md` as CM1 +14/net0 files, then Integrated Picks +23/+1 file. A complete current full-suite total is **not verified**: the run stopped after shard 1.

Focused command:
`bunx vitest run src/test/ws1WatchTop.test.tsx src/test/er3LongFormRails.test.tsx src/test/er1ExploreCommunity.test.tsx src/test/hb6Group1.test.tsx src/test/canvasSurfaceToken.test.ts src/test/cm1Community.test.tsx src/test/ratingsWhite.test.ts --maxWorkers=2`

Result: **7 files /148 tests passed, exit0; zero failures and zero unhandled errors**. Full output: `docs/verification/cm1-authorised/focused.log`. The inherited CM1 `scrollTo` error did not recur. React act warnings remain warnings, not unhandled errors.

Full-suite command started:
`bunx vitest run --maxWorkers=2 --shard=1/4`

Result: **145 files (144 passed/1 failed), 1,681 tests (1,680 passed/1 failed), exit1; zero unhandled errors**. Full failing output retained in `docs/verification/cm1-authorised/shard-1.log` (not only temporary storage). Required stop observed; shards 2–4 were not run and TU1 has not started.

The reproduced **pre-existing** failure is exactly the earlier Integrated Picks stop, outside this authorisation:

```text
FAIL src/test/integratedPicks.test.tsx > integrated card states > no pick combines question, exact lock copy, digit circle count and action
AssertionError: expected 'DG6 of your circle have picked. Most …' to be '6 of your circle have picked. Most pi…' // Object.is equality
Expected: "6 of your circle have picked. Most picked: Ghim."
Received: "DG6 of your circle have picked. Most picked: Ghim."
❯ src/test/integratedPicks.test.tsx:36:542
```

No correction to that test was attempted. No other test failures were reproduced in the executed scope. Build log is clean: **2026-11-03T22:36:07Z — build OK**.

The corrected Community mock **has arrived** as `/mnt/user-uploads/Community_See_all_pasted.html` and was read. Its rating figure explicitly uses `#FFFFFF`. Source/test comparison supports the five CM1 tile changes: 12px corners, 16px row gap, wrapping course name, visible white rating and Shorts-style duration replacing the play circle. Frozen surrounding chrome/chips were not silently adopted from the mock. Live signed-in visual comparison and null-poster inspection remain unverified: current authentication status is `external_unmanaged`; no credentials requested. This is not a full CM1 green/sign-off claim.

Continuation files touched: `src/test/ws1WatchTop.test.tsx`, `roadmap.md`, `CM1_REPORT.md`, `docs/verification/cm1-authorised/focused.log`, `docs/verification/cm1-authorised/shard-1.log`. All prohibited product, SQL/migration, deployed function, feed_config, round_pool_cap and native/Median areas remain untouched.

## Original CM1 implementation record (historical)

## Result
Implemented Community See all in-place selection, Watch URL entry, Media redirects/retirement and the corrected white-rating grid treatment. Corrected `cm1-community-see-all.html` was received and read. Frozen surrounding chrome, chip styling, content ordering and rail geometry remain as shipped; no full mock-parity or live signed-in claim.

## Stop signal
Command: `bunx vitest run src/test/ws1WatchTop.test.tsx src/test/er3LongFormRails.test.tsx src/test/er1ExploreCommunity.test.tsx src/test/hb6Group1.test.tsx src/test/canvasSurfaceToken.test.ts src/test/cm1Community.test.tsx src/test/ratingsWhite.test.ts --maxWorkers=2`.

**7 files /148 assertions passed; 1 unhandled error; exit1.** Full original output retained at `/tmp/cm1/focused.log` (temporary sandbox storage).

```text
TypeError: scroller?.scrollTo is not a function
 ❯ Module.scrollPageToTop src/lib/getScrollParent.ts:101:13
 ❯ onSeeAll src/features/explore-magazine/watch/WatchFeed.tsx:449:13
This error originated in "src/test/ws1WatchTop.test.tsx" test file.
The latest test ... "the community rail's See all selects Community without changing the path".
```

jsdom lacks the element scrollTo method used by the newly selected in-place path. No fix applied after this unexpected error. **Four shards not run.** No pre-existing failures reproduced. Build is clean: automatic log **2026-11-03T22:13:33Z build OK**. An intermediate nonexistent PHOTO_INK import was corrected before finished tests; historical TS2305 is not outstanding.

## Count reconciliation
Last full baseline: **6,472 tests /576 files**, FIX_GRID_1. Candidate inventory: **6,486 /576**; not a verified full-suite executed/pass total. Delta +14 tests, net0 files:
- New `cm1Community.test.tsx`: +17 tests/+1 file: seven legacy destination cases, four Watch mapping cases, six CSS cases (including two corner selectors).
- `er1ExploreCommunity.test.tsx`: +2 cases, rating/absence and duration/no-play.
- `hb6Group1.test.tsx`: −1 parameterized media heading case; business case and `/media` registry fallback case retained.
- Deleted `mediaPageThreeWalls.test.tsx`: −4 tests/−1 file, each quoted below.
- ws1, ER3, canvas updates do not change counts; ratingsWhite untouched.

## Files touched
- `src/features/explore-magazine/watch/WatchFeed.tsx`
- `src/features/explore-magazine/watch/explore-top.css`
- `src/features/explore-magazine/ExploreMagazine.tsx`
- `src/features/amateur/AmateurMediaBlock.tsx`
- `src/features/amateur/MediaRedirect.tsx` (new)
- `src/App.tsx`
- `src/features/chrome-v2/registry.ts`
- `src/components/explore-tab-new/courseled/MomentTile.tsx`
- `src/test/ws1WatchTop.test.tsx`
- `src/test/er3LongFormRails.test.tsx`
- `src/test/er1ExploreCommunity.test.tsx`
- `src/test/hb6Group1.test.tsx`
- `src/test/canvasSurfaceToken.test.ts`
- `src/test/cm1Community.test.tsx` (new)
- `AGENTS.md`, `roadmap.md`, `CM1_REPORT.md`
- Memory: `mem://features/amateur/cutover-authority`, `mem://index.md` updated for retirement and corrected white figures.

Deleted:
- `src/features/media-library/MediaLibraryPage.tsx`
- `src/features/media-library/LibraryChrome.tsx`
- `src/features/media-library/LibraryVideoCard.tsx`
- `src/features/media-library/hooks/useReviewMediaLibrary.ts`
- `src/features/media-library/hooks/useMergedMediaLibrary.ts`
- `src/components/skeletons/MediaLibrarySkeletons.tsx`
- `src/test/mediaPageThreeWalls.test.tsx`

External importer grep before deletion returned no remaining references once App and authorised test imports were updated. Shared `libraryTotals.ts` stays unchanged: GalleryTab consumes moment/review totals; AmateurMediaBlock consumes merged total. It imports React Query and Supabase, not hooks/, so no hook exception needed. Skeleton exports had no other consumers.

## Changed test diffs
`ws1WatchTop.test.tsx`: “the community rail's See all routes to /media?kind=community” → “the community rail's See all selects Community without changing the path”, because behaviour moved in place:
```diff
- expect(loc.getAttribute('data-path')).toBe('/media');
- expect(loc.getAttribute('data-search')).toBe('?kind=community');
+ expect(loc.getAttribute('data-path')).toBe('/amateur');
+ expect(loc.getAttribute('data-search')).toBe('');
+ expect(screen.getByRole('tab', { name: 'Community' }).getAttribute('aria-selected')).toBe('true');
+ expect(f.track).toHaveBeenCalledWith('amateur_shelf_see_all', { kind: 'community', surface: 'watch' });
```
`er3LongFormRails.test.tsx`: “community See all keeps the existing destination” → “community See all selects Community in place and scrolls to the top”, for the same move:
```diff
- expect(screen.getByTestId('loc').textContent).toBe('/media?kind=community');
+ expect(screen.getByTestId('loc').textContent).toBe('/');
+ expect(screen.getByRole('tab', { name: 'Community' })).toHaveAttribute('aria-selected', 'true');
+ expect(f.scroll).toHaveBeenCalledOnce();
```
`er1ExploreCommunity.test.tsx`, retained “renders every item newest first, including repeated members, without autoplay and opens displayed order”: only obsolete play count changed:
```diff
- expect(container.querySelectorAll('[data-community-play]')).toHaveLength(1);
+ expect(container.querySelectorAll('[data-community-play]')).toHaveLength(0);
```
`hb6Group1.test.tsx`: removes only media heading variant of “actual business/media heading observes full name and clears on unmount business=%s”:
```diff
- import { LibraryHead } from '@/features/media-library/LibraryChrome';
- return business ? <ClubProfileHero ... /> : <LibraryHead title="Media" nameRef={ref} />;
+ return <ClubProfileHero ... />;
- it.each([true,false])('actual business/media heading observes full name and clears on unmount business=%s',business=>{
+ it.each([true])('actual business/media heading observes full name and clears on unmount business=%s',business=>{
```
Removed `business=false` assertions: `expect(screen.getByRole('button',{name:'Go back'})).toHaveAttribute('data-named','false')`; after intersection, `expect(screen.getByRole('button',{name:'Back from Media'})).toHaveAttribute('data-named','true')`; after unmount, `expect(screen.getByTestId('name').textContent).toBe('')`. They require the retired LibraryHead. Business assertions remain identical.

`canvasSurfaceToken.test.ts`, retained “keeps dark skeletons on the canonical ramp and away from the black shimmer”: only deleted path removed:
```diff
- 'src/components/skeletons/MediaLibrarySkeletons.tsx',
```

## Deleted cases — mediaPageThreeWalls.test.tsx
All four deletions expressly authorised by CM1. Complete original file is retained in `/tmp/cm1/deleted-mediaPageThreeWalls.test.tsx`; exact assertions quoted below.

1. “keeps one title and no duplicate item total in LibraryHead”: `expect(screen.getByRole('heading', { name: 'Media' })).toBeInTheDocument(); expect(screen.queryByText(/items?/i)).toBeNull();` — LibraryHead retired.
2. “uses the exact long-form title fallback and omits an empty creator line”: `expect(screen.getByText('Title wins')).toBeInTheDocument(); expect(screen.getByText('Course wins')).toBeInTheDocument(); expect(container.querySelectorAll('[data-library-video-creator]')).toHaveLength(0); expect(screen.getAllByText('Creator wins').length).toBeGreaterThan(0);` — LibraryVideoCard retired.
3. “keeps clip paging, totals, analytics, viewer origins, and mosaic geometry contracts” — all retired-page source assertions:
```ts
expect(page).toContain('const visibleClips = useMemo(() => clips.slice(0, shown)');
expect(page).toContain('gridTemplateColumns: \'repeat(3, minmax(0, 1fr))\'');
expect(page).toContain('gap: MOSAIC_GAP');
expect(page).toContain('radius={MOSAIC_RADIUS}');
expect(page).toContain('aspect={9 / 16}');
expect(page).toContain('maxPlaying={2}');
expect(page).toContain('clips.length > shown');
expect(page).toContain('setShown((value) => value + PAGE)');
expect(page).toContain("hubCounts.data?.clip_count ?? null");
expect(page).toContain("hubCounts.data?.video_count ?? null");
expect(page).toContain('totalQuery.data ?? null');
expect(page).toContain("openedFrom: source === 'clip' ? 'media-library-clips' : 'media-library-videos'");
expect(page).toContain("openedFrom: tile?.review ? 'media-library-review' : 'media-library-moment'");
expect(page).toContain("analyticsEvents.track('media_library_tile_tapped'");
expect(page).toContain("analyticsEvents.track('media_library_sort_changed'");
expect(page).toContain("analyticsEvents.track('media_library_kind_changed'");
expect(page).not.toContain('AboutSection');
```
4. “makes MediaRailTile additions opt-in so fixed-width rail callers retain their defaults” — removed with expressly authorised whole test-file deletion; product MediaRailTile remains unchanged:
```ts
expect(tile).toContain('fill = false');
expect(tile).toContain('showCaption = true');
expect(tile).toContain('radius = r.sm');
expect(tile).toContain("width: fill ? '100%' : width");
expect(tile).toContain('flex: fill ? undefined : `0 0 ${width}px`');
```

## Null thumbnail and verification limits
Community's MomentTile uses existing CourseImageFallback: null thumbnail renders a deterministic neutral MEMBER_CELL/MEMBER_PANEL gradient and course initials (when a usable course name exists), not a blank image tile. Course/member labels below and rating/duration overlays remain. This is source-confirmed; live rendering was not checked. No poster source or fallback change made.

Authenticated browser verification unavailable (`external_unmanaged`); no credentials requested. URL/component tests and source checks do not establish signed-in end-to-end verification. Full shards and live comparison remain unverified following the required stop.

No guest browsing/test edits, review wizard, news, round plots, SQL/migrations, deployed RPC/edge-function changes, feed_config, round_pool_cap or native/Median changes.