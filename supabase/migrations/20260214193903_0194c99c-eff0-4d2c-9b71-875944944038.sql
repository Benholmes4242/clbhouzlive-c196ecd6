
-- Backfill timezone from raw_data.course_timezone for existing tournaments
UPDATE sr_tournaments
SET timezone = raw_data->>'course_timezone'
WHERE raw_data->>'course_timezone' IS NOT NULL
  AND raw_data->>'course_timezone' != '';
