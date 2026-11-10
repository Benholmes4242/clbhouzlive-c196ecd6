# Menu label + LIV retirement — close-out report

## Result and limits
No app, test, edge-function, configuration or database changes were made during this close-out. Only this report was written.
After-shards 2, 3 and 4 ran one at a time. Shard 3 has one explained failure: its unchanged test attempts to click the retired LIV Golf button. It was not repaired or rerun. Shard 4 was completed because the failure is directly explained by the requested retirement, not an unexplained regression.

## Sequential test counts
Command for each: `bunx vitest run --maxWorkers=2 --shard=N/4`.

| Shard | Before passed | After passed | After failed | After executed |
|---|---:|---:|---:|---:|
| 1 (already passed) | 2,087 | 2,093 | 0 | 2,093 |
| 2 | 1,916 | 1,917 | 0 | 1,917 |
| 3 | 2,066 | 2,066 | 1 | 2,067 |
| 4 | 1,971 | 1,970 | 0 | 1,970 |
| **Total** | **8,040** | **8,046** | **1** | **8,047** |

Suite-size reconciliation: **8,040 → 8,047 (+7)**. Six tests were added in `src/test/tourRetirement.test.tsx` and one in `src/test/tourInterpolationGuard.test.ts`. No tests deleted or renamed. Distribution between shards changed; shard 4's -1 is not a test deletion.

New tests:
- Retains LIV metadata but omits it from active lists and overview/picker chips.
- Menu and island with real English JSON have no unresolved interpolation or LIV off-week label.
- Redirects `/tourhub?tour=liv`.
- Redirects `/tourhub?board=livpts`.
- Redirects `/tourhub?event=retired-event`.
- Active function lists exclude all LIV aliases.
- Supplies every English placeholder in literal `t(key, options)` calls.

Existing assertion changed during implementation (not this close-out):
`src/test/tournamentPickInsights.test.tsx`, “record tour chips have canonical order and switching uses event season”.
Old: `toEqual(['PGA TOUR','DP World','LPGA','Champions','Korn Ferry','LIV Golf'])`.
New: `toEqual(['PGA TOUR','DP World','LPGA','Champions','Korn Ferry'])`.
Reason: only the assertion pinning retired LIV's presence was updated; switching assertions retained.

## Remaining failure — exact output
`src/test/pk2WinnerChance.test.tsx:32:123`
Test: **PK2 winner chance > LIV switch changes every chance figure and drops the winner multiple**
```text
TestingLibraryElementError: Unable to find role="button" and name "LIV Golf"
```
The unchanged statement is `fireEvent.click(await screen.findByRole('button',{name:'LIV Golf'}))`.
The absence is the requested retirement. All subsequent assertions in that test remain untouched. This run is not reported as all green.

Logs: `/tmp/retire-liv-after1-final.log`, `/tmp/retire-liv-after2-final.log`, `/tmp/retire-liv-after3-final.log`, `/tmp/retire-liv-after4-final.log`.
Earlier focused checks: 4 files / 47 tests passed; interpolation guard 1/1 passed. Those focused runs preceded the final implementation edits; final shards are authoritative.

## Menu / translation sweep
TourGlance renders the completed `startsLabel(row.startDate)` directly. Only unused `tour.glance.starts` was removed. A prior implementation edit removed the identically named `overview.hero.starts` accidentally; it was restored before the already-passing final shard 1, without changing its test. The final literal-key guard reported no missing English placeholders.
The guard scans literal `t` calls with object options, recognizes shorthand properties, and checks resolved English strings. Dynamic keys/options, unresolved namespaces, plural-only resource variants and spread-supplied values are not exhaustively validated; it is not a claim of every dynamic call being verified.

## Deployment already completed (no deployment this close-out)
Successfully deployed: `daily-schedule-sync`, `scrape-season-rankings`, `sportradar-sync`, `tournament-live-sync`, `schedule-predictions`, `generate-predictions`, `tourhub-livegolf`, `fetch-news`.
Deployment receipt confirms submitted source; no live sync/scrape/prediction execution is claimed here.

## pg_cron inventory limitation
No SQL was run or written. Hosted pg_cron command/request bodies were not available in this verification, so no installed-job inventory can be certified and “none” is not claimed.
Source contains `src/features/admin/components/health/jobNames.ts:64` label **sync-player-stats-liv-2026** (“Player stats: LIV”). This is a candidate name for Ben to inspect, not evidence of its current installation or request body. No cron was modified or scheduled.

## File-grouped implementation inventory
Entries below describe prior implementation edits, not new close-out changes.

- `public/locales/en/tourhub.json` — Deleted only tour.glance.starts; overview.hero.starts restored unchanged after exact-key correction. Historical LIV translations remain.

- `src/features/chrome-v2/TourGlance.tsx` — Renders startsLabel directly; filters menu/off-week rows through retirement metadata.

