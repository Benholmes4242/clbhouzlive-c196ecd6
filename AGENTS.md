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
- The overview's one tournament sentence comes from `tournamentHeadline`/`tournamentHeadlineSegments` in `magazineCopy.ts`: `SituationBand` prints it on every state but a finished result, and on a finished result it lives only in ChampionStrip's narrative (stored narrative first), so one state never carries two prose blocks.
- The Explore Scores lead board renders every row through `BoardRowView` under `BoardHeaderRow`; the first-place podium is its `podium` prop gated on `boardColumns(board).ranked`, so figures come only from `boardValue`/`boardSecondary` and the page cannot disagree with the see-all sheet.
- Board time windows have one vocabulary, `WINDOW_OPTIONS` in `boardFilters.ts`; `WINDOW_SHORT` is only its compact form for middot sample lines, so a window cannot be named two ways on one screen.
- `BOARD_ROW_FLOOR` (`boardFilters.ts`) is the one "fewer rows is not a board" rule for the landing ladder and the Leaderboards page, so the probe and the sections cannot disagree.
- Leaderboard board rows and season rows read one geometry, `ROW_METRICS` (`courseled/rowMetrics.ts`); only the podium owns larger values, so two row components cannot drift apart.
- Rows on the Explore leaderboards screen are separated by space, not by a line. A hairline may separate a different KIND of thing from the rows — column labels from data, a sheet's controls from its list — and may mark a discontinuity in a ranked sequence, which is done with a gap and the amber self treatment rather than a line. A hairline never separates one row from another row.
- Explore leaderboard member avatars render through `MemberAvatar` (`courseled/MemberAvatar.tsx`), whose props describe a subject (id, name, photo, required size) rather than a row, so board and season surfaces cannot grow two avatar treatments.
