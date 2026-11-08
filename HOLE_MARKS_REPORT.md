# Hole marks build report

## Files changed
- `src/features/tourhub/leaderboard/BoardRound.tsx`: added the shared `HoleMarks` and `HoleMarksKey` components, the `holeMarkGrade` helper and opaque row-tint surfaces. These replace `HoleTiles`.
- `src/features/tourhub/leaderboard/leaderboard.css`: added the mark geometry (birdie circle, eagle double circle, bogey square, double square, triple filled square, unplayed dot), the 4px nine gap and the key swatches. Removed the tile rules.
- `BoardTable.tsx`: rows now use HoleMarks with the row surface, and HoleMarksKey replaces the tile key.
- `MiniBoard.tsx`: rows now use HoleMarks, and HoleMarksKey sits inside the board container.
- `AlsoWeekEvent.tsx`: rows now use HoleMarks with the canvas or "yours" surface.
- `roundTilePlot.tsx`: now uses HoleMarks with the `FEED_CARD_SURFACE` surface.
- Steps 1, 3, 5 and 6 were already built in the previous hole-tiles build: B2 rows, no faces, no tie brackets, the #C24A4A down arrow, settled rounds at opacity 1, no tour rings and CompetitionMark.

## Updated assertions (old → new)
- `alsoWeekSpacing`: `.also-br` `min-height:33px` → `padding:9px 0`. Your row `padding:0 20px` → `9px 20px`. `gap:8px`/`size=22` → no `SquircleAvatar`. Tie bracket `left:19px/39px` → no `.tour-tie` block. `.also-avatar` squircle rules → absent.
- `playerInitialAvatar` (2): `childElementCount` 2 (ring) → 1.
- `tourOverviewDesignA`: POS header `center` → `left`.
- `tourOverviewMergedAiry`: hero row paddingTop `5px` (live) / `4px` (completed) → `8px`.
- `cb57HeroBoardRemovals`: five `[data-hero-tie-bracket]` → zero.
- `feedGrossDots` (2): `[data-plot-hole]` fills → `[data-hole-mark]` grades (birdie ×5, no eagle).
- `tourHeroRefinements`: the centred-cell loop skips the new `[data-hole-marks]` line-2 child.
- `holeTilesBoardBuild`, `roundPlotLineStrip`, `tourLeaderboardRebuild`: tile selectors → mark selectors. The tile-colour test was replaced by grade/par/surface/key tests (12 → 14 tests).
- No tests were deleted.

## Shards (`--maxWorkers=2`)
- Shard 1: 2001 passed, 6 failed (2007)
- Shard 2: 1855 passed
- Shard 3: 1992 passed
- Shard 4: 1895 passed
- Total: 7743 passed, 6 failed, 7749 tests. The previous count was 7747; the +2 comes from `holeTilesBoardBuild`.

## Stop: 6 unexpected failures, all "No QueryClient set"
These tests render components that now call `useBoardHoles` or `useBatchRoundCompetition` without a QueryClientProvider. Fixing them needs a test-harness change that the brief does not authorise:
- `alsoWeekSection.test.tsx` (4)
- `homeRailEmpty.test.tsx` (1)
- `searchOrderAndFallback.test.tsx` FIX3 IN ACTION (1)

The logs are in `docs/verification/marks/shard1b.log`.

## Not checked
The browser checks at 320, 390 and 430px were not run, because signed-in checks are not available. How the double square reads at 320px has not been checked visually. By the CSS, a cell at 320px is about 13px wide, so the double square is 13px with a 1.6px gap, and the inner line should still show.