- `src/features/search-v2/hooks/useSearchEmptyStateV2.ts` — Retired event recommendations and their associated player suggestions omitted.

- `src/features/tourhub/_shared/tourOrder.ts` — Active priorities/overview choices use registry filtering. Historical normalization, label maps and comments retained.

- `src/features/tourhub/components/overview-v3/ComingUpSlot.tsx` — Allowed schedule tours derive from registry.

- `src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx` — Active tour choices filtered; historical names retained.

- `src/features/tourhub/components/tourIslandRules.ts` — TOUR_DISPLAY now reads registry labels; historical labels remain available.

- `src/features/tourhub/constants/tourMap.ts` — LIV metadata gains retirement flag; active-list helpers exclude it. Historical code, label and aliases retained.

- `src/features/tourhub/context/TourSelectionContext.tsx` — Refuses retired selections.

- `src/features/tourhub/hooks/useHeroCarouselData.ts` — Active carousel/fallback priorities filtered; historical normalization retained.

- `src/features/tourhub/hooks/useLiveTournaments.ts` — Filters retired events before leaderboard reads.

- `src/features/tourhub/hooks/useRetiredTourRedirect.ts` — New tour/board/event metadata redirect to /tourhub.

- `src/features/tourhub/hooks/useTourPickerRows.ts` — Picker rows derive from ACTIVE_TOUR_SLUGS.

- `src/features/tourhub/hooks/useTourSelection.ts` — Stored selections and landing candidates reject retired tours; historical canonical slug definitions remain.

- `src/features/tourhub/hooks/useUpcomingTournaments.ts` — Skips retired upcoming events; historical tour-name map retained.

- `src/features/tourhub/leaderboard/LeaderboardTab.tsx` — Live all-tour rows exclude retired tours.

- `src/features/tourhub/news/NewsTab.tsx` — News choices derive from active registry.

- `src/features/tourhub/news/newsPageData.ts` — Filters retired stories before lens selection.

- `src/features/tourhub/news/useTourStories.ts` — Filters retired stories and related-story results.

- `src/features/tourhub/overview/data/useComingUp.ts` — Skips retired-season rows.

- `src/features/tourhub/overview/sections/WorldRankings.tsx` — Visible board choices checked against active registry.

- `src/features/tourhub/pages/TourHubMainPage.tsx` — Installs retired-link redirect.

- `src/features/tourhub/players-v2/PlayersTab.tsx` — Inbound/stored picker lenses accept active tours only; existing Champions rule preserved.

- `src/features/tourhub/schedule-v2/ScheduleTab.tsx` — Inbound/stored/picker lenses accept active tours only.

- `src/features/tourhub/schedule-v2/useMergedSchedule.ts` — Skips retired-season event rows before merge/sort.

- `src/features/tourhub/tournament-v2/TournamentPage.tsx` — Installs retired event redirect.

- `src/test/tourInterpolationGuard.test.ts` — One new literal-key English placeholder contract test.

- `src/test/tourRetirement.test.tsx` — Six new tests retain historical metadata, exclude LIV from active choices/off-week text, cover three redirects and function alias filtering.

- `src/test/tournamentPickInsights.test.tsx` — Updated only canonical active-chip presence assertion: removed LIV Golf from expected list.

- `supabase/functions/_shared/tourRetirement.ts` — Shared retirement flag, alias predicate and active tournament/list filters.

- `supabase/functions/daily-schedule-sync/index.ts` — Daily tour list excludes LIV; completed leaderboard loop filters retired seasons. Alias maps and historical coverage comments retained.

- `supabase/functions/fetch-news/index.ts` — Dedicated LIV NewsAPI ingestion removed.

- `supabase/functions/generate-predictions/index.ts` — Explicit retired tournament prediction rejected with 410.

- `supabase/functions/schedule-predictions/index.ts` — Scheduled prediction candidates skip retired seasons; historical coverage comment retained.

- `supabase/functions/scrape-season-rankings/index.ts` — Callable/default allowlist is LPGA, PGAD, CHAMP only; explicit LIV requests rejected. Historical LIV parser, source URL, thresholds, matching rules and type retained.

- `supabase/functions/sportradar-sync/index.ts` — Rejects explicit retired tours; skips global season iteration and tee-time backfill. Historical slug/stat/tee-time maps retained.

- `supabase/functions/sportradar-sync/missingLeaderboards.ts` — Missing-leaderboard sweep skips retired seasons.

- `supabase/functions/tourhub-livegolf/index.ts` — Explicit LIV alias rejected; default list excludes LIV. Live Golf API identifiers/logging are a provider name, not LIV Golf.

- `supabase/functions/tournament-live-sync/index.ts` — Retired guards on manual reconcile, stale/upcoming/prediction/live candidates, tee-time loop and syncTournament. Scorecard list excludes LIV; historical mappings and team-row logic retained.

