# C3 — Two course-rating colour systems

## Build
- Route every named rating **display** through `courseSubScoreTone`: review rails/cards/sheets, course and business ratings, Top 100 statistics, business review summaries, and the shared `SubScoreBar` / `SubScoreStack` presentations.
- Replace ReviewBottomSheet's remaining inline 9.0 check with the same helper.
- Preserve the two viewing-member “yours” amber treatments and add short comments so they cannot be mistaken for score bands.
- Keep the review composer and its three-band `bandColor` / `bandColorOnDark` API unchanged; update `scoreBands.tsx` documentation to define that composer-only boundary.
- Normalize ExploreCard and CourseShelf through `courseSubScoreTone`. Keep near-white only where the rating sits directly over photography, with an explicit legibility comment; use the helper's green for 9.0+.
- Do not change `ratingTier.ts`, `COURSE_RATING_THEMES`, `postHelpers.ts`, or any data path.

## Audit report
- Document that `RatingPill` is used by the two layouts in `TieredCourseCard`, where it colours existing profile course-rating pills; these are display surfaces, but remain unchanged in this brief as requested.
- Document that `postHelpers` combines the collapsed amber `COURSE_RATING_THEMES` with amber overlay tokens for review-post pills, borders, container washes, and overlay text used across Clubhouse/Profile/Preview review-post presentations; leave it unchanged.

## Verification
- Extend focused rating-consistency tests to cover every named display caller, the 9.0 threshold, preserved “yours” ambers, the unchanged composer imports/behavior, and untouched independent amber sources.
- Verify the Courses Latest reviews rail renders 8.3 muted and 9.0 green.
- Verify Tralee remains 9.8 / 9.3 / 9.1 green and 8.7 muted.
- Run the focused tests and TypeScript check; leave SQL, Tour, schedule, and unrelated data untouched.
