-- Kill broken job 17 (sportradar-sync with literal "YOUR_SERVICE_ROLE_KEY")
SELECT cron.unschedule(17);