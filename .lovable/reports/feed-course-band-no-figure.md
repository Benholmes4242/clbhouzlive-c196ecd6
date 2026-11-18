# FEED: course band loses the rounds-tracked figure (PostCourseBand via FeedCard)

## What changed

- `src/components/feed/FeedCard.tsx`
  - `PostCourseBand` is no longer passed `ctx` or `onOpenStats`. With no ctx,
    `pickCourseBandFigure` returns null, so line two shows only the location
    and the band is not a tap target. The course name stays a door to
    `/courses/:courseId` exactly as before.
  - Removed the `statsOpen` state and the `CourseStatsSheet` render (and its
    import) that only this band opened. `CourseStatsSheet` itself stays;
    GolfClubView and AgainstYourGolfSection still use it.
  - Kept the `courseContext` prop and the `hasCourse` check exactly as they
    were: the band still renders on a post whose only course link is the
    batched context. `usePostCourseContext` and its RPC are untouched.
  - Did NOT use `identityOnly` (it would report the course-name tap as
    surface `review_post`). Normal posts keep surface `post`.
- `src/components/feed/PostCourseBand.tsx`: no change. Review cards and the
  light profile feed keep their figure and stats sheet.

## Consequence to note

`course_name_tapped` from the feed band now tracks `course_id: null`, because
the band no longer receives ctx (the id source for that event). The brief
required surface `post`, which is preserved; passing ctx only for analytics
would have brought the figure back.

## Tests

- Updated assertions expecting the figure/chevron/stats sheet from the feed
  band: NONE. The only figure/stats assertions anywhere were in
  `postCourseBandNoRating.test.tsx`, which renders `PostCourseBand` directly
  with ctx + onOpenStats — the component is unchanged, so those still hold
  and were left alone.
- Added `src/test/feedCourseBandNoFigure.test.tsx` (2 cases):
  1. A feed post whose course context has 977 rounds and a best of 68 renders
     no figure, no chevron button and no stats sheet, and keeps the location
     line.
  2. Tapping the band opens nothing and fires no `course_band_tapped`; the
     course name still navigates to `/courses/c1` with
     `course_name_tapped` surface `post`.

## Suite totals

- Before: 9,093. After: **9,095** (+2, the two new cases; none deleted or
  rewritten).
- Four shards run sequentially, never in parallel:
  - Shard 1: 2,226 passed (204 files)
  - Shard 2: 2,258 passed (204 files)
  - Shard 3: 2,286 passed (204 files)
  - Shard 4: 2,325 passed (201 files)
- No failures, no reruns.
- Typecheck (`npx tsgo -b --noEmit`): clean.

## Not checked

Browser/device rendering of the band; the change is prop removal verified by
tests only.
