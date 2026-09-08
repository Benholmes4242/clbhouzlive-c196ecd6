# Scheduled jobs: dispatch is green, result is unknown

Written 8 September 2026, after Race to Dubai was found sitting at one garbage row
with every health surface reporting success for weeks.

## The blindness

`public.cron_job_health` reads `cron.job_run_details.status`. For the 40-odd jobs
whose command is `net.http_post(...)`, that status records only whether the HTTP
request was **dispatched**. The function's response — 200, 500, `{"skipped":true}`,
a thrown exception, a partial write — is never inspected. `net._http_response`
rows are pruned within hours, so by the time anyone looks there is nothing to look at.

Therefore: **every scheduled edge function in this app reports "succeeded" whether
it worked or not.** This is a blindness by construction, not a bug in any one job.

Jobs whose command is plain SQL (`SELECT public.foo()`) are different: they run
inside a transaction, and a raised exception is recorded as `failed`. For those the
health board is telling the truth about *completion*, though still nothing about
*outcome* (a function that legitimately wrote zero rows looks identical to one that
should have written 200).

## Split of the 72 active jobs

- 41 dispatch an edge function via `net.http_post` — **result invisible**.
- 31 call a SQL function — **failure visible, empty result invisible**.

## Could a partial run delete or overwrite data?

### Non-transactional (edge functions — delete and insert are separate HTTP calls)

| Function | Pattern | Guard |
| --- | --- | --- |
| `scrape-tour-rankings` | delete-then-insert per tour on `tour_season_rankings` | **50-row floor**, refuses partial writes. This is the reference implementation. |
| `fetch-news` | **wipes the whole `news_articles` table**, then inserts | **None.** Any non-empty result triggers a full wipe; the delete error is logged and ignored, so an insert failure leaves the table empty. Not currently on a cron, but callable. Highest remaining risk of this class. |
| `daily-editorial-generation` | delete-then-insert scoped to one `(surface, season, time_filter, date)` row | Throws on delete error; an insert failure after a successful delete loses today's row only. Acceptable. |
| `sportradar-sync` | delete scoped to rows that are already null/zero | Scoped, no rewrite. Safe. |
| `generate-predictions` | delete/insert on `ti_generation_locks` only | Lock table, no member data. Safe. |
| `gam-evaluator` | deletes one stale badge row when the derived count is 0 | Scoped to one user/badge. Safe. |
| `cleanup-*`, `verification-document-purge`, `delete-*` | deletion **is** the job | Intentional. Out of scope. |

### Transactional (SQL functions — delete/truncate and insert in one transaction)

`refresh_course_tee_sets` (TRUNCATE), `refresh_hero_stories`,
`refresh_latest_records_cache`, `refresh_eagle_leaders`,
`refresh_legendary_leaders`, `refresh_hardest_holes_cache`,
`record_system_state`, `snapshot_tour_season_rankings`,
`prune_leaderboard_snapshots`, `create_round_posts`.

All of these clear then rewrite, but a failure rolls the whole statement back, so a
partial run cannot leave the table emptied. The residual risk is different and
smaller: a run that succeeds while its **source** query returns nothing will
happily replace a full cache with an empty one, and nothing complains. No row-count
floor exists on any of them.

## The one bad second writer, now removed

`.github/workflows/scrape-r2d-rankings.yml` + `scripts/scrape-r2d-rankings.cjs`
(Puppeteer, Monday 06:00 UTC) wrote to `tour_season_rankings` in competition with
the edge function. Its stale-row sweep deleted everything on **any** non-zero
upsert; one scraped footnote row counted as success. Both files deleted 8 Sep 2026.
`tour_season_rankings` now has exactly one writer: `scrape-tour-rankings`.
`snapshot_tour_season_rankings` only reads it.

## What would actually fix this

1. **Result assertion, not dispatch assertion.** Each scheduled function writes one
   row to a `job_runs` table on completion (name, started, finished, rows written,
   ok/failed, message). `cron_job_health` joins on it. A job with a green dispatch
   and no result row for its schedule is *failing*, and says so.
2. **Row-count floors on every clear-and-rewrite**, transactional ones included,
   reported into the admin health surface when a board is below its floor.
3. **`fetch-news` gets a floor** or stops wiping the table.

Both (1) and (2) pair with the outstanding `app_error` surfacing: the evidence is
already being written and nobody reads it.

## Note, not a chase

`scrape-tour-rankings` matched 211 of 225 DP World players on 8 Sep; the single
unmatched name was an ambiguous "Jack Buchanan". Fine at that level. Escalate only
if the unmatched count climbs.
