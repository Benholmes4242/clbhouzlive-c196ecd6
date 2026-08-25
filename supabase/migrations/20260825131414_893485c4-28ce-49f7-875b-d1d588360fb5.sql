-- The euro (Race to Dubai) list had no scheduled ingest at all: the rewritten
-- JSON-feed function existed but nothing called it, so the single junk row
-- written by the retired HTML scraper on 10 Aug 2026 sat in production
-- untouched. Schedule it, ahead of the Monday 07:30 snapshot job.
select cron.schedule(
  'scrape-tour-rankings-euro-daily',
  '45 6 * * *',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/scrape-tour-rankings',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw'
    ),
    body := jsonb_build_object('tour','euro')
  );
  $$
);

-- rebuild_euro_season_rankings() looked for sr_seasons.name = '2026' while the
-- real rows are named '2026 Season' / '2026 DP World Tour', so it always
-- returned SKIPPED. Left scheduled it is a loaded gun: any future rename would
-- let it DELETE the scraped list and rebuild it from EURO stats that do not
-- exist. The scraper is now the single owner of euro season rankings.
select cron.unschedule('rebuild-euro-rankings-daily');