## Deliberately retained references, grouped by file
Historical rows and generated types were not deleted or rewritten. Existing admin historical controls and the failing historical LIV-switch test are explicitly disclosed, not silently claimed retired.

- `public/locales/de/tourhub.json` — Historical LIV labels/points translation keys retained; disabled/pseudo locale resources unchanged.

- `public/locales/en-XA/tourhub.json` — Historical LIV labels/points translation keys retained; disabled/pseudo locale resources unchanged.

- `public/locales/es/tourhub.json` — Historical LIV labels/points translation keys retained; disabled/pseudo locale resources unchanged.

- `public/locales/ja/tourhub.json` — Historical LIV labels/points translation keys retained; disabled/pseudo locale resources unchanged.

- `public/locales/ko/tourhub.json` — Historical LIV labels/points translation keys retained; disabled/pseudo locale resources unchanged.

- `src/features/admin/components/health/jobNames.ts` — Existing job label sync-player-stats-liv-2026 retained; not proof of a currently installed cron job or its request body.

- `src/features/admin/components/wire/WireStoryEditor.tsx` — Historical editorial attribution selector retained.

- `src/features/admin/lib/tourDataDisplay.ts` — Admin historical data label.

- `src/features/admin/pages/ContentPage.tsx` — Historical/admin content filter labels retained; not changed in close-out.

- `src/features/pro-verification/proRules.ts` — Historical pro eligibility tour names; retirement does not revoke player identity.

- `src/features/tourhub/_shared/stats/useLeaderCategories.ts` — Historical points-reader label/source documentation.

- `src/features/tourhub/components/PlayerAvatar.tsx` — Historical cross-tour headshot fallback documentation.

- `src/features/tourhub/components/TourPickerSheet.tsx` — Historical label/code maps; active rows supplied by shared picker.

- `src/features/tourhub/components/TourSideMenu.tsx` — Style-description comment, not an active tour choice.

- `src/features/tourhub/components/overview-v3/HybridHero.utils.ts` — Historical countdown bug explanation.

- `src/features/tourhub/components/overview-v3/OverviewHero.tsx` — Existing chip/fallback explanation.

- `src/features/tourhub/components/overview-v3/seasonRecapRules.ts` — Historical source/freshness documentation.

- `src/features/tourhub/hooks/useOverviewData.ts` — Historical metadata/normalization.

- `src/features/tourhub/hooks/useSeasonTournaments.ts` — Historical source name map.

- `src/features/tourhub/hooks/useTourHubData.ts` — Historical source-code documentation.

- `src/features/tourhub/hooks/useTourLensFromPicker.ts` — Historical fallback-bug explanation.

- `src/features/tourhub/news/StoryBody.tsx` — Historical article tour label.

- `src/features/tourhub/news/StoryPage.tsx` — Historical article tour label.

- `src/features/tourhub/overview/data/useFollowedBoardRows.ts` — Historical livpts followed-player reader.

- `src/features/tourhub/overview/data/useRankingsBoards.ts` — Historical livpts board type, season lookup and reader.

- `src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx` — Existing LIV fixture, historical metadata or exclusion assertion retained; test unchanged.

- `src/features/tourhub/overview/sections/overviewNewsRules.ts` — Historical news label mapping.

- `src/features/tourhub/overview/tokens.ts` — Historical tour photography/theme token.

- `src/features/tourhub/player-v2/playerRules.ts` — Historical player race labels.

- `src/features/tourhub/players-v2/data/usePlayersRanking.ts` — Historical rankings reader, labels and source comments.

- `src/features/tourhub/schedule-v2/scheduleRules.ts` — Historical label/tie-break ordering; active schedule rows filtered upstream.

- `src/features/tourhub/schedule-v2/useSeasonTimeline.ts` — Comment preventing historical tour fallback misclassification.

- `src/features/tourhub/utils/formatThruDisplay.ts` — Historical shotgun-format completion semantics/comments.

- `src/features/tourhub/utils/tourLogos.ts` — Historical logo mapping/assets.

- `src/features/tourhub/utils/tournamentClassification.ts` — Historical tour aliases and event classification.

- `src/test/overviewTourButtons.test.tsx` — Existing LIV fixture, historical metadata or exclusion assertion retained; test unchanged.

- `src/test/pk2WinnerChance.test.tsx` — Unchanged historical LIV fixture and active LIV-switch assertion. The active switch assertion now fails; no repair authorized in this close-out.

- `src/test/tourIsland.test.tsx` — Existing LIV fixture, historical metadata or exclusion assertion retained; test unchanged.

- `src/test/tourMenuLiveBoard.test.tsx` — Existing LIV fixture, historical metadata or exclusion assertion retained; test unchanged.

