-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION DOCUMENT RETENTION PURGE — CRON (run by hand in the SQL editor)
--
-- The SQL side (list_expired_verification_documents,
-- mark_verification_document_purged, verification_documents_referenced) ships in
-- a migration. Deleting bucket objects needs the service role, so both jobs call
-- the edge function verification-document-purge.
--
-- Replace <CRON_SECRET> with the value of the CRON_SECRET function secret.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. RETENTION SWEEP — daily 03:15 UTC ─────────────────────────────────────
-- approved → 90 days after decision, rejected/revoked → 30 days.
select cron.schedule(
  'verification-document-retention-purge',
  '15 3 * * *',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/verification-document-purge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := jsonb_build_object('mode', 'retention', 'limit', 200)
  );
  $$
);

-- ── 2. ORPHAN SWEEP — Sunday 03:45 UTC ───────────────────────────────────────
-- Objects older than 7 days that no request row references (uploads happen
-- before submit; orphans are pure liability).
select cron.schedule(
  'verification-document-orphan-purge',
  '45 3 * * 0',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/verification-document-purge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := jsonb_build_object('mode', 'orphans', 'limit', 200)
  );
  $$
);

-- ── Verify ───────────────────────────────────────────────────────────────────
-- select jobname, schedule, active from cron.job
-- where jobname like 'verification-document-%';
--
-- What was purged, and what failed:
-- select created_at, action, reason, metadata
-- from public.verification_audit_log
-- where action in ('document_purged','document_purge_failed')
-- order by created_at desc;
