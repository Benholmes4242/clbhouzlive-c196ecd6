-- EG SYNC: off the dead window, and "no token" is not "members broken".
-- NOT APPLIED. For Ben to run by hand. No migration file was created.
--
-- The sync-whs-due edge function now checks EG_PREAUTH_TOKEN before touching
-- any connection. When it is missing or expired it aborts (no claim, no status,
-- no consecutive_failures) and writes app_config.eg_sync_last_run =
-- {"outcome":"token_unavailable","reason":"missing|expired",...}. A normal run
-- writes {"outcome":"ran",...}. Part 2 surfaces that on the board.

-- ── PART 1: re-anchor job 87 in place (08/14/22 UTC, three runs a day). ─────
-- Morning token (set 07:20–07:50 local) reliably covers 06:25–16:25 UTC, so
-- 08:00 and 14:00 are unconditionally covered. The evening refresh wanders
-- (12:27–22:23 local over twelve days); 22:00 UTC sits after all but one recent
-- evening capture and catches the day's play. 02:00 was the worst slot (failed
-- 4/12) and 20:00 failed 2/12, so both are dropped. alter_job only: no delete,
-- no recreate, no catch-up job.
SELECT cron.alter_job(
  job_id   := 87,
  schedule := '0 8,14,22 * * *'
);
-- Check: SELECT jobid, jobname, schedule FROM cron.job WHERE jobname = 'sync-whs-due-every-6h';

-- ── PART 2: get_eg_sync_health reports token_unavailable separately. ─────────
-- Apply by editing the CURRENT definition (pg_get_functiondef) rather than
-- pasting an older copy. Three additions:
--
-- (a) DECLARE:
--   v_run jsonb;
--   v_token_unavailable boolean := false;
--
-- (b) after the cron.job_run_details lookup:
--   SELECT CASE WHEN value ~ '^\s*\{' THEN value::jsonb END INTO v_run
--   FROM app_config WHERE key = 'eg_sync_last_run';
--   v_token_unavailable := COALESCE(v_run->>'outcome', '') = 'token_unavailable';
--
-- (c) status ladder — add FIRST after the idle branch, so it outranks staleness:
--   ELSIF v_token_unavailable THEN
--     v_status := 'red';
--
-- (d) jsonb_build_object — add:
--   'token_unavailable', v_token_unavailable,
--   'token_unavailable_reason', v_run->>'reason',
--   'last_run_at', (v_run->>'at')::timestamptz,
--
-- auth_failed keeps its meaning (a member's own stored credential) and is not
-- changed. The dashboard already reads token_unavailable and shows "No token".
--
-- ── One-off cleanup (optional): rows wrongly marked by the 29 Sep 06:00 run
-- will clear on the next successful sweep; no data edit is needed.


-- ── PART 3: PROVE the app_config write before closing (do not skip). ─────────
-- The function writes with the service-role client. Service role bypasses RLS
-- but still needs table privileges:
--   SELECT has_table_privilege('service_role', 'public.app_config', 'INSERT'),
--          has_table_privilege('service_role', 'public.app_config', 'UPDATE');
--   -- if either is false: GRANT INSERT, UPDATE ON public.app_config TO service_role;
--
-- Forced no-token run:
--   1. Note the current EG_PREAUTH_TOKEN, then blank it in Edge Function secrets.
--   2. Invoke sync-whs-due once (same headers as job 87). Expect HTTP 503,
--      error "token_unavailable", reason "missing".
--   3. SELECT value, updated_at FROM app_config WHERE key = 'eg_sync_last_run';
--      expect outcome token_unavailable, reason missing, updated_at = now-ish.
--   4. SELECT get_eg_sync_health(); expect status red, token_unavailable true,
--      token_unavailable_reason 'missing' (requires PART 2 applied); the admin
--      dashboard should show red with "No token".
--   5. Restore the token and invoke once more; expect outcome "ran".
--   If step 3 shows no fresh row, check the function log for
--   "[sync-due] run record write failed" — that is the denial.
