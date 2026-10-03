-- EG SYNC: four runs a day, renamed job, rate_limited on the health board.
-- NOT APPLIED. For Ben to run by hand. Supersedes PART 1 of
-- eg_sync_token_unavailable.sql (the 08/14/22 schedule).
--
-- Pairs with the edge-function change already in the repo:
-- sync-whs-due DEFAULT_SYNC_INTERVAL_HOURS 6 -> 4, so the per-connection defer
-- sits two hours under the six-hour tick and cannot drift past the due window.
-- Deploy that function BEFORE or WITH this SQL; the cron change alone does nothing.

BEGIN;

-- ── 1+2. Re-anchor and rename job 87 in place (no delete, no catch-up job). ──
-- 08/14/20/02 UTC = 09/15/21/03 BST, 08/14/20/02 GMT after 25 October.
-- Offset is deliberate (token windows) — do not round to 00/06/12/18.
SELECT cron.alter_job(
  job_id   := 87,
  schedule := '0 8,14,20,2 * * *'
);
-- alter_job has no name parameter; rename directly on cron.job.
UPDATE cron.job SET jobname = 'sync-whs-due' WHERE jobid = 87;

-- ── 3. get_eg_sync_health: same transaction, so the board never loses the cron.
-- Edit the CURRENT definition (pg_get_functiondef('public.get_eg_sync_health'::regproc))
-- rather than pasting an older copy:
--
--  (a) cron lookup:
--      WHERE jobname = 'sync-whs-due-every-6h'   ->   WHERE jobname = 'sync-whs-due'
--
--  (b) DECLARE:  v_rate_limited int;
--      after the auth_failed count:
--        SELECT COUNT(*) INTO v_rate_limited
--        FROM whs_connections
--        WHERE provider = 'england_golf' AND deleted_at IS NULL
--          AND last_sync_status = 'rate_limited';
--
--  (c) jsonb_build_object: add  'rate_limited', v_rate_limited,
--
--  (d) If any staleness threshold assumes one run per 6h it still holds (max
--      gap is now 6h). No change needed to the token_unavailable branch.
--
-- CREATE OR REPLACE FUNCTION public.get_eg_sync_health() ... ;  -- edited body here

COMMIT;

-- Checks:
--   SELECT jobid, jobname, schedule FROM cron.job WHERE jobid = 87;
--     expect 'sync-whs-due', '0 8,14,20,2 * * *'
--   SELECT get_eg_sync_health();
--     expect cron_last_run populated (not null) and a rate_limited key.
--
-- Expected, not faults:
--   * The 02:00 UTC (03:00 BST) run will sometimes abort token_unavailable when
--     the evening token was captured early afternoon. Connections untouched.
--   * EG calls rise ~66 -> ~88 member syncs/day; watch rate_limited.