- `src/test/tourOverviewDesignA.test.ts` — Existing LIV fixture, historical metadata or exclusion assertion retained; test unchanged.

- `src/utils/playerHeadshot.ts` — Historical/player cross-tour headshot lookup support.

- `supabase/functions/echo-intelligence-v2/index.ts` — Retired Echo intent recognition, unchanged.

- `supabase/functions/echo-intelligence-v2/router.ts` — Retired Echo natural-language recognition, unchanged.

- `supabase/functions/manage-player-headshot/index.ts` — Historical/manual player headshot alias.

- `supabase/functions/scrape-tour-rankings/index.ts` — Historical player matching exclusion comment.

- `supabase/functions/tourhub-map-slashgolf/index.ts` — Historical external tour-name normalization.

- `supabase/functions/tournament-round-complete/index.ts` — Historical normalization and existing LIV unsupported list.

- `supabase/functions/upload-player-headshot/index.ts` — Historical/manual player headshot alias.

- `src/integrations/supabase/types.ts` — Generated database types unchanged. `livegolf_event_id` is a provider identifier, not a LIV active-tour selector.

## Exact surviving reference appendix
Scan scope: `src`, `public/locales`, `supabase/functions`, excluding generated `types.ts`; case-insensitive LIV/LIVPTS/LIV-Golf tokens. All 192 matches across 64 files are grouped below. The broad scan also matches “LiveGolf” provider names; those are explicitly unrelated to LIV retirement. Removed references are described in the implementation inventory above. SQL/migration archives, reports and binary logo assets are not execution paths and were not edited.

### `public/locales/de/tourhub.json`
```text
540:       "liv": "LIV"
667:       "liv": "LIV Points",
801:       "liv": "LIV PTS"
```

### `public/locales/en-XA/tourhub.json`
```text
1032:       "liv": "[~~ĻÍṼ~~]"
1159:       "liv": "[~~ĻÍṼ Ƥőíñţš~~]",
1280:       "liv": "[~~ĻÍṼ ƤŢŠ~~]"
```

### `public/locales/en/tourhub.json`
```text
1167:       "liv": "LIV"
1294:       "liv": "LIV Points",
1443:       "liv": "LIV PTS"
```

### `public/locales/es/tourhub.json`
```text
539:       "liv": "LIV"
666:       "liv": "LIV Points",
800:       "liv": "LIV PTS"
```

### `public/locales/ja/tourhub.json`
```text
538:       "liv": "LIV"
665:       "liv": "LIV Points",
799:       "liv": "LIV PTS"
```

### `public/locales/ko/tourhub.json`
```text
537:       "liv": "LIV"
664:       "liv": "LIV Points",
798:       "liv": "LIV PTS"
```

### `src/features/admin/components/health/jobNames.ts`
```text
64:   'sync-player-stats-liv-2026': { name: 'Player stats: LIV', what: 'Fetches the 2026 season player statistics for LIV Golf.' },
```

### `src/features/admin/components/wire/WireStoryEditor.tsx`
```text
48:   { value: 'liv', label: 'LIV Golf' },
```

### `src/features/admin/lib/tourDataDisplay.ts`
```text
47: const RANKING_TOUR: Record<string, string> = { euro: 'DP World', lpga: 'LPGA', pgad: 'Americas', liv: 'LIV' };
```

### `src/features/admin/pages/ContentPage.tsx`
```text
671:   pgad: 'Korn Ferry', liv: 'LIV', champ: 'Champions',
727: const ALL_TOURS = ['pga', 'eur', 'lpga', 'pgad', 'liv', 'champions-tour'];
730:   pgad: 'Korn Ferry', liv: 'LIV', 'champions-tour': 'Champions',
```

### `src/features/pro-verification/proRules.ts`
```text
17:   { label: 'LIV Golf', code: 'liv' },
```

### `src/features/tourhub/_shared/stats/useLeaderCategories.ts`
```text
19:  *   euro / lpga / pgad / liv (tour_season_rankings):
20:  *     points  (desc)  PTS  (per-tour brand label: Race to Dubai / CME Points / LIV Points / Season Points)
172:   liv:  'leaders.pointsBrand.liv',
```

### `src/features/tourhub/_shared/tourOrder.ts`
```text
5:  *  PGA → LPGA → DP World → Korn Ferry → Champions → LIV. */
13:  * includes LIV, while the overview has no LIV chip (LIV stays reachable from
31:   liv: 'LIV',
41:   liv: 'LIV GOLF',
71:   if (normalized.includes('liv')) return 'liv';
```

### `src/features/tourhub/components/PlayerAvatar.tsx`
```text
7:  *   - On miss, walks the cross-tour fallback chain (PGA, LIV, DPWT, KFT,
```

