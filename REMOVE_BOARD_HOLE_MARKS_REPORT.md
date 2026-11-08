# Remove board hole marks — completion report

## Result
Leaderboard and hero rows are single-line with no HoleMarks or key. Leaderboard click/Enter/Space hands the selected player to the parent ScorecardSheet; unlinked rows are inert. Removed LiveBoard's board-hole read and both hero-only reads/fallback. BoardRound, shared mark exports, Also this week and round plots remain unchanged. No SQL, migrations, server/native/Median, feed_config or protected-surface changes.

## Restored spacing
Leaderboard: 12px top/bottom. Historical MiniBoard rule from `1287a09014^`: 5px with live hero shape, otherwise 5px team / 4px player (replaces the two-line 8px player rule). Name gap remains 8px; no faces/tie brackets were restored.

## Files
- `src/features/tourhub/leaderboard/BoardTable.tsx`
- `src/features/tourhub/leaderboard/LiveBoard.tsx`
- `src/features/tourhub/leaderboard/leaderboard.css`
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`
- `src/test/holeTilesBoardBuild.test.tsx`
- `src/test/tourLeaderboardRebuild.test.tsx`
- `src/test/tourOverviewMergedAiry.test.tsx`
- `src/test/tourHeroRefinements.test.tsx`
- `src/test/removeBoardHoleMarks.test.tsx`
- `roadmap.md` and project requirement memory/index.

## Verification
Focused command: `bunx vitest run src/test/removeBoardHoleMarks.test.tsx src/test/holeTilesBoardBuild.test.tsx src/test/tourLeaderboardRebuild.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourHeroRefinements.test.tsx src/test/alsoWeekRebuild.test.tsx src/test/roundPlotLineStrip.test.tsx --maxWorkers=2`: **156/156**.
Four separate sequential commands: `bunx vitest run --shard=N/4 --maxWorkers=2`.
- Shard 1: 2,007 passed.
- Shard 2: 1,855 passed.
- Shard 3: 1,998 passed.
- Shard 4: 1,899 passed.
- Total **7,759 passed**, zero failures, versus last reported **7,749** (+10 from ten cases in `removeBoardHoleMarks.test.tsx`; no deletions or count changes in existing files). Fresh executed test files: 678 (170 + 170 + 170 + 168). Historical test-file count was not verified here.

The ten new cases cover click, focused Enter, Space/unlinked rows, 12px/no-read leaderboard, live/completed hero, pre-tee no-fallback, preserved weekly marks and 18/9-hole plots. The parent target handoff uses the real LeaderboardTab/LiveBoard/BoardTable and substitutes only the sheet view to observe player identity; live sheet data is not verified by that test.

Build telemetry: latest entry reports build OK.

## Screen/device limitations
320/390px fixture screen checks did not complete: importing live React modules into the fixture failed with `React refresh preamble was not loaded. Something is wrong.` No successful screenshots or visual checks are claimed. Auth status is external_unmanaged, so authenticated end-to-end checks are unavailable. Ben's device list: actual leaderboard 320/390 row/tap/scorecard, actual Tour hero 320/390 row/tap/scorecard. Test coverage verifies layout properties and target handoff, not live sheet readback.

## Existing assertion changes (old/new)
No test deleted. Authorized rewrites retain counts:
- holeTilesBoardBuild `the five-item key renders under the board` → `the board renders no hole marks or key`: key non-null / five items → key null / no marks.
- tourLeaderboardRebuild `one inline round is open; tapping toggles it closed` → `row taps open the full scorecard directly without inline expansion`: expansion toggles / aria-expanded → callback identity for both players / no expansion / no aria-expanded.
- tourLeaderboardRebuild `absolute hole tiles render and tie brackets are gone` → `hole marks remain absent with supplied data and tie brackets are gone`: hole 10 birdie → no marks; bracket assertion preserved.
- tourLeaderboardRebuild `full scorecard door invokes the existing target callback` → `row directly invokes the existing full scorecard target callback`: click inline door → door absent and row callback retained.
- tourOverviewMergedAiry live/completed hero padding: 8px → 5px live / 4px completed.
- tourHeroRefinements child-cell filter: exclude mark row → inspect every child because the mark row no longer exists. Geometry assertions unchanged.

### src/test/holeTilesBoardBuild.test.tsx
```diff
```

### src/test/tourLeaderboardRebuild.test.tsx
```diff
```

### src/test/tourOverviewMergedAiry.test.tsx
```diff
```

### src/test/tourHeroRefinements.test.tsx
```diff
```
