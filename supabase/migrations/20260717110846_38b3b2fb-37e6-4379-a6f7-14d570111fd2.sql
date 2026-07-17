-- 1. Ensure the two missing Vault secrets exist (idempotent).
DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cleanup_secret') THEN
    PERFORM vault.create_secret(
      'clbhouz_cleanup_8f7d3c1a9e2b4a6f91c0e5b7d3a2f8c6',
      'cleanup_secret',
      'x-cleanup-secret header used by cleanup-review-videos cron job'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'whs_cron_secret') THEN
    PERFORM vault.create_secret(
      '71c89bffa169d2a92d314b22ac8babfa5847df4368de9910de20041dabb8fd69',
      'whs_cron_secret',
      'x-cron-secret header used by sync-whs-due cron job'
    );
  END IF;
END
$mig$;

-- 2. Unschedule the 7 postgres-owned jobs that need re-standardization.
DO $mig$
DECLARE
  jn TEXT;
BEGIN
  FOREACH jn IN ARRAY ARRAY[
    'cleanup-review-videos-hourly',
    'generate-editorial-cards-weekly',
    'generate-champion-narratives-weekly',
    'sync-whs-due-every-6h',
    'gam-course-mapping-orchestrator-6h',
    'snapshot-friend-leaderboard-daily',
    'echo-engine-health-daily'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = jn AND username = 'postgres') THEN
      PERFORM cron.unschedule(jn);
    END IF;
  END LOOP;
END
$mig$;

-- 3. Re-schedule the 7 jobs under postgres with the standard pattern.

-- 3.1 cleanup-review-videos-hourly (custom header, Vault-sourced)
SELECT cron.schedule(
  'cleanup-review-videos-hourly',
  '0 * * * *',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/cleanup-review-videos',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cleanup-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cleanup_secret')
    )
  ) AS request_id;
  $CMD$
);

-- 3.2 generate-editorial-cards-weekly (accepted-risk migration; no more plaintext service_role)
SELECT cron.schedule(
  'generate-editorial-cards-weekly',
  '0 6 * * 1',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/generate-editorial-cards',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  ) AS request_id;
  $CMD$
);

-- 3.3 generate-champion-narratives-weekly
SELECT cron.schedule(
  'generate-champion-narratives-weekly',
  '0 2 * * 1',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/generate-champion-narratives',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    timeout_milliseconds := 3000
  ) AS request_id;
  $CMD$
);

-- 3.4 sync-whs-due-every-6h (custom header, Vault-sourced)
SELECT cron.schedule(
  'sync-whs-due-every-6h',
  '0 */6 * * *',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/sync-whs-due',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='whs_cron_secret')
    )
  ) AS request_id;
  $CMD$
);

-- 3.5 gam-course-mapping-orchestrator-6h
SELECT cron.schedule(
  'gam-course-mapping-orchestrator-6h',
  '0 */6 * * *',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/gam-course-mapping-orchestrator',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $CMD$
);

-- 3.6 snapshot-friend-leaderboard-daily
SELECT cron.schedule(
  'snapshot-friend-leaderboard-daily',
  '15 1 * * *',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/snapshot-friend-leaderboard',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $CMD$
);

-- 3.7 echo-engine-health-daily (was raw service_role-from-vault Bearer)
SELECT cron.schedule(
  'echo-engine-health-daily',
  '0 6 * * *',
  $CMD$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/echo-engine-health',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    body := '{"source":"cron"}'::jsonb
  ) AS request_id;
  $CMD$
);