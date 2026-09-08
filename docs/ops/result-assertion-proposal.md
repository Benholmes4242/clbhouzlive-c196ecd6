# Proposal: result assertion for scheduled work

Written 8 September 2026. Companion to `scheduled-job-result-blindness.md`.
Nothing here is built yet — this is the shape for approval. Separate workstream
from the Tour rebuild.

## 1. `job_runs` — each function reports its own outcome

Do not try to capture `pg_net` responses; they are pruned and it is the wrong
end of the problem. Invert it: the function writes one row about itself.

```
public.job_runs
  id          uuid pk
  job_name    text not null        -- 'scrape-tour-rankings', matches cron.job.jobname where one exists
  started_at  timestamptz not null
  finished_at timestamptz
  status      text not null        -- 'ok' | 'skipped' | 'below_floor' | 'failed'
  rows_written integer not null default 0
  rows_before  integer             -- population it replaced, where the job replaces
  detail      jsonb                -- per-job breakdown (e.g. per-tour counts, unmatched names)
  error_text  text
```

Grants: `service_role` full (the functions write it); `authenticated` read only
through a `SECURITY DEFINER` reader gated on `is_panel_admin()`, exactly as
`get_cron_job_health()` is. No `anon`.

Retention: keep 30 days, pruned by the same nightly cleanup that handles the
other logs. Indexed on `(job_name, started_at desc)`.

### The one pattern, applied 41 times

A tiny shared helper in `supabase/functions/_shared/job-run.ts`:

```ts
const run = await beginJobRun(supabase, 'scrape-tour-rankings');
try {
  ...
  await run.finish({ status: 'ok', rowsWritten: n, rowsBefore: prev, detail });
} catch (e) {
  await run.finish({ status: 'failed', error: normalizeError(e).message });
  throw e;
}
```

`beginJobRun` inserts the row immediately, so a function that dies mid-run
leaves a row with `finished_at IS NULL` — itself a signal, and one dispatch
status can never give.

### What the health board then reads

`cron_job_health` gains a left join on the latest `job_runs` row per job name and
three derived states:

- **stale** — a job whose schedule says it should have run and has no `job_runs`
  row inside its window. Dispatch green plus no result row is a *failure*.
- **empty** — `status = 'ok'` with `rows_written = 0` on a job that writes.
  This is the sentence that would have caught Race to Dubai on day one.
- **below floor** — reported by the job itself.

Rollout: helper plus table, then the 41 functions in batches of roughly eight,
highest-consequence first (rankings, sportradar sync, editorial, notification
drains). Jobs whose command is plain SQL keep their transactional failure
reporting and get the same row from a small SQL wrapper.

## 2. Floors on the clear-and-rewrite SQL refreshers

Transactions stop a *half*-empty table; they do nothing about a clean run over
an empty source committing a full cache away. Each refresher gets a floor
expressed against its own previous population, not a fixed number:

```sql
select count(*) into v_before from public.<cache>;
-- build v_incoming into a temp table first, never TRUNCATE before it exists
if v_before > 0 and v_incoming < greatest(v_floor_abs, (v_before * v_ratio)::int) then
  insert into public.job_runs(job_name, started_at, finished_at, status, rows_written, rows_before)
  values ('refresh_<cache>', v_started, now(), 'below_floor', v_incoming, v_before);
  return;  -- previous cache stands
end if;
```

Proposed ratios, by how volatile the source actually is:

| Refresher | Ratio | Absolute floor | Why |
| --- | --- | --- | --- |
| `refresh_course_tee_sets` | **0.9** | 500 | Tee sets are near-static reference data feeding the tee picker — the only way a member changes their tee. A 10% drop is already wrong, and there is no legitimate reason for one. Strictest of the set. |
| `refresh_hero_stories`, `refresh_latest_records_cache` | 0.5 | 1 | Genuinely churny, editorial-driven; half is the right instinct here. |
| `refresh_eagle_leaders`, `refresh_legendary_leaders`, `refresh_hardest_holes_cache` | 0.5 | 5 | Derived from member rounds, grows slowly, never shrinks by half honestly. |
| `snapshot_tour_season_rankings` | 0.5 | 50 | Matches the 50-row floor already in `scrape-tour-rankings`, its source. |
| `prune_leaderboard_snapshots`, `record_system_state`, `create_round_posts` | none | — | Deletion or append is the job; a floor is meaningless. |

So: your instinct of "refuses below half" as the default, with tee sets pulled
much tighter because its source is reference data rather than a feed.

## 3. Order

1. `fetch-news` floor — **done** (8 Sep, see below).
2. `job_runs` table + helper + health board read.
3. Refresher floors, tee sets first.
4. The 41 functions, in batches.

### `fetch-news`, already fixed

It no longer wipes and hopes. It holds the replacement set, checks it against
`max(10, previous × 0.5)`, **inserts** it, and only then deletes the rows it
measured before the insert. A failure at any step leaves the previous articles
standing; there is no window in which `news_articles` is empty. A below-floor run
refuses, touches nothing, and logs `fetch-news BELOW FLOOR: …` with both counts —
ready to become a `job_runs` row when the table exists.
