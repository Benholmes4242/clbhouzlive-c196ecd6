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

## Follow-up event gate — ruling applied (9 November 2026)

The earlier conflicts are resolved: Korn Ferry 2027 is correct; accept Skins Game as stored. No name, status or data exclusions were added. Hero World Challenge holds PGA on 2026 through 6 December; handover is 7 December. No SQL or migrations were run, and no schedule was installed.

### Changes and deployment
- `src/features/tourhub/_shared/currentSeason.ts`: event_type in select/type, stroke/team gate in the shared base used by BOTH pending and finished queries, identical pure-picker gate and header comment.
- `overview/data/useRankingsBoards.ts`: currentSeasonFor year with calendar fallback; shared unfiltered list-year probe; previous-year fallback when the current list has zero rows; eventsLeft null on fallback. Counts accept only scheduled/created stroke/team in the resolved season.
- `overview/data/useFollowedBoardRows.ts`: shares that list-year probe, so an absent followed player cannot cause a different-year board. PGA/OWGR statistics path unchanged.
- `supabase/functions/scrape-tour-rankings/{index,seasonYear}.ts`: EURO server mirror, explicit body.year precedence, UTC-calendar fallback on missing/failed reads; 50-row floor unchanged. `scrape-season-rankings` untouched.
- Deployment tool confirmed `scrape-tour-rankings` successfully deployed, source SHA256 `d5b63086d9a606c0f8297b07b612cb8eec86265f1bcb7748a511a39b100a5eed`. No scrape or prediction generation was invoked. Hosted execution of the new default was not exercised.

### Original stop check and current data
The previous turn's reported pre-change check is retained as historical evidence; it was not repeated as SQL. This turn independently re-read public PostgREST data. Full results including remaining 2027 events: `docs/verification/current-season-gate/data.json`.

| Event | Type | Status | Start–end | Season |
|---|---|---|---|---|
| VidantaWorld Mexico Open | stroke | closed | 29 Oct–1 Nov | 2026 |
| World Wide Technology Championship | stroke | closed | 5–8 Nov | 2026 |
| Austin Championship presented by Compliance Solutions | stroke | created | 12–15 Nov | 2026 |
| The RSM Classic | stroke | scheduled | 19–22 Nov | 2026 |
| The Farmers Insurance Skins Game | stroke | created | 27 Nov | 2026 |
| Hero World Challenge | stroke | scheduled | 3–6 Dec | 2026 |
| The American Express | stroke | scheduled | 21–24 Jan 2027 | 2027 |

### Five-date checks: same pending/finished queries as the app
These are date-parameterised public reads of today's stored data, not assertions that future imports/statuses are already known.

| Tour | 9 Nov | 24 Nov | 30 Nov | 7 Dec | 20 Dec |
|---|---:|---:|---:|---:|---:|
| PGA | 2026 | 2026 | 2026 | 2027 | 2027 |
| LPGA | 2026 | 2026 | 2026 | 2026 | 2026 |
| DP World | 2026 | 2027 | 2027 | 2027 | 2027 |
| Champions | 2026 | 2027 | 2027 | 2027 | 2027 |
| LIV | 2026 | 2026 | 2026 | 2026 | 2026 |
| Korn Ferry | 2027 | 2027 | 2027 | 2027 | 2027 |

All match the revised expectations. PGA next pending row: Austin on 9 Nov, Skins on 24 Nov, Hero on 30 Nov, American Express on 7/20 Dec. LPGA/LIV remain 2026 where no later eligible season is available.

**DP World on 30 Nov with today's rankings:** resolved season 2027, but no 2027 list rows. Board therefore shows the 2026 top five (Eugenio Chacarra, Rory McIlroy, Patrick Reed, Casey Jarvis, Aaron Rai) and **omits events-left entirely**. If a valid 2027 list arrives before then, the board/followed rows use 2027 and count its scheduled/created stroke/team events instead.

### Skins Game at mocked 24 November — report only
Public data confirms stroke/created, 27 November, venue Atlantic Fields Club, par 71, null purse, defending_champion Keegan Bradley. Current public reads return zero tee-time rows and zero leaderboard rows. This is current data under a mocked date, not a forecast of November 24 field publication.

