
-- Helper function: refresh all expired blurbs by re-invoking the edge function
CREATE OR REPLACE FUNCTION public.refresh_expired_course_mood_blurbs()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_row record;
  v_count int := 0;
  v_url text := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/generate-course-mood-blurb';
  v_auth text := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw';
BEGIN
  FOR v_row IN
    SELECT course_id, user_id, mood
    FROM course_mood_blurbs
    WHERE expires_at < now()
    ORDER BY expires_at ASC
    LIMIT 500  -- safety cap per run
  LOOP
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', v_auth
      ),
      body := jsonb_build_object(
        'course_id', v_row.course_id,
        'user_id', v_row.user_id,
        'mood', v_row.mood
      )
    );
    v_count := v_count + 1;
    -- Rate limit: ~10 req/sec
    PERFORM pg_sleep(0.1);
  END LOOP;
  RETURN v_count;
END;
$$;

-- Schedule monthly refresh: 1st of each month at 03:00 UTC
SELECT cron.schedule(
  'refresh-course-mood-blurbs-monthly',
  '0 3 1 * *',
  $$ SELECT public.refresh_expired_course_mood_blurbs(); $$
);
