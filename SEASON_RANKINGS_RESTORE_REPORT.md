# Season rankings restore (Season recap amendment, step 7)

## 1. Restored: LPGA, Korn Ferry, LIV — new edge function `scrape-season-rankings`
Rebuilt from `scripts/scrape-r2d-rankings.cjs` at `212cb6bbd3~1`, without the Race to Dubai section (scrape-tour-rankings keeps `euro`). No Puppeteer: every site exposes JSON.

| tour_code | Source (JSON) |
|---|---|
| lpga | `https://www.lpga.com/-/statistics/statstable?year=Y&tableId=162ac4c4-eccb-4237-ab37-4df94aa99e13` (the XHR the rankings page makes) |
| pgad | `https://www.pgatour.com/korn-ferry-tour/pointslist` → `__NEXT_DATA__.props.pageProps.tourCupMetaList[0].officialPlayers` |
| liv | `https://www.livgolf.com/standings` → RSC payload `initialPlayerStandings` |
| champ | `https://www.pgatour.com/pgatour-champions/schwabcup` → `__NEXT_DATA__` list titled "Charles Schwab Cup Points" |

Write contract kept: upsert on `(tour_code, season_year, player_name)`; movement from our own previous run computed before the upsert (positive = up); stale sweep only after a successful write; `player_id` bound by exact folded name against `sr_players` by `tour_codes` (LPGA/KF pass 1 only as before; LIV two-pass as before); `scraped_at` on every row. Column mapping unchanged (KF/LIV: events null, wins 0, country null; LPGA: events, wins, country).

Minimum-rows guard per tour (writes nothing below): lpga 100, pgad 100, champ 50, liv 40.

**One deliberate deviation:** season year comes from the source (fallback UTC year). The old "November or later = next year" rule would have written today's finished 2026 lists as 2027. Ruling welcome if you want the old rule back.

## 2. Champions added
`tour_code champ`, Charles Schwab Cup Points from the URL above (events, points, wins mapped). Pass 1 tags tried: CHAMP/champ/SEN/sen/PGAS/pgas, then a unique exact first+last pass across sr_players.

## 3. PGA — skipped (addendum)
No scraper. The recap now reads PGA from `sr_player_statistics` for the final event's season (`fedex_points` descending, zero/null excluded, rank = sort position, as usePlayersRanking builds the Players race), dated by the newest `updated_at`; the freshness rule is unchanged. Code: `freshPgaStandings` in `useSeasonRecap.ts`. New test file `src/test/seasonRecapPgaStandings.test.ts` (3 tests). Shards 2,042 / 1,895 / 2,017 / 1,926 = 7,880 (+3 from 7,877, all new).

## 4. First run — 2026-11-09, season 2026
| tour | rows | top 3 | scraped_at |
|---|---|---|---|
| lpga | 190 (179 matched) | Nelly Korda 3,713.875 · Miyu Yamashita 3,210.626 · Jeeno Thitikul 2,922.625 | 2026-11-09T09:12:06.134Z |
| pgad | 223 (213 matched, 8 stale swept) | Ross Steelman 2,221.371 · Sandy Scott 2,190.801 · Ian Holt 1,617.765 | 2026-11-09T09:12:09.176Z |
| liv | 67 (65 matched) | Jon Rahm 1,057.54 · Bryson DeChambeau 788.70 · Joaquin Niemann 565.19 | 2026-11-09T09:12:10.574Z |
| champ | 140 (135 matched) | Stewart Cink 3,943,830 · Zach Johnson 3,757,828 · Steven Alker 2,643,207 | 2026-11-09T09:12:11.141Z |

Champions is "through the Simmons Bank Championship, November 1" — the season final isn't played yet, so the recap's freshness rule will keep it non-FINAL.

## 5. Korn Ferry acceptance
Top 3 matches: Steelman 2,221 / Scott 2,191 / Holt 1,618. Top 20 written (same feed the published list renders from): 1 Ross Steelman 2,221; 2 Sandy Scott 2,191; 3 Ian Holt 1,618; 4 Alistair Docherty 1,580; 5 Alvaro Ortiz 1,533; 6 Austin Hitt 1,491; 7 Cole Sherwood 1,483; 8 Doc Redman 1,466; 9 Blades Brown 1,402; 10 Tommy Morrison 1,289; 11 Cooper Dossey 1,200; 12 Hunter Eichhorn 1,190; 13 Dylan Menante 1,183; 14 Michael Johnson 1,120; 15 Jeremy Gandon 1,095; 16 Taylor Dickson 1,058; 17 Ian Gilligan 993; 18 Davis Shore 989; 19 Carson Young 939; 20 Davis Lamb 938. Freshness rule unchanged.

## Schedule — SQL for Ben to run (I ran none)
Daily at 06:45 UTC, like scrape-tour-rankings-euro-daily:
```sql
select cron.schedule(
  'scrape-season-rankings-daily',
  '45 6 * * *',
  $$ select net.http_post(
       url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/scrape-season-rankings',
       headers := '{"Content-Type":"application/json","apikey":"<publishable key>"}'::jsonb,
       body := '{"tour":"all"}'::jsonb) $$
);
```
One job covers lpga, pgad, liv and champ. No GitHub workflow, so no GitHub secrets; no table or column change.

## Not done / notes
- Unmatched names (e.g. KF "Jay Card III", "S.Y. Noh"; LIV "Do-Yeob Mun") stay with null player_id, as before.
- No app code or tests changed; no SQL or migrations.

## Rulings 1–5 (9 Nov 2026)
1. CARDS shows for any card line on a fresh list; 4th cell YOUNGEST when n ≤ 20, else MOST WINS (`recapFactCells`). Names only when n ≤ 20; else "See all {n} ›". New test in seasonRecap.test.tsx ("ruling 1"). No existing assertion changed.
2. `tour_standings_snapshots` removed as a recap source (`useSeasonRecap.ts`; rule in `seasonRecapRules.ts` header). Two new tests in seasonRecapPgaStandings.test.ts: a post-final snapshot no longer makes a stale list fresh (and the table isn't read); a fresh scraped_at still is.
3. Year rule ruling recorded in the scrape-season-rankings header. (Deployed copy unchanged — the edit is a comment.)
4. Board is one grid; PTS track = minmax(64px, max-content), nowrap. Champions top 3 (Cink 3,943,830) at 320/390/430: PTS 66.7px, one line, no clipping, page width = viewport. Hero figure 93px, one line, beside a two-line title at 320 and 390 (16px clear), one line at 430. Screens: docs/verification/season-recap/champ_pts_{320,390,430}.png (fixture, not SF Pro).
5. Access unchanged. No schedule created.

Shards: 2,045 / 1,895 / 2,017 / 1,926 = 7,883 (+3 from 7,880: the three tests above).
