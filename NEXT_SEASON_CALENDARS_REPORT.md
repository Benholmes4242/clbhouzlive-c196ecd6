# FIX: Keep next season's calendars loading — report

## 1. Rolling years
- `daily-schedule-sync/index.ts`: `YEARS_TO_SYNC = [2025, 2026]` → `yearsToSync()` = `[UTC year, UTC year + 1]`, computed **inside each run** (a warm instance crosses New Year correctly). Same two calls per tour.
- A next-year 404 is recorded as `not_published`, logged "not published yet (404)", counts as OK for the `sr_cron_status` success/partial verdict, and the loop continues.
- Other hard-coded years that blocked next season, changed:
  - `sportradar-sync/index.ts:107` default `|| 2026` → current UTC year.
  - `daily-schedule-sync` final-leaderboard fallback `season?.year || 2026` → the tournament's end-date year.
- Left alone (not loaders): the 2025 WGR doc comment, the 2026 LIV coverage note.

## 2. The missing events — not missing
Read via the public API (no SQL), events joined to the 2027 season rows:

| tour | reply said | stored on 2027 row (before = after; no re-sync run) |
|---|---|---|
| champ | 27 | 27 (26 stroke, 1 team) |
| pgad | 25 | 25 |
| euro | — | 39 (38 stroke, 1 cup) |
| pga | — | 29 (27 stroke, 1 team, 1 cup) |

All rows were written at 2026-11-09 10:10 and attach to `champ-2027` / `pgad-2027` / `euro-2027` / `pga-2027`. So no upserts failed and nothing went to another season; the 12/13 figures most likely came from a query that filtered or grouped differently (e.g. by `event_type`, status or a distinct column). Please share that query if the gap persists.
Hardening anyway: the tournament upsert now returns `.select('id')` and `records_synced` adds only rows returned; every failed upsert logs its sr_id and name.

## 3. Season rows with no status or dates
Cause: the schedule payload keeps season metadata under `season`, but `syncSchedule` read status/dates from the top level, so every `{tour}-{year}` row was written NULL. These fallback rows are the ones that **hold the tournaments**; the UUID-sr_id rows (e.g. "2026 DP World Tour") have the metadata but no events.
Fix (`seasonFieldsFor` in sportradar-sync): payload `season.*` first; else dates = min tournament start / max end; else status derived from those dates (scheduled / inprogress / closed). Season identity (sr_id) is unchanged, so a re-run updates the same row instead of creating another.

Repair SQL for Ben (I ran nothing):

```sql
-- 1) Look
SELECT s.id, s.sr_id, s.tour_name, s.year, s.status, s.start_date, s.end_date,
       count(t.id) AS events, min(t.start_date) AS first_start, max(t.end_date) AS last_end
FROM sr_seasons s LEFT JOIN sr_tournaments t ON t.season_id = s.id
WHERE s.year IN (2026, 2027) AND (s.status IS NULL OR s.start_date IS NULL OR s.end_date IS NULL)
GROUP BY s.id ORDER BY s.tour_name, s.year;

-- 2) Fill from their own tournaments (rows with events only)
UPDATE sr_seasons s SET
  start_date = x.first_start, end_date = x.last_end,
  status = CASE WHEN current_date < x.first_start THEN 'scheduled'
                WHEN current_date > x.last_end  THEN 'closed' ELSE 'inprogress' END
FROM (SELECT season_id, min(start_date) first_start, max(end_date) last_end
      FROM sr_tournaments GROUP BY season_id) x
WHERE x.season_id = s.id AND s.year IN (2026, 2027)
  AND (s.status IS NULL OR s.start_date IS NULL OR s.end_date IS NULL);
```
No delete is proposed: every empty-status 2026/2027 row carries that tour's events (and PGA FedEx stats key on season_id).

## 4. DP World check
- 2027 euro opens 26 Nov 2026; finale ends 15 Nov → gap 11 days ≤ `RECAP_NEXT_EVENT_WINDOW_DAYS` (21), so `isBetweenSeasons` returns false: upcoming state, not recap.
- Upcoming bucket (`useTournamentsCache`): `status in (scheduled, created)`, `start_date > today`, ordered by date, no season-year filter; the recap's `nextStart` comes from those slides. Next-season events are picked by date.
- New test in `src/test/seasonRecap.test.tsx`: "a next season starting within 21 days of the finale never shows the recap (DP World 2027)".

## Tests
`npx vitest run --shard=N/4 --maxWorkers=2`, each separately: 2,046 / 1,895 / 2,013 / 1,937 = **7,891**, zero failures (fw1/linkedHandicapState did not appear).
Brief baseline 7,883 → last reported 7,890 (+7 ADD_COURSE_CLUB_1 tests) → 7,891 (+1, the new DP World test).
Edge functions changed: `daily-schedule-sync`, `sportradar-sync` (auto-deploy). No SQL, migrations, feed_config or round_pool_cap changes.
