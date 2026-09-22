# BRIEF_EXPLORE_REVIEW_TILE_A1

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
