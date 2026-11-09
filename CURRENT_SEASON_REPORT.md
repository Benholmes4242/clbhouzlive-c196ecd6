# FIX: current season by date — report

## Helper
`src/features/tourhub/_shared/currentSeason.ts`: `currentSeasonFor(tour)` (+ pure `pickCurrentSeason`). Season of the earliest unfinished event (end_date ≥ today UTC, not cancelled), else of the latest finished event. Reads sr_tournaments ⋈ sr_seasons only.

## Call sites changed
- `hooks/useAIPredictions.ts` `getPgaSeasonId()` → `currentSeasonFor('pga')` (now exported for the test).
- `schedule-v2/useSeasonTimeline.ts` → candidates reordered by `currentFirst()` so the current season is probed first; other seasons stay as fallbacks. The Schedule page has no season switcher, so there's no "next season" control to keep.
- `hooks/useTourHubData.ts` `useTourSeason` final fallback → `currentSeasonFor('pga')`.

## Audit (not changed)
| Site | Picks by | Affected now? |
|---|---|---|
| `useTourHubData.ts:182` first branch | `getFullYear()` (2026) | No; would hit 2027 on 1 Jan, matching the PGA by then |
| `useMergedSchedule.ts:68` | calendar year window | No (all-tours view by date) |
| `overview/data/useRankingsBoards.ts:213,234` | `getFullYear()` season_year | Not today. Euro 26 Nov–31 Dec: "events left" counts the 2026 season (0) |
| `overview/data/useFollowedBoardRows.ts:57` | `getFullYear()` | Same as above |
| `useUpcomingTournaments.ts:46`, `ScheduleTab.tsx:343` | display fallback only | No |
| `useTournamentLastYearTop4/DefendingChamp` | event's own date | No |
| `players-v2/data/resolveStandingsSeason.ts`, `resolvePgaSeasonId` | newest season with player stats | No — 2027 has none (left alone) |

## Today's data (read via public API, 2026-11-09)
pga 2026 (next: Austin Championship), lpga 2026, euro 2026, champ 2026, liv 2026, **pgad 2027**.
Mocked 2026-11-24: euro 2027, champ 2027, pgad 2027, lpga 2026, **pga 2026**.

## Two conflicts for a ruling
1. **Korn Ferry:** its 2026 season ended 11 Oct, so the rule (and the "between seasons → next season" test) gives 2027 today. Step 3 expects 2026. The Schedule page already showed 2027 under the old newest-year code. The Players page is unaffected (it goes by stats).
2. **PGA on 24 Nov:** the Farmers Insurance Skins Game (27 Nov) is stored in pga-2026, so PGA stays 2026 until after it. Step 3 expects 2027. Should unofficial/team events be excluded from the rule?

## Tests
New `src/test/currentSeason.test.ts`, 7 tests: the four rule cases, the async lookup, getPgaSeasonId → 2026 with 2027 present, and the Schedule default. No tests deleted.
Shards (each run separately, --maxWorkers=2): 2,046 / 1,895 / 2,016 / 1,941 = **7,898**, zero failures. 7,891 → 7,898 (+7, all from currentSeason.test.ts).
