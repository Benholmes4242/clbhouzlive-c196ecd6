# SEASON_RECAP report

## Files changed
- NEW `src/features/tourhub/components/overview-v3/seasonRecapRules.ts` — constants, between-seasons rule, freshness, copy-free figure rules.
- NEW `src/features/tourhub/components/overview-v3/useSeasonRecap.ts` — batched recap candidates + active recap data.
- NEW `src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx` — recap photo band, facts, final board, card list, Our record.
- `src/features/tourhub/components/overview-v3/OverviewHero.tsx` — swaps a between-seasons tour's slide for one recap slide; no board read, no champion block on recap.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx` — optional `kicker`, `figure`, `stateKey` props (defaults reproduce every existing state).
- `src/styles/hybrid-hero.css` — recap classes (facts/record reuse `.upcoming-facts`).
- `public/locales/en/tourhub.json` — `overview.recap.*`.
- NEW `src/test/seasonRecap.test.tsx` — 21 tests.
- `AGENTS.md` — one pointer rule.

## Rule constants
`RECAP_AFTER_DAYS = 7`, `RECAP_NEXT_EVENT_WINDOW_DAYS = 21`. A live slide always wins.

## Standings source per tour (the recap uses it only when its own date ≥ final event end date)
| Tour | Source read | Latest date (from brief audit; not re-queried, no SQL) | Recap today |
|---|---|---|---|
| pgad | tour_season_rankings.scraped_at, then tour_standings_snapshots.snapshot_date | 2026-09-07 / snapshot 2026-11-02 copies the same stale list | fallback |
| lpga | same | 2026-09-07 | fallback |
| euro | same | current (daily) | full recap once between seasons |
| pga | same (no rows) | none | fallback |
| champ | same (no rows) | none | fallback |
Caveat: a snapshot dated after the final event that copies a stale list WOULD pass the date test. The brief's rule is source-date only; see finding 2.

## Step 7 findings (code reading only)
1. **pgad/lpga rows of 7 Sep.** No code in this repo writes them now: `scrape-tour-rankings` accepts only `tour: 'euro'` (TOUR_FEED has euro only) and its header says the old HTML scrape stopped working. The 7 Sep rows came from an earlier version of that function or a manual import; neither is in the repo. Confirming it needs the function's deploy history or `cron.job`/`net._http_response` logs, which take SQL (Ben).
2. **tour_standings_snapshots.** Written by the database function `capture_tour_standings_snapshot()` (in the types; its body is not in any repo migration, so it was applied by hand). Its sibling `snapshot_tour_season_rankings()` (migration 20260908074740) copies `tour_season_rankings` into `tour_season_rankings_snapshots` daily under CURRENT_DATE. If capture_… does the same, every snapshot re-dates the stale list. Ben can check with: `select pg_get_functiondef('public.capture_tour_standings_snapshot'::regproc);`
3. **Players page race boards.** pga → `sr_player_statistics.fedex_points` (Sportradar season statistics, sportradar-sync). Champions is excluded from the Players page by design, so it has no source at all.
4. **Feeds we already call.** Sportradar golf: season player statistics give FedEx points for PGA only (coverage note: Sportradar stats are PGA-only), so no pgad/lpga/champ standings. The only other standings feed in code is europeantour.com (euro). **No code-only change to an existing edge function can keep pgad/lpga/pga/champ current**: each needs a new outside feed (e.g. the tours' own points endpoints), and pga's would also need a dated write to rankings for the freshness rule. No SQL is needed for the recap itself.

## Acceptance
Real data is stale, so the live Korn Ferry recap shows the fallback ("{winners} different winners across {events} events." + EVENTS/WINNERS/MOST WINS). The fixture with the published final data renders Ross Steelman 2,221 / Sandy Scott 2,191 / Ian Holt 1,618 and the top 20 Steelman … Davis Lamb exactly (test + screenshot). Whether the real feed will produce that once fresh is unverifiable until fresh rows exist.

## Clause conflict for a ruling (not resolved silently)
Step 3 shows CARDS only when n ≤ 20 ("otherwise MOST WINS"); step 5 for n > 20 says "the CARDS figure and a See all link". Built per step 3 (n > 20: MOST WINS + See all link, no CARDS cell). One line to flip if step 5 wins.

## Tests
No existing assertion changed, none deleted. Before 7,856 (last reported total; the brief's 7,849 predates the +3 SEARCH_FOLD_ADMIN and +4 ADMIN_CREATE_CLUB tests). After 7,877 = +21, all in `seasonRecap.test.tsx`.
Shards (--maxWorkers=2, one at a time): 2,039 / 1,892 / 2,005 / 1,941, zero failures; fw1FeaturedDeck and linkedHandicapState did not fail.

## 320/390/430 checks (real component, real stylesheets, English, fixture data)
`docs/verification/season-recap/{kf,champ}_{320,390,430}.png`. Zero horizontal overflow, zero page errors. Photo band: KF 349.75px at 320 (title wraps), 324.0px at 390/430; Champions fallback 305.1px. Not checked: the real carousel switching chips in and out of a recap (needs the live carousel), device fonts, signed-in Our record.
