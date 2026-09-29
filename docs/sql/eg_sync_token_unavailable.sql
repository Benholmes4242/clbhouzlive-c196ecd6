-- EG SYNC: off the dead window, and "no token" is not "members broken".
-- NOT APPLIED. For Ben to run by hand. No migration file was created.
--
-- The sync-whs-due edge function now checks EG_PREAUTH_TOKEN before touching
-- any connection. When it is missing or expired it aborts (no claim, no status,
-- no consecutive_failures) and writes app_config.eg_sync_last_run =
-- {"outcome":"token_unavailable","reason":"missing|expired",...}. A normal run
-- writes {"outcome":"ran",...}. Part 2 surfaces that on the board.

-- ── PART 1: re-anchor job 87 in place (02/08/14/20 UTC). ─────────────────────
-- Schedule is UTC; the token refresh habit is local, so the margin narrows by an
-- hour after 25 October. 08:00 UTC still clears the morning refresh.
SELECT cron.alter_job(
  job_id   := (SELECT jobid FROM cron.job WHERE jobname = 'sync-whs-due-every-6h'),
  schedule := '0 2,8,14,20 * * *'
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
