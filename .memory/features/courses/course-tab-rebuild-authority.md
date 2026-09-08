---
name: Course tab rebuild authority
description: Flat sections on the course detail Course tab — section primitive, order, what moved where, reversible decisions and the running dead-file list
type: feature
---

BRIEF_COURSE_TAB_REBUILD. Twelve bordered cards became flat sections plus one named drill-down. Nothing deleted; deep analysis moved behind one link.

**The primitive.** `about/AboutSection.tsx` — 20px gutter, 34px above each section, Discover's 10px heading gap. Headings use the shared, UNMODIFIED `DiscoverSectionHeading`; meta is 11/700 MUTE **sentence case** ("780 rounds", never "780 ROUNDS"). Kicker-only treatments stay 9/700/0.19em uppercase DIM. `Panel` and `CourseCardPanel` are untouched — the tab simply stops calling them. `onMetaPress` exists but is used NOWHERE until specified: a meta that is sometimes a button is a control members cannot learn.

**Chevron law.** Every `›` means navigation. Anything that expands, toggles or opens a sheet uses a different affordance (down/up chevron, or none).

**What moved:**
- Hole-by-hole, par-type bars, SI ladder + explainer → drill-down page `/courses/:courseId/holes`. Withheld entirely in the thin (1–19 rounds) state — the drill-down is the same thin sample seen closer. A member's own hole detail for their own rounds still lives on the You tab, so nothing is lost.
- Five-bar histogram + four category scores → Reviews tab (histogram filters the list, so it belongs beside it). Category scores keep the `t100_subscore_min_ratings` gate.
- Top 100 standing → hero badge only. Not repeated on the tab; extra lists belong on the Top 100 destination.

**Reversible, not retired:** the friends/circle average. Withheld today because at ~22 connected members it is almost always identical to the overall or absent, and naming two people beats their mean. At a few hundred connected members it earns its place back.

**Dead file list (unused, left on disk, nothing deleted until the tab is finished and the whole list has had its outside-importer check):**
- `src/components/courses/course-detail/CourseTop100RankRow.tsx`
- `src/components/courses/course-detail/CommunityScoreCard.tsx`
- `src/components/golf-club/CourseFriendsStrip.tsx` (replaced by `about/WhoPlaysHere.tsx`)
