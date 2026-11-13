# Member-shot vertical paging — stopped verification

## Result and stop

Implementation is saved. Focused tests passed 92/92; the preview's latest diagnostic is `build OK` (2026-11-13T21:36:06Z). Full-suite verification stopped at the first shard's unexpected failures. No failing test was edited, and no remaining shard was run.

- `src/test/coursesPhotoTopScrims.test.tsx:56` — `LatestCoursesSection mounts its top layer before its figure and keeps the bottom`.
- `src/test/coursesPhotoTopScrims.test.tsx:97` — `Latest courses large video and small posters keep overlays above isolated media`.
- Both tool errors: `Error: No QueryClient set, use QueryClientProvider to set one`.
- Stack location: `LatestCoursesSection (src/components/courses/browse/LatestCoursesSection.tsx:200:23)` calls the new `useQueryClient` for the required background fills. These tests render without its provider. Tests/production code were not changed to suppress the failures.

Authenticated end-to-end checks are unavailable (`external_unmanaged`); real-member swipes remain unverified. Tests exercise real store opening/selection and append readback, not a browser session.

## Changed functions / store action

- `src/lib/courseMedia/memberShotPosts.ts:157` — new `latestHoleRowsToFeedPosts`: one synthetic post per ready row, `shots:latest-hole:${row.id}`, unchanged shared hole item/caption mapping, RPC order.
- `src/lib/courseMedia/memberShotPosts.ts:164` — new `courseTilesToShotPost`: gallery mapper + existing ready filter, stable media ids in tile order, course-owned placeholder caption. Empty ready sets remain typed placeholders; the existing store excludes media-less pages.
- `src/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia.ts:25` — new exported `galleryCourseMediaQuery`: preserves query key, enabled gate, 120,000ms stale time, 600,000ms GC time and unchanged four-page query function/actor arguments.
- Same file `:71` — `useGalleryCourseMedia` now delegates to the factory.
- `src/store/fullscreenFeedStore.ts:219` — new action signature `appendPostMedia(postId: string, items: MediaItem[])`.
- Same file `:638` — action implementation: only an open post is changed; dedupes against existing and incoming ids; appends in given order; existing item references/order and active pager index stay unchanged; missing post/closed/no additions are no-ops.
- `src/components/courses/browse/LatestHolesSection.tsx:93` — section maps loaded rows with the new builder; `onOpen` at `:120` resolves the tapped page index and uses `courses-latest-holes`. Headers document vertical pages.
- `src/components/courses/browse/LatestCoursesSection.tsx:197` — section retains the pending full-gallery tap flow and stores the loaded rows at tap time.
- Same file `:234` — opening effect creates one post per snapshot course; tapped course receives its full set, others their tiles. Index/shotStartId select the tapped course/media; owner is `courses-latest-courses`.
- Same file `:260` — neighbour-fill effect queries only the current index ±1 window; tapped course is pre-filled; per-open Set prevents duplicate reads, at most three outstanding requests, stale completions cannot append after close/new open; errors keep tiles. Completion resumes pending current-window work after rapid swipes.

`latestHolesToFeedPosts` is retained: `pf2HoleGuide.test.tsx` and existing builder tests still use it; the new parity test also compares its original row caption. HoleWalk, Media tab, layouts/chrome/credits, rail styles/pagination and non-synthetic opens are unchanged. Module-local ownership notes live in file headers, per AGENTS.md's existing rule; no cross-cutting architecture rule changed. No SQL/migrations/feed_config/backend changes.

## Existing assertions changed (no deletions or renames)

### `src/test/latestCoursesSection.test.tsx`

**`BRIEF_CANONICAL_VIEWER_FOR_MEMBER_SHOTS: two posts combine into one five-item carousel in post-then-media order and the tapped shot sets mediaId`**

- Before: `expect(args.posts).toHaveLength(1);`
- After: `expect(args.posts).toHaveLength(3);`
- Before: `expect(args.openedFrom).toBe('course-media');`
- After: `expect(args.openedFrom).toBe('courses-latest-courses');`
- Why: all three loaded course rows now page vertically, while the tapped five-item gallery order and mediaId assertions remain.

**`a processing video is skipped and the later shot is selected by mediaId`**

- Before: `expect(args.posts).toHaveLength(1);`
- After: `expect(args.posts).toHaveLength(3);`
- Why: the loaded courses become separate pages; tapped ready-video filtering and selection assertions remain.

The gallery mock now spreads the original module and overrides only `useGalleryCourseMedia`, preserving the new query-factory export; no assertions were weakened for mocks.

### `src/test/latestHolesSection.test.tsx`

**`a tap opens the canonical viewer readOnly on the tapped shot across the whole rail`**