### `src/features/tourhub/components/TourPickerSheet.tsx`
```text
30: // "KORN FERRY" / "CHAMPIONS" / "LIV GOLF". Do NOT key. Same rationale as
40:   liv: 'LIV GOLF',
51:   liv: 'LIV',
```

### `src/features/tourhub/components/TourSideMenu.tsx`
```text
2:  * TourSideMenu — self-contained LIV-style left drawer for the Tour Hub
```

### `src/features/tourhub/components/overview-v3/HybridHero.utils.ts`
```text
302:   // ran a countdown on it. On 2026-08-26 the hero showed LIV Golf Indianapolis
```

### `src/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet.tsx`
```text
18: const TOURS = activeTourList(['pga','euro','lpga','champ','pgad','liv']);
19: const TOUR_NAMES: Record<string,string> = { pga:'PGA TOUR', euro:'DP World', lpga:'LPGA', champ:'Champions', pgad:'Korn Ferry', liv:'LIV Golf' };
```

### `src/features/tourhub/components/overview-v3/OverviewHero.tsx`
```text
112:    * the tournament page and news read it. Tours with no chip (LIV, the
```

### `src/features/tourhub/components/overview-v3/seasonRecapRules.ts`
```text
15:  * (lpga/pgad/liv/champ/euro) or max sr_player_statistics.updated_at (pga).
```

### `src/features/tourhub/constants/tourMap.ts`
```text
17: export type TourCode = 'pga' | 'EURO' | 'LPGA' | 'CHAMP' | 'PGAD' | 'LIV';
64:   LIV: {
65:     retired: RETIRED_TOURS.liv,
66:     label: 'LIV Golf',
67:     short: 'LIV Golf',
68:     pillCode: 'LIV Golf',
75: export const TOUR_SLUGS = ['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'] as const;
77: const SLUG_CODE: Record<RegistryTourSlug, TourCode> = { pga: 'pga', lpga: 'LPGA', euro: 'EURO', pgad: 'PGAD', champ: 'CHAMP', liv: 'LIV' };
81:   const slug = TOUR_SLUGS.find(s => s === normalized || TOUR_MAP[SLUG_CODE[s]].label.toLowerCase() === normalized || TOUR_MAP[SLUG_CODE[s]].short.toLowerCase() === normalized || (s === 'liv' && (normalized === 'liv-golf' || normalized === 'livpts')));
```

### `src/features/tourhub/hooks/useHeroCarouselData.ts`
```text
5:  * For each major tour (PGA, LIV, DP World, LPGA, Korn Ferry, Champions):
33: const TOUR_PRIORITY: TourId[] = activeTourList<TourId>(['pga', 'liv', 'euro', 'lpga', 'pgad', 'champ']);
96:   if (normalized === 'liv' || normalized === 'liv golf') return 'liv';
```

### `src/features/tourhub/hooks/useOverviewData.ts`
```text
16:   liv: { name: 'LIV Golf', color: '#DC2626', emoji: '⚡', slug: 'liv' },
127:   if (normalized === 'liv' || normalized === 'liv golf') return 'liv';
```

### `src/features/tourhub/hooks/useSeasonTournaments.ts`
```text
44:   'liv': 'LIV Golf',
```

### `src/features/tourhub/hooks/useTourHubData.ts`
```text
53:   /** Tour code from sr_seasons.tour_name (e.g. 'pga', 'EURO', 'LIV') */
```

### `src/features/tourhub/hooks/useTourLensFromPicker.ts`
```text
65:      the label/list disagreement (the list was PGA while the link said LIV). */
```

### `src/features/tourhub/hooks/useTourSelection.ts`
```text
14:  *   major > pga > lpga > euro > champ > liv > pgad
31:   'liv',
44:   'liv',
```

### `src/features/tourhub/hooks/useUpcomingTournaments.ts`
```text
15:   liv: 'LIV Golf',
```

### `src/features/tourhub/news/StoryBody.tsx`
```text
45:   liv: 'LIV Golf',
```

### `src/features/tourhub/news/StoryPage.tsx`
```text
40:   liv: 'LIV GOLF',
```

### `src/features/tourhub/overview/data/useFollowedBoardRows.ts`
```text
19: const SEASON_TOUR: Record<Exclude<RankingsBoard, 'owgr'>, 'euro' | 'lpga' | 'liv' | 'pgad'> = {
22:   livpts: 'liv',
57:   tourCode: 'euro' | 'lpga' | 'liv' | 'pgad',
```

### `src/features/tourhub/overview/data/useRankingsBoards.ts`
```text
6:  *        'livpts' -> tour_season_rankings (tour_code = 'liv')
24: export type RankingsBoard = 'owgr' | 'r2d' | 'cme' | 'livpts' | 'kft';
201: /** tour_season_rankings tour_code -> sr_seasons tour_name (verified: EURO/LPGA/PGAD/LIV). */
202: const SEASON_SR_TOUR: Record<'euro' | 'lpga' | 'liv' | 'pgad', string> = {
205:   liv: 'LIV',
214: export async function countEventsLeft(tourCode: 'euro' | 'lpga' | 'liv' | 'pgad', resolvedYear?: number): Promise<number | null> {
235: export async function seasonRankingYear(tourCode: 'euro' | 'lpga' | 'liv' | 'pgad'): Promise<{ year: number; fallback: boolean }> {
244:   tourCode: 'euro' | 'lpga' | 'liv' | 'pgad',
320:       if (board === 'livpts') return fetchSeasonBoard('liv');
```

### `src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx`
```text
25:   { id: '5', name: 'Tournament 5', start_date: '2025-01-29', end_date: '2025-02-01', venue: 'Venue 5', tour_slug: 'liv', defending_champion: 'Champ 5', isMajor: false },
```

### `src/features/tourhub/overview/sections/overviewNewsRules.ts`
```text
11: export const NEWS_TOUR_LABELS: Record<string, string> = { pga: 'PGA Tour', lpga: 'LPGA', euro: 'DP World', pgad: 'Korn Ferry', champ: 'Champions', liv: 'LIV Golf' };
```

### `src/features/tourhub/overview/tokens.ts`
```text
107:   liv: 'linear-gradient(165deg, #4a1420 0%, #26090f 100%)',
```

### `src/features/tourhub/player-v2/playerRules.ts`
```text
21: export const raceLabels: Record<string, string> = { pga:'Points', euro:'Race to Dubai', lpga:'CME Points', pgad:'Korn Ferry Points', liv:'LIV Points', champ:'Points' };
```

### `src/features/tourhub/players-v2/data/usePlayersRanking.ts`
```text
9:  *   liv   -> tour_season_rankings (position ASC),      stat label "LIV PTS"        [synced]
16:  * lpga -> 'LPGA', pgad -> 'PGAD', liv -> 'LIV'.
82:   liv: 'players.statLabel.liv',
```

### `src/features/tourhub/schedule-v2/scheduleRules.ts`
```text
23:   liv: 'LIV Golf',
30: /** Within-week tie-break order after start date: pga, liv, euro, lpga, pgad, champ. */
31: export const ROW_TOUR_ORDER: TourId[] = ['pga', 'liv', 'euro', 'lpga', 'pgad', 'champ'];
```

### `src/features/tourhub/schedule-v2/useSeasonTimeline.ts`
```text
92:   // fallback-mapped rows so DP-World / LIV rows can't masquerade as pga.
```

### `src/features/tourhub/utils/formatThruDisplay.ts`
```text
6:  * - LIV shotgun format (round_N exists even when thru < 18)
102:   // 6. Check round_N completion (handles LIV shotgun: round_3=55 even though thru=16)
```

### `src/features/tourhub/utils/tourLogos.ts`
```text
11:   liv: '/tour-logos/liv-golf.webp',
```

### `src/features/tourhub/utils/tournamentClassification.ts`
```text
11:   'LIV Golf': 'liv',
12:   'LIV Golf League': 'liv',
13:   'LIV GOLF': 'liv',
14:   'LIV GOLF LEAGUE': 'liv',
21:   'liv': 'liv',
22:   'LIV': 'liv',
159:   if (tourSlug === 'liv') return 'LIV GOLF EVENT';
```

### `src/test/overviewTourButtons.test.tsx`
```text
155:   it('drops LIV, the pseudo-major and other unlisted tours from both the chips and the carousel', () => {
157:       slide('liv-1', 'liv', 'live'),
164:     expect(f.heroSlides).not.toContain('liv-1');
```

### `src/test/pk2WinnerChance.test.tsx`
```text
22:  record={tours:['lpga','liv'],picks:24,event_count:8,won:5,top10:13,avg_percentile:74,best:{events:8,wins:5,top10:8,avg_percentile:90},random_win_pct:2.7,avg_field_size:72,first_event_date:null,events:[]};
25:   if(name==='get_our_pick_record')return{data:args.p_tour==='liv'?{...record,event_count:2,best:{...record.best,wins:0},random_win_pct:4}:record,error:null};
32:  it('LIV switch changes every chance figure and drops the winner multiple',async()=>{mount();fireEvent.click(await screen.findByRole('button',{name:'LIV Golf'}));await waitFor(()=>expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS0 of 2events'));expect(document.querySelector('[data-chance-group="winner"] [data-chance-row="random"]')?.textContent).toBe('3 AT RANDOM24/1');expect(document.querySelector('[data-chance-group="winner"] .pick-chance-x')).toBeNull();expect(document.querySelector('.pick-chance-sentence')).toBeNull();expect(h.rpc).toHaveBeenCalledWith('get_my_pick_odds',{p_tour:'liv',p_year:2026});});
```

### `src/test/tourIsland.test.tsx`
```text
99:     expect(TOUR_DISPLAY.liv).toBe('LIV Golf');
```

### `src/test/tourMenuLiveBoard.test.tsx`
```text
12: vi.mock('@/features/tourhub/hooks/useHeroCarouselData', () => ({ useHeroCarouselData: () => ({ data: [slide('p1','pga','live'), slide('p2','pga','upcoming'), slide('l1','lpga','completed'), ...(h.allTours ? ['euro','pgad','champ','liv'].map(s => slide(s,s,'upcoming')) : [])] }) }));
67:     expect(document.querySelector('[data-tour-row="liv"]')).toBeNull();
```

### `src/test/tourOverviewDesignA.test.ts`
```text
215:     expect(['pga', 'euro', 'lpga', 'pgad', 'champ', 'liv'].map((tour) => fullTourLabel(tour))).toEqual([
216:       'PGA TOUR', 'DP WORLD TOUR', 'LPGA TOUR', 'KORN FERRY TOUR', 'CHAMPIONS TOUR', 'LIV GOLF',
```

### `src/test/tourRetirement.test.tsx`
```text
18: vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: (id?: string) => ({ data: id === 'retired-event' ? { tour_code: 'LIV' } : null }) }));
21:   { key: 'liv', slug: 'liv', status: 'none', eventName: null },
27:   it('retains LIV metadata but omits it from active lists and overview/picker chips', () => {
28:     expect(TOUR_MAP.LIV.retired).toBe(true);
29:     expect(TOUR_MAP.LIV.label).toBe('LIV Golf');
31:     expect(TOUR_ROW_SLUGS).not.toContain('liv');
32:     expect(OVERVIEW_TOUR_ORDER).not.toContain('liv');
34:   it('menu and island rendered with real en JSON have no unresolved interpolation or LIV off-week label', async () => {
39:     expect(document.body.textContent).not.toContain('LIV');
40:     expect(card.container.querySelector('[data-tour-row="liv"]')).toBeNull();
43:   it.each(['/tourhub?tour=liv', '/tourhub?board=livpts', '/tourhub?event=retired-event'])('redirects retired deep link %s to the all-tours overview', async url => {
48:   it('active function lists exclude all LIV aliases', () => {
49:     expect(activeSyncTours(['pga', 'liv', 'LIV Golf', 'liv-golf', 'euro'])).toEqual(['pga', 'euro']);
50:     expect(isRetiredTour('LIV')).toBe(true);
```

### `src/test/tournamentPickInsights.test.tsx`
```text
40:  record={tours:['liv','pgad','champ','lpga','euro','pga'],picks:30,event_count:10,best:{events:10,wins:3,top10:9,avg_percentile:94},won:3,top10:13,avg_percentile:73,first_event_date:'2026-03-15',events:[{tournament_id:'old',name:'Old event',end_date:'2026-10-01',picks:[{player_id:'a',player_name:'Clark',position:1,tied:false,status:null,percentile:100}]},{tournament_id:'new',name:'Mexico Open',end_date:'2026-11-01',picks:[{player_id:'a',player_name:'Clark',position:80,tied:false,status:'CUT',percentile:19},{player_id:'b',player_name:'Ghim',position:6,tied:true,status:null,percentile:95}]}]};
```

### `src/utils/playerHeadshot.ts`
```text
19:   liv:  'LIV',
20:   LIV:  'LIV',
31:   'LIV',
```

### `supabase/functions/_shared/tourRetirement.ts`
```text
3: export const RETIRED_TOURS = { liv: true } as const;
```

### `supabase/functions/daily-schedule-sync/index.ts`
```text
15: // RECORDED 2026-08-26 — LIV COVERAGE GAP, NOT A BUG. LIV's 2026 calendar has a
16: // Team Championship after Indianapolis (ends 2026-08-23); the Sportradar 'liv'
17: // v3 schedule feed does NOT carry it, so LIV's season appears to end in August.
20: // shows the LIV result for 14 days after 23 August, then LIV drops out of the
40:   'LIV': 'liv',
41:   'LIV Golf': 'liv',
42:   'liv': 'liv',
```

### `supabase/functions/echo-intelligence-v2/index.ts`
```text
87:   if (/\b(this week|next week|tournament|pick|picks|predict|who should i|who will win|masters|open|pga|lpga|liv|dp world|leaderboard|cut|field|favourite|favorite)\b/.test(q)) intents.push("tournament");
```

### `supabase/functions/echo-intelligence-v2/router.ts`
```text
77:   /\b(pga tour|european tour|dp world tour|liv golf|owgr|world ranking|rolex ranking)/i,
```

### `supabase/functions/manage-player-headshot/index.ts`
```text
12:   liv: 'LIV',
```

