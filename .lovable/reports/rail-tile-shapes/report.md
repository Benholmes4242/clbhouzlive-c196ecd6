# Landscape rail tiles — stopped verification

## Implementation
Stored landscape and square media choose 252 × 216; portraits and missing sizes choose 156 × 216. Dimensions come only from existing media rows, never image load or poster measurement. Existing overlays, scrim, spacing, radius, taps, pending bars and non-photo card widths are preserved. No SQL, migrations or feed_config changes.

The reference mock's pre-existing overlay typography/insets differ from the running rail. The brief explicitly freezes overlay styling, gap and padding, so those remain unchanged; only the requested shape changes were applied.

## Files and lines
- `src/components/courses/browse/railTileHeights.ts:10` — shared finite positive 0.95 threshold and 252 width.
- `src/components/courses/browse/useNewestCourseMedia.ts:59` — carry raw media row width/height, including video.
- `src/components/courses/browse/RegionRails.tsx:45` — member-media width selection; fallback remains 156.
- `src/components/courses/browse/usePlayedTile.ts:28` — optional geometry fields and raw hole/course mapping.
- `src/components/courses/browse/PlayedTile.tsx:169` — photo buttons take shared width; pending and other cards unchanged.
- `src/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia.ts:55` — carry raw sizes separately; existing viewer geometry defaults retained.
- `src/components/media-system/types/media.ts:17` — optional raw gallery geometry fields.
- `src/test/railTileShapes.test.tsx:7` — 22 new cases; no existing case edited.

## Unexpected failure — verification stopped
Command:
`./node_modules/.bin/vitest run src/test/railTileShapes.test.tsx src/test/playedMemberMediaAutoplay.test.tsx`

28 executed: 6 passed, 22 failed across 2 files. All 22 new cases failed in their common setup, before their assertions:

```text
TypeError: Cannot redefine property: IntersectionObserver
 ❯ src/test/railTileShapes.test.tsx:32:38
```

No test was repaired or rerun after the failure. Full output: `.lovable/reports/rail-tile-shapes/focused.log`.

The completed-edit preview also reports this surviving type error:

```text
--- typecheck ---
src/test/railTileShapes.test.tsx(26,15): error TS2352: Conversion of type '{ courseId: string; activity: number; rows: { whs_score_id: string; course_id: string; course_name: string; user_id: string; display_name: string; profile_photo_url: null; gross_score: number; course_par: number; play_date: string; total_count: number; }[]; reviews: ...; posts: number; faces: ...; best: null; latest...' to type 'CourseGroup' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Type '{ courseId: string; activity: number; rows: { whs_score_id: string; course_id: string; course_name: string; user_id: string; display_name: string; profile_photo_url: null; gross_score: number; course_par: number; play_date: string; total_count: number; }[]; reviews: ...; posts: number; faces: ...; best: null; latest...' is missing the following properties from type 'CourseGroup': latestDate, latestKey

=== build 2026-11-21T14:09:40Z ===
--- typecheck ---
src/test/railTileShapes.test.tsx(26,15): error TS2352: Conversion of type '{ courseId: string; activity: number; rows: { whs_score_id: string; course_id: string; course_name: string; user_id: string; display_name: string; profile_photo_url: null; gross_score: number; course_par: number; play_date: string; total_count: number; }[]; reviews: ...; posts: number; faces: ...; best: null; latest...' to type 'CourseGroup' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Type '{ courseId: string; activity: number; rows: { whs_score_id: string; course_id: string; course_name: string; user_id: string; display_name: string; profile_photo_url: null; gross_score: number; course_par: number; play_date: string; total_count: number; }[]; reviews: ...; posts: number; faces: ...; best: null; latest...' is missing the following properties from type 'CourseGroup': latestDate, latestKey
```

The fixture was left untouched under the explicit STOP rule. The app is not reported as passing or complete.

## Suite accounting and shards
Supplied last passing baseline: 9,491 tests / 848 files.
Intervening Members commit `e816b82bc4`: +37 cases in `src/test/adminMembersV3.test.tsx`, +1 file; the previously reported Members verification completed only shards 1–2 (2,352 / 2,324). Its remaining shards are not verified here.
This request: +22 cases in `src/test/railTileShapes.test.tsx`, +1 file. No deleted, renamed or rewritten existing cases in this request.
Expected source inventory before this request: 9,528 / 849; expected after: **9,550 / 850** = 9,491 + 37 + 22. These are reconciled expected totals, not a verified full-suite passing total.

`./node_modules/.bin/vitest list --json` timed out at 600 seconds, leaving no valid inventory. No additional test run was used to obtain counts after the stop.