- Before: `expect(args.posts).toHaveLength(1);`
- After: `expect(args.posts).toHaveLength(3);`
- Before: `expect(args.posts[0].id).toBe('shots:latest-holes');`
- After: `expect(args.posts[0].id).toBe('shots:latest-hole:first');`
- Before: `expect(args.posts[0].mediaItems.map(item => item.id)).toEqual(['first', 'second', 'third']);`
- After: `expect(args.posts.map(post => post.mediaItems.map(item => item.id))).toEqual([['first'], ['second'], ['third']]);`
- Before: `expect(args.index).toBe(0);`
- After: `expect(args.index).toBe(1);`
- Before: `expect(args.openedFrom).toBe('course-media');`
- After: `expect(args.openedFrom).toBe('courses-latest-holes');`
- Why: three ready shots become three single-item pages; second tap selects page 1. mediaId/readOnly/synthetic/no-read/caption shell assertions are preserved.

### `src/test/coursesRailsUnlimited.test.tsx`

**`opens every loaded row in order and selects the tapped second-page shot`**

- Before: `expect(f.open.mock.calls[0][0].posts[0].mediaItems.map((item: { id: string }) => item.id)).toEqual([...Array.from({ length: 20 }, (_, i) => \`h-${i}\`), 'h-50', 'h-51', 'h-52']);`
- After: `expect(f.open.mock.calls[0][0].posts.map((post: { mediaItems: Array<{ id: string }> }) => post.mediaItems[0].id)).toEqual([...Array.from({ length: 20 }, (_, i) => \`h-${i}\`), 'h-50', 'h-51', 'h-52']);`
- Added: `expect(f.open.mock.calls[0][0].index).toBe(21);` and `expect(f.open.mock.calls[0][0].openedFrom).toBe('courses-latest-holes');`
- Why: same 23-row loaded snapshot/order and two rail requests, now vertically paged with the tapped second-page position verified.

No other existing assertions were changed. No existing tests were deleted/renamed; four cases had authorised assertion changes.

## New tests — `src/test/memberShotsVerticalPaging.test.tsx` (+11)

1. `three hole rows produce three ordered single-item pages with byte-identical captions`
2. `null-duration hole videos produce no page`
3. `course placeholders keep three tile ids in rail order and empty member identity`
4. `course placeholders use gallery video mapping and exclude processing videos`
5. `appendPostMedia preserves active items and pager index while appending unique ids in order`
6. `missing post ids, closed viewers and duplicate-only appends are no-ops`
7. `tapping course two opens every loaded course, the tapped full set and other tile sets`
8. `active course two fills only courses one and three and appends resolved media`
9. `rapid vertical changes cap outstanding fills at three and fill only the current window afterward`
10. `failed neighbour reads keep tiles and old completions cannot append after close`
11. `the extracted gallery query preserves keys, lifetimes and RPC actor parameters`

## Commands, totals and inventory

Last full-suite passing baseline: **8,582**. Added **11**, removed **0**; current expected inventory **8,593**, not full-suite verified.

Focused command:
`bunx vitest run src/test/memberShotsVerticalPaging.test.tsx src/test/latestCoursesSection.test.tsx src/test/latestHolesSection.test.tsx src/test/coursesRailsUnlimited.test.tsx src/test/memberShotPosts.test.ts src/test/latestHolesSwipeCaption.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/vertical-focused.json`

**92 executed / 92 passed / 0 failed.**

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1/4 | 2,183 | 2,181 | 2 |
| 2/4 | Unrun | Unrun | Unrun |
| 3/4 | Unrun | Unrun | Unrun |
| 4/4 | Unrun | Unrun | Unrun |

Shard command: `bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/vertical-shard-1.json` (log `/tmp/vertical-shard-1.log`). No aggregate passing full-suite total is claimed. Logs/JSON contain all executed case names; temporary logs are not permanent deliverables.

## Diff statistics

`git diff --cached --stat` before this statistics paragraph was filled:

```text
 .lovable/reports/member-shots-vertical-paging.md   | 110 ++++++++++++++++
 roadmap.md                                         |   7 +
 .../courses/browse/LatestCoursesSection.tsx        |  60 +++++++--
 .../courses/browse/LatestHolesSection.tsx          |  10 +-
 .../courseled/hooks/useGalleryCourseMedia.ts       |  21 +--
 src/lib/courseMedia/memberShotPosts.ts             |  46 ++++++-
 src/store/fullscreenFeedStore.ts                   |  21 ++-
 src/test/coursesRailsUnlimited.test.tsx            |   4 +-
 src/test/latestCoursesSection.test.tsx             |   8 +-
 src/test/latestHolesSection.test.tsx               |  10 +-
 src/test/memberShotsVerticalPaging.test.tsx        | 144 +++++++++++++++++++++
 11 files changed, 405 insertions(+), 36 deletions(-)
```

Only this report's statistics paragraph changed afterward; implementation/test diff is unchanged. No unrelated file changed.