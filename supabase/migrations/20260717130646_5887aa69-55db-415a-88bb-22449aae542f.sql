SELECT cron.schedule(
  'test-internal-secret-guard-once',
  '* * * * *',
  $$SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/gam-course-mapping-orchestrator',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw',
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='INTERNAL_FN_SECRET')
    ),
    body := jsonb_build_object('triggered_at', now(), 'source','guard-test')
  ) AS request_id;$$
);