| Requested shard | Result |
|---|---|
| 1/4 | Not run — stopped on focused failure |
| 2/4 | Not run — stopped on focused failure |
| 3/4 | Not run — stopped on focused failure |
| 4/4 | Not run — stopped on focused failure |

## First-paint widening and captures
Source behavior: a cold, visible region card starts at 156 and can widen when its deferred stored-size read supplies landscape/square member media. This is one settlement-induced widening, not an image-load resize. A cached landscape row is wide immediately; portraits, missing sizes and absent member media do not widen. PlayedTile hides photos until ready, so each photo's geometry is available at first render.

Real-session frequency is **unverified**. No authenticated readback is available for this external/unmanaged project. The requested 390/320 mixed portrait/landscape region and photo-row captures were not produced after verification stopped; layout safety and visual match are not claimed.

## New rail cases by name
- railTileWidth(%s, %s) returns %s | [4032, 3024, 252]
- railTileWidth(%s, %s) returns %s | [1000, 1000, 252]
- railTileWidth(%s, %s) returns %s | [1080, 1920, 156]
- railTileWidth(%s, %s) returns %s | [950, 1000, 252]
- railTileWidth(%s, %s) returns %s | [940, 1000, 156]
- railTileWidth(%s, %s) returns %s | [null, 1000, 156]
- railTileWidth(%s, %s) returns %s | [1000, null, 156]
- railTileWidth(%s, %s) returns %s | [0, 1000, 156]
- railTileWidth(%s, %s) returns %s | [1000, 0, 156]
- railTileWidth(%s, %s) returns %s | [NaN, 1000, 156]
- railTileWidth(%s, %s) returns %s | [1000, NaN, 156]
- railTileWidth(%s, %s) returns %s | [Infinity, 1000, 156]
- railTileWidth(%s, %s) returns %s | [1000, Infinity, 156]
- region member media %s x %s uses %s by 216 | [4032, 3024, 252]
- region member media %s x %s uses %s by 216 | [1080, 1920, 156]
- region member media %s x %s uses %s by 216 | [null, null, 156]
- region fallback without member media stays 156 by 216
- region card widens once on deferred media settlement and never on image load
- region video width uses the media row geometry, not its poster
- PlayedTile landscape hole and course photos are 252 and portrait is 156, all 216 tall
- PlayedTile pending bars stay 156 and do not render photos before ready
- gallery mapping carries raw dimensions while retaining viewer fallbacks for unknown sizes

## Intervening Members cases (+37)
- classifies known weekly new back kept lost and conserves both active sets
- kept percentage and in-per-out ratio use the latest previous active denominator
- no losses reports none lost and no previous active members reports an em dash
- new membership uses exclusive start and inclusive end bucket boundaries
- skips activity arrays not exactly eight booleans
- empty membership gives seven zero weeks without throwing
- incomplete membership suppresses lifecycle active and to-connect figures
- complete membership renders latest active figures and delta through tone markers
- loading lifecycle keeps em dashes without partial bar titles
- includes unconnected non-pro members at the two-day and fourteen-day boundaries
- excludes connected members
- excludes verified pros
- excludes members joined under two days ago
- excludes members last seen over fourteen days ago
- excludes never-seen members
- keeps the to-connect count absent until the verified payload settles
- a failed verified read never publishes a stale to-connect count
- %s sorts the whole membership before paging | ['seen', ['d', 'a', 'b', 'c']]
- %s sorts the whole membership before paging | ['joined', ['c', 'b', 'd', 'a']]
- %s sorts the whole membership before paging | ['index', ['b', 'a', 'd', 'c']]
- %s sorts the whole membership before paging | ['rounds', ['d', 'b', 'a', 'c']]
- the sort URL drives row order and retains linked filter intent
- a joined sort URL actually renders newest members first
- sorting precedes the existing twenty-five-row paging
- chip order is All Verified Connected To connect No handicap Quiet New and wraps
- tapping an active chip returns to All without removing the sort
- typing on Verified switches to All and preserves the search
- %s drops its own tag before the two-tag limit | ['new_this_week', { is_new: true }, 'New']
- %s drops its own tag before the two-tag limit | ['quiet', { is_quiet: true }, 'Quiet']
- %s drops its own tag before the two-tag limit | ['no_handicap', {}, 'No hcp']
- %s drops its own tag before the two-tag limit | ['to_connect', {}, 'No hcp']
- dropping New happens before limiting tags so Quiet remains visible
- to-connect activity ignores all pre-join buckets
- to-connect activity uses singular wk for one eligible bucket
- to-connect pros retain their canonical pro subline
- negative indexes render a true minus and quiet rows carry the bad tone marker
- scoped presentation contains no forbidden colour weight size or truncation patterns
