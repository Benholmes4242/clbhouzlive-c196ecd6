# Architecture rules

- Profile handicap index surfaces use `HcpTrendChart` as their canonical plot renderer, so chart styling and interaction markers stay consistent.- Every surface that prints a course aggregate rating reads `COURSE_RATING_FLOOR` (`src/features/explore-magazine/courseRatingFloor.ts`), so card, rails and ranker agree on one sample floor.
