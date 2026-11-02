# Players page — Build 1 of 3 (merge Players and Leaders)

## What shipped
- `/tourhub?tab=players` is a **front page** (hero, situation sentence, race clock, one card per featured `tour_stakes` line in `sort` order, The race, Your players, In form, Stat leaders, All players button) and a **full field** (`?view=all`) with three lenses: Standings, Form, Stats (`&lens=`, `&stat=`).
- Leaders is removed: `TourHubTab` loses `'leaderboards'`; side menu has five items; Tour glance loses its Leaders tile.
- Redirects: `?tab=leaderboards` and `?tab=player-stats` → `tab=players&view=all&lens=stats` (tour kept); `/tourhub/season-stats?tour=X` → same via `SeasonStatsRedirect` (replace). World rankings See all → `view=all&lens=stats&stat=world_rank`.
- New files: `players-v2/playersRules.ts`, `playersModel.ts`, `pageModel.ts`, `playersTokens.ts`, `PlayerCell.tsx`, `front/FrontPage.tsx`, `field/FullField.tsx`, `field/FormTiles.tsx`, `SeasonStatsRedirect.tsx`, `data/{useTourRace,useStandingsMovement,useFieldForm,useScorecardStats}.ts`.
- Moved: `leaders-v2/data/useLeaderCategories.ts` → `_shared/stats/useLeaderCategories.ts` (eight consumers repointed; query key unchanged).
- Deleted: `leaders-v2/{LeadersTab,FullListSheet,SeasonStatsIndex,seasonMagazine}.ts(x)`, `leaders-v2/boards/AlmanacBoards.tsx`.
- Extended: `usePlayersRanking` (player key, raw name, timestamp, PGA stat columns), `useLivePlayerIds` (`thru`). `TourSideMenu` now exports `DESTINATIONS` (for the menu test only).
- Types were already current; no regeneration needed. No negative letter-spacing on the page.

## Data notes
- **Season year:** `currentSeasonYear()` rolls to 2027 in October, but the live race rows are `season_year = 2026` (FedEx Fall runs to 22 Nov). `useTourRace` now reads the newest `tour_races` row not past `currentSeasonYear()` and the movement/form/scorecard reads use that row's year. Without this the page showed no lines, no clock and an empty Form lens.
- `get_tour_field_form.starts` is not documented in the repo; the live shape is `[{label, position, end_date, tournament, tournament_id}]`, which the parser handles.
- Checked against live data at 390px: front page (FedEx Cup, two line cards at 100 and 60, clock "3 to go"), Form lens and Stats lens all render.

## Tests
- Added `src/test/playersRules.test.ts` (34): headline thresholds and final, gap lines at ±3 places, MC=70 / min three starts / tie by rank, T1 ties, 15-start and 30-round qualification, zero excluded from counts, five name examples, situation sentences (two lines, one line, final), seven stat gap phrases plus shared lead and world rank, three redirects.
- Added `src/test/playersPage.test.tsx` (12): line cards in sort order with three rows either side, Your players hidden/shown, clock counts, All button opens `?view=all`, no race row invents nothing, lens chips update URL, PGA vs non-PGA pills, line after every stake (featured or not), movement "–", season-stats redirect, five side-menu items, field rows.
  - While writing it, one of my own new assertions failed because the sample field had 120 rows and the test drew a line at 125; I moved that sample line to 110. No existing test involved.
- Deleted `src/test/seasonMagazine.test.ts` (5 tests; its module was removed by the brief): "uses the mandated fallback threshold", "excludes earnings and caps a player at two selected modules", "returns an explicit module count and reduced-layout decision", "limits tied lists to notable performance categories", "does not count race rows or tied-list membership as featured roles".
- `src/test/tourIsland.test.tsx`: glance tile counts six/five → five/four (Leaders tile removed). Count of tests unchanged.
- `src/test/playerSeason.test.ts`: import path only.

## Totals
`npx vitest run --shard=N/4 --maxWorkers=2`: 1,479 + 1,419 + 1,502 + 1,429 = **5,829/5,829 across 537 files**, no failures, no pre-existing failures.
Against the WS1 baseline 5,788/536: +46 new − 5 deleted = **+41 tests**; +2 − 1 = **+1 file**.
`tsc --noEmit -p tsconfig.app.json` clean.

## Not done / open
- On-device check of the mock match (names truncate in the Form lens at 390px).
- No SQL, migrations, RPC/edge edits, `feed_config` or `round_pool_cap` changes, no native/Median changes.
