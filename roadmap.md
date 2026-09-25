# BRIEF_EXPLORE_REVIEW_TILE_A1

## Explore clap weight and scroll-to-top
- [x] Match the shared clap icon's optical weight to the message icon.
- [x] Reuse the Courses scroll-to-top control across every Explore view.
- [ ] Verify the scrolled phone view, interaction, focused checks, and clean preview build.

- [x] Refactor lead review copy into identity, two-line quote, and optional breakdown rail
- [x] Move review photo count into the top-right glass chip
- [x] Remove only the five verified orphan locale keys across six locales
- [x] Add focused review-tile accessibility, truncation, scope, chip, and regression tests
- [x] Verify six-locale label widths at 390px, Explore tests, typecheck, and screenshot

## Explore news alignment
- [x] Match photo-led news hierarchy to Tour Overview and remove member attribution.
- [x] Verify focused Explore tests and typecheck.

## Personal Bests restore
- [x] Accept Ben's authenticated proof: 24 rows, 13 members, six feat kinds.
- [x] Build and mount `PersonalBestsShelf` in Explore Magazine using the existing hook and `StandoutTile`.
- [x] Preserve server copy and server-side dedup/widening; add no cross-section member budget or empty state.
- [x] Verify 320/390/430, screenshot, focused tests, and typecheck.

## Record margins
- [x] Read gross-record ranks 1 and 2 together and carry the rank-2 margin to record cards.
- [x] Reuse the existing board-movement delta for the callout subline.
- [x] Verify margin/no-margin cards at 390, focused tests, typecheck, and unchanged net record.

## course_par completeness (BRIEF_COURSE_PAR_COMPLETENESS)
- [x] gam-evaluator: par summed only when every hole of whs_scores.total_holes is present, played and has a par; otherwise NULL (both the computeRoundStats path and the no-holes fallback)
- [ ] Ben runs the requeue after deploy

## Round par completeness (client) — 2026-09-22
- Done: `roundCoursePar` in `src/lib/whs/api.ts` (strict `played === true`, must equal `total_holes`, else NULL); RoundDetailSheet now uses it for `coursePar` and `toParVal`.
- Reported, not fixed (Ben to sequence): CardScorecardSheet `totals.toPar` + `totalPar`/`shownPar`, RoundPagePreview `shownPar`, scorecardParts `nineSummary.parPlayed`, ExploreMagazine seed par, roundGross `roundScore`, RoundCardHoleStrip nine deltas, CourseYouTab field par.

## BRIEF_SCORECARD_HEAD_PAR — done
- Round par in the scorecard head now comes only from `roundCoursePar`.
- `CardScorecardSheet` takes `totalHoles` + per-hole `played`; local sum deleted.
- `RoundPagePreview` uses the same rule; `RoundDetailSeed` gained optional `totalHoles`/`played`.
- NULL declared length -> no par. Seed/preview paths have no declared length today (see report).
- Out of scope, untouched: per-nine OUT/IN, totals.toPar, ExploreMagazine:1086, roundGross.ts, RoundCardHoleStrip.

## BRIEF_ROUND_SHAPE_CARRIES_PAR — done
- `useRoundHoleShapes` now reads `gam_round_stats(whs_score_id, course_par)` in the SAME batch as the hole rows (source (a)); `HoleShape.coursePar` carries it. Curve untouched: played filter, MIN_PLAYED_HOLES 9, actual_gross, beads, birdies, fallback all unchanged.
- `RoundDetailSeed.par` added and supplied by ExploreMagazine `seedFor`; the local "sum the seeded pars" derivation is gone, so a ten-hole card no longer prints a to-par against par 40.
- `RoundPagePreview`: `seed.par ?? roundCoursePar(holes, totalHoles)` — never inferred from row count.
- Out of scope, untouched: roundGross.ts (its `coursePar` comes from `usePostRounds` reading `gam_round_stats.course_par`), RoundCardHoleStrip, CardScorecardSheet totals.toPar, per-nine OUT/IN, edge functions, SQL.

