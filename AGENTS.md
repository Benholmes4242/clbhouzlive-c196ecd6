# Architecture rules

- Profile handicap index surfaces use `HcpTrendChart` as their canonical plot renderer, so chart styling and interaction markers stay consistent.
- Every surface that prints a course aggregate rating reads `COURSE_RATING_FLOOR` (`src/features/explore-magazine/courseRatingFloor.ts`), so card, rails and ranker agree on one sample floor.
- Explore score tiles stay full-width and use `SCORE_TRACE_PLOT_HEIGHT`; every tile with settled hole detail renders its trace, matching the All-tab hero.
- Full-width review cards retain the standard photo-overlay preset and share kind-owned height constants with their loading shells, so height adjustments cannot change composition or drift from placeholders.
- Explore Scores renders `ScoresLeaderboardsPage`; its scope control and Filters pill are the shared `ScopeSegments`/`FiltersPill` exported from `ScoresFilterHead.tsx`, so the control exists once.
- Explicitly selected Tour venue photos take precedence in both batch and single-venue image resolution, so Overview and Tournament Detail cannot display different catalogue photos.
- Tour Hub OUR PICKS cards all open the one `PicksSheet`; pick reasons are never padded with filler, so the sheet only prints real model output.
- The Tour overview hero's on-screen state is decided once by `deriveHeroState` in `OverviewHero` and passed down to photo and board; carousel `slide.type` only decides membership and order, so the photo and board cannot disagree.
- The overview hero calls `useLeaderboardRealtime` with `invalidate: 'leaderboard'`, while TournamentPage keeps the default full set, because live sync rewrites every row of the field on each pass and the full set would rebuild the carousel once per row.

- `useLeaderboardRealtime` coalesces row changes on one trailing window (`LEADERBOARD_REALTIME_COALESCE_MS`) for every caller and cancels a pending flush on unmount or tournament change, because live sync rewrites the whole field each cycle and each row would otherwise trigger its own invalidation.
