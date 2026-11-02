# WS2 — Explore Watch, section 2 (Shorts and middle shelves)

## Diff
New:
- `src/features/explore-magazine/watch/watchMiddle.ts` — RPC row types, shelf/page constants, visibility rules, labels, encoded region paths, keyset cursor, short age, row mapping.
- `src/features/explore-magazine/watch/useWatchMiddle.ts` — `useCourseVideos`, `useWatchRegions`, `useRegionCourses`, `useGridVideos` (30 per page), `fetchGridPage`; existing RPCs only.
- `src/features/explore-magazine/watch/openVideoList.ts` — opens the canonical viewer on the loaded list.
- `src/features/explore-magazine/watch/CourseVideosShelf.tsx` — signed-in; hidden under two videos or on error; See all → `/watch/courses`.
- `src/features/explore-magazine/watch/RegionsShelf.tsx` — signed-in; hidden under three regions or on error; "Your patch" marker.
- `src/pages/WatchGridPage.tsx` — region/course grids, course chips, empty state, keyset pagination.
- `src/test/ws2WatchMiddle.test.tsx` — 18 tests.

Changed:
- `src/App.tsx`, chrome registry — two routes.
- `WatchFeed.tsx` — Quick hits heading → "Shorts" / "Under three minutes"; shelves inserted after Rounds this week, before Watch, on For you.
- Six locale files.
- `src/test/rsRoundsShelf.test.tsx` — one stand-in (below).

## Routes added
- `/watch/region/:region`
- `/watch/courses`

## Accepted as built (WS2.1 §3)
- Tile age: "3d" within a week, "Apr" earlier this year, "Apr 2025" before that.
- Viewer swipes within the loaded list only.

## Stand-in (WS2.1 §1, approved)
```ts
/* WS2 — the course and region shelves read their own RPCs; empty here. */
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useCourseVideos: () => ({ data: [], isLoading: false, isError: false }),
  useWatchRegions: () => ({ data: [], isLoading: false, isError: false }),
  useRegionCourses: () => ({ data: [], isLoading: false, isError: false }),
  useGridVideos: () => ({ data: undefined, isLoading: false, isError: false, hasNextPage: false, fetchNextPage: () => {} }),
}));
```
Placed after the WS1 stand-ins. `fetchGridPage` is not mocked: the brief named four hooks, and nothing rendered in that file calls it.

## Test changes old → new
- `rsRoundsShelf.test.tsx`: no assertion, title or case changed. The two tests that failed with `No QueryClient set, use QueryClientProvider to set one` now pass:
  - "shows on the For you chip for a signed-in member, after Quick hits, and not on other chips"
  - "is absent for a signed-out visitor"
- `ws2WatchMiddle.test.tsx`: new, 18 tests.
- No tests deleted, renamed or rewritten.

## Results
- Focused: rsRoundsShelf 22/22, ws2WatchMiddle 18/18.
- Full suite, `--maxWorkers=2`: shard 1 1,481/1,481 (136 files); shard 2 1,433/1,433 (136); shard 3 1,533/1,533 (136); shard 4 1,437/1,437 (133).
- **Total 5,884/5,884 across 541 files.**
- Against the 5,866/540 baseline: +18 tests/+1 file, all from `ws2WatchMiddle.test.tsx`. No other delta.
- Pre-existing failures: none.

## Protected scope
No SQL, migrations or migration files. No deployed RPC/edge function edits. feed_config untouched. round_pool_cap stays 30. No native/Median changes.

## Not checked
The live preview on a phone.
