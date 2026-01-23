-- Schedule the daily rank snapshot job to run at midnight UTC
SELECT cron.schedule(
  'snapshot-daily-ranks',
  '0 0 * * *',  -- Every day at 00:00 UTC
  $$ SELECT public.snapshot_daily_ranks(); $$
);