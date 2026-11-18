# FEED: community rating removed from the course band on normal posts

Ben's ruling: a post is one golfer's; the band states where it was and links to
the course. The clbhouz community rating (spiral logo + figure, e.g. "9.3") is
gone from line one of PostCourseBand.

## Changes

- `src/components/feed/PostCourseBand.tsx`
  - Deleted the line-one rating block (spiral `<img>` + `formatRatingValue`
    figure).
  - Deleted the `rating` derivation (`ctx?.community_rating ?? courseRating`).
  - Removed the `courseRating` prop from `Props` and the destructure; the band
    no longer reads `ctx.community_rating`.
  - Removed the now-unused `formatRatingValue` import and `MONO` constant.
  - Updated the line-two chevron comment: it no longer references the line-one
    rating; the `marginLeft: auto` and `-4px` optical pull are unchanged.
  - Line one is now the course name (with its chevron door when `onOpenCourse`
    exists) and nothing on the right. Line two (contextual figure + stats-sheet
    chevron) is unchanged. `identityOnly`, `tone`, `surface` and the
    `course_band_tapped` analytics event are unchanged.
- `src/components/feed/FeedCard.tsx`
  - Stopped passing `courseRating` to `PostCourseBand`. `usePostCourseContext`
    and every other `community_rating` consumer (including the
    `CourseStatsSheet` call two lines below) are untouched.

## Tests

- Existing assertions expecting the rating in the band: **none found** — no
  test asserted the spiral image or the band rating figure, so nothing was
  updated or deleted.
- Added `src/test/postCourseBandNoRating.test.tsx` (2 tests):
  1. "renders no spiral image and no rating figure even when a rating is set" —
     `ctx.community_rating = 9.3`; asserts no `<img>` and no "9.3" in the band.
  2. "line two still renders its figure and opens the stats sheet" — figure
     renders and the band tap calls `onOpenStats` once.

## Totals

- Before: 9,077. After: **9,079** (delta +2 = the two new tests above).
- Four shards run sequentially, never in parallel:
  - Shard 1: 2,224 passed (203 files)
  - Shard 2: 2,254 passed (203 files)
  - Shard 3: 2,276 passed (203 files)
  - Shard 4: 2,325 passed (201 files)
- No failures, no reruns, no unhandled errors.
- Typecheck (`npx tsgo -b --noEmit`): clean.

## Not checked

- Signed-in browser/device check unavailable (external unmanaged Supabase); the
  band change is presentational and covered by the new tests.
