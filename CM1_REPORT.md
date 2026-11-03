# CM1 — stopped on new unhandled test error

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