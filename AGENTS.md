# Architecture rules

- Profile handicap index surfaces use `HcpTrendChart` as their canonical plot renderer, so chart styling and interaction markers stay consistent.
- Every surface that prints a course aggregate rating reads `COURSE_RATING_FLOOR` (`src/features/explore-magazine/courseRatingFloor.ts`), so card, rails and ranker agree on one sample floor.
- Explore score tiles stay full-width and use `SCORE_TRACE_PLOT_HEIGHT`; every tile with settled hole detail renders its trace, matching the All-tab hero.
- Full-width review cards retain the standard photo-overlay preset and share kind-owned height constants with their loading shells, so height adjustments cannot change composition or drift from placeholders.
- Explore Scores renders `ScoresLeaderboardsPage`; its scope control and Filters pill are the shared `ScopeSegments`/`FiltersPill` exported from `ScoresFilterHead.tsx`, so the control exists once.
- Explicitly selected Tour venue photos take precedence in both batch and single-venue image resolution, so Overview and Tournament Detail cannot display different catalogue photos.