1. **Overview PGA slide:** Skins is the next upcoming PGA candidate, not Hero. Cache includes stroke/team scheduled/created ordered by start (`src/hooks/useTournamentsCache.ts:120–130`); carousel buckets by tour (`useHeroCarouselData.ts:365–395`) and selects upcoming[0] for PGA (`:478–485`). A normally resolved RSM result remains on 24 Nov because it is two days old and Skins is THREE days away: the result gate requires age≤3 and daysToNext>2 (`:525–544`). Thus the default primary PGA slide can still be **RSM completed on 24 Nov**, not an upcoming slide. If the upcoming Skins slide is selected/reached (or completed RSM data is absent), its upcoming presentation never renders a stroke leaderboard: `HybridHeroBands/HeroBoardBand.tsx:334` explicitly excludes upcoming from hasBoard, with MiniBoard gated at `:468`. It renders the tour chips (`OverviewHero.tsx:434–452`), available upcoming facts/followed/last-year/course sections (`HeroBoardBand.tsx:486–510`) and prediction chips only if contenders exist (`:339–340,488–506`). Field count/draw facts are data-dependent, not a full unconditional field board (`useUpcomingOverview.ts:11–30`, `UpcomingOverviewSections.tsx:13–24`). A stale closed RSM with unconfirmed tied winner can instead remain live (`useHeroCarouselData.ts:378–388`); no such future state is claimed verified.
2. **fetchNextTournamentPreview / predictions:** yes, its PGA season is 2026 and earliest scheduled/created start≥now selects Skins (`useAIPredictions.ts:375–395`; cross-tour major comparison `:397–420`), then calls the selected tournament's prediction helper (`:422–434`). Stroke passes the format guard (`:447–453`). With created status, a missing/stale stored row requests generation; current-version stored rows are served (`:455–506`). **Successful new prediction generation is not guaranteed and would currently be skipped with the observed empty field:** server requires a confirmed tee-time/leaderboard field (`supabase/functions/generate-predictions/index.ts:340–348`) and at least 20 eligible players (`:882–893`). It would also refuse a four-player Skins field under that existing floor. No generation call was made. Scoped overview predictions do not use the legacy next-preview fallback (`useAIPredictions.ts:135–164`).
3. **Schedule:** included in the 2026 PGA timeline (`schedule-v2/useSeasonTimeline.ts:149`), classified upcoming because created is neither completed nor live and its end is future (`:344–353`). Row shows PGA Tour, event name, venue, and single-day date span “Fri 27 – Fri 27 Nov”; no stroke/Skins tag (`scheduleRules.ts:42–57`, date span `:106–119`; `SeasonRow.tsx:159–225`). Upcoming right slot uses defending champion Bradley with current metadata, null purse adds nothing (`scheduleRules.ts:215–227`). “In the field” names are viewer-follow data only (`SeasonRow.tsx:96–107,225–227`), not invented participants. Actual future Schedule UI was not browser-verified.

### Tests and continuous count reconciliation
Commands: `npx vitest run src/test/currentSeason.test.ts src/test/currentSeasonRankings.test.ts src/test/scraperSeasonYear.test.ts --maxWorkers=2` → **20/20**.
Then `npx vitest run --shard=N/4 --maxWorkers=2`, N=1,2,3,4, each its own command, sequentially:

| Shard | Passed | Failed |
|---|---:|---:|
| 1 | 2,052 | 0 |
| 2 | 1,900 | 0 |
| 3 | 2,030 | 0 |
| 4 | 1,929 | 0 |
| Total | **7,911** | **0** |

**Before 7,898 → after 7,911 (+13):**
- currentSeason.test.ts 7→11: pending cup ignored; pending team holds; both read gates; Hero through 6 Dec/handover 7 Dec (+4).
- currentSeasonRankings.test.ts new six: current-year/events-left; previous-year/no clause; event-type/status count; followed fallback parity; absent followed player cannot switch list year; null-year calendar fallback (+6).
- scraperSeasonYear.test.ts new three: pending EURO season/November opening; cup/match/cancelled versus team; latest finished/no-data fallback (+3).

No test deleted, renamed or assertion rewritten. Existing fixture helper gained event_type='stroke' and its query stub implements the new .in filter; original seven assertions unchanged. Requested test (a) uses cup rather than skins. No known failure appeared. Logs: `docs/verification/current-season-gate/{focused,shard1,shard2,shard3,shard4}.log`. Final preview log: build OK at 11:56:19 UTC. Unchanged/off-limits surfaces and no actual authenticated future UI flow are claimed verified.