### `supabase/functions/schedule-predictions/index.ts`
```text
14:  *  on it and LIV, LPGA, Champions and Korn Ferry never get predictions at all.
```

### `supabase/functions/scrape-season-rankings/index.ts`
```text
3:  * scrape-season-rankings - LPGA, Korn Ferry, LIV and Champions season standings.
14:  *   liv   https://www.livgolf.com/standings                         -> RSC payload initialPlayerStandings
33: type TourCode = "lpga" | "pgad" | "liv" | "champ";
52: const MIN_ROWS: Record<TourCode, number> = { lpga: 100, pgad: 100, champ: 50, liv: 40 };
57:   liv: ["LIV", "liv"],
60: /** LIV and Champions players are mostly tagged with another tour: allow a unique exact first+last pass. */
61: const PASS2: Record<TourCode, boolean> = { lpga: false, pgad: false, liv: true, champ: true };
164:   if (i < 0) throw new Error("No initialPlayerStandings in LIV payload");
187:   lpga: fetchLpga, pgad: fetchKornFerry, liv: fetchLiv, champ: fetchChampions,
```

### `supabase/functions/scrape-tour-rankings/index.ts`
```text
229:     // pga/LIV, so pass 1 excludes them from the pool by construction.
```

### `supabase/functions/sportradar-sync/index.ts`
```text
31:     'liv': 'liv',
47:     'LIV': null,    // Sportradar does not provide hole stats for LIV
51:   return map[normalized] ?? (normalized.includes('LIV') ? null : 'pga');
62: // Tour slug mapping for tee times — includes LIV (which has tee time data)
72:     'LIV': 'liv',     // LIV DOES have tee times
76:   return map[normalized] ?? (normalized.includes('LIV') ? 'liv' : 'pga');
426:     liv: 'LIV', 'champions-tour': 'CHAMP',
433:     liv: 'liv', 'champions-tour': 'champ',
1459:   const unsupportedTourNames = ['LIV', 'OLY', 'USGA'];
1636:     liv: 'liv',
1654:     liv: 'LIV',
```

### `supabase/functions/tourhub-livegolf/index.ts`
```text
1: // supabase/functions/tourhub-livegolf/index.ts
2: // Fetches golf data from Live Golf API (livegolfapi.com)
11: const LIVEGOLF_BASE_URL = "https://use.livegolfapi.com/v1";
25: async function fetchFromLiveGolf(
30:     console.error("[livegolf] GOLF_API_KEY not configured");
34:   const url = new URL(`${LIVEGOLF_BASE_URL}${endpoint}`);
44:   console.log(`[livegolf] Fetching: ${endpoint} with params:`, params);
57:       console.error(`[livegolf] API error ${response.status}: ${errorText}`);
62:     console.log(`[livegolf] Success for ${endpoint}, received ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
65:     console.error(`[livegolf] Fetch error:`, err);
82:     const tour = url.searchParams.get("tour") || ""; // e.g., "pga-tour", "liv-golf", "dp-world-tour"
85:     console.log(`[livegolf] Request: action=${action}, eventId=${eventId}, tour=${tour}`);
100:         result = await fetchFromLiveGolf("/events", eventsParams);
109:         result = await fetchFromLiveGolf(`/events/${eventId}`);
120:         result = await fetchFromLiveGolf("/events", {
137:         const liveResult = await fetchFromLiveGolf("/events", {
164:         const recentResult = await fetchFromLiveGolf("/events", {
190:             const res = await fetchFromLiveGolf("/events", { tour: t });
234:     console.error("[livegolf] Unexpected error:", err);
```

### `supabase/functions/tourhub-map-slashgolf/index.ts`
```text
14:   'liv golf', 'korn ferry tour',
```

### `supabase/functions/tournament-live-sync/index.ts`
```text
764:   if (name.includes('liv')) return 'liv';
783:     'LIV': null,
787:   return map[normalized] ?? (normalized.includes('LIV') ? null : 'pga');
790: // Tour slug mapping for tee times — includes LIV (which has tee time data)
800:     'LIV': 'liv',
804:   return map[normalized] ?? (normalized.includes('LIV') ? 'liv' : 'pga');
984:   // A LIV pass writes team rows and player rows from the SAME leaderboard, so
1114:       // A LIV team standing moves for exactly the same reasons a player's does,
```

### `supabase/functions/tournament-round-complete/index.ts`
```text
21:   if (name.includes('liv')) return 'liv';
32:   const unsupported = ['liv', 'oly', 'usga'];
```

### `supabase/functions/upload-player-headshot/index.ts`
```text
15:   liv:  'LIV',
```

## Preserved constraints
No SQL, migrations, historical-row deletion, feed_config edits, round_pool_cap changes, native/Median changes or new code/test repairs during close-out. No new browser/device checks were requested or performed. Completion of all-green verification remains blocked only by the named obsolete LIV-button assertion.