## BRIEF_MEDIA_PAGE_THREE_WALLS
- [x] Remove duplicate section wrappers and header count; compact the title/chip/content stack.
- [x] Replace the clips rail with a paged, full-bleed three-column 9:16 wall using the shared tile additively.
- [x] Add the dedicated 16:9 long-form page card while leaving Amateur `VideoRow` untouched.
- [x] Keep the community mosaic, count sources, URL contract, analytics, and viewer origins unchanged.
- [x] Verify 320/390/430 geometry, Amateur rail parity, autoplay behavior, focused tests, and typecheck.

## BRIEF_PARTIAL_CARD_COPY
- [x] Add the shared head’s `· thru N` suffix only when round par is null and played holes exist.
- [x] Remove the empty to-par stat from gross-only rounds when its value is null.
- [x] Verify partial eighteen, complete eighteen, complete nine, gross-only, focused tests, and typecheck.
- [x] Report every other nullable-par round to-par renderer without changing it.

## BRIEF_HOLE_STRIP_NINE_COMPLETENESS
- [x] Require exactly nine strictly played holes with non-null par before rendering a nine's delta.
- [x] Keep hole marks, gross totals, and complete-nine rendering unchanged.
- [x] Verify partial eighteen, complete eighteen, complete nine, focused tests, full suite, and typecheck.
- [x] Report the par source for the seven named unchanged to-par sites.

## BRIEF_FEED_PARTIAL_ROUND_THRU
- [x] Carry `whs_scores.total_holes` through the existing batched feed-round read.
- [x] Preserve hole arithmetic while exposing `thru` only for provably partial scored cards.
- [x] Render lowercase `· thru N` beside partial feed scores; leave complete and WHS fallback output unchanged.
- [x] Prove partial eighteen, complete eighteen, complete nine, and picked-up fallback behavior.
- [x] Report every other `roundScore` consumer without changing it; run the full suite and typecheck.

## BRIEF_LEGEND_JOINT_RANKS — done
- `legendRanks.ts`: `assignCompetitionRanks` (1224, equality on `Number(value).toFixed(6)`, never `===`) + `crownSetDelta` (rank-1 set diff). Sort order untouched.
- `recomputeLegend`: one `ranked` array feeds the write-skip signature AND the insert; crown path is set-based — enter = legend_earned, leave = legend_lost, in both = nothing; `recomputeLegendTitles` runs for every entering or leaving user.
- Historic silence: `isTriggerFreshForCrownNotice` (LEGEND_NOTIFY_MAX_AGE_DAYS = 2 on play_date) + all-time-only gate. No new suppression added.
- [ ] Ben runs the backfill requeue after deploy (read-only survey: 174 boards, 325 rows change rank, 99 become joint first).

## BRIEF_CONTESTED_TITLES — done (server only)
- `legendTitles.ts`: `boardKey` / `contestedBoardKeys` (> 1 claimant, no larger floor) / `countContestedTitles`. Joint firsts count.
- `recomputeLegendTitles`: `computeContestedTitleCount` is the one number; the milestone upsert and `legendTitleTier(count)` read the same binding. count 0 still deletes the badge row.
- New action `recompute_legend_titles` (dry run unless apply), whole pass under REBUILD_SUPPRESS -> enqueueNotification no-ops; tier drops were already silent.
- [ ] Ben runs the counter_tiers [1,15,60] SQL and then the backfill (dry run first).

## BRIEF_TROPHY_ROOM_STANDINGS — done
- `useMemberStandings` (one rpc call, keyed on user id, mirrors useRoundAwards), `career/standings.ts` (rules: tiedWith, discState 4 states, formatValue, standingLine, groupStandings, courseSubline), `career/panels/StandingsPanel.tsx`, mounted in `CareerRecordSheet` after Course Records. `REC.FAINT` added for the placed disc border.
- The UI derives nothing but `tied_with` and |value − column|. Tenure boards render with no disc.
- Out of scope, untouched: the course You tab, `get_member_standings`/any SQL, legends/ranks/titles/badges/notifications, the room's other sections.
