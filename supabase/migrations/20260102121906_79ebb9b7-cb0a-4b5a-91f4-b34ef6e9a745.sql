-- Enable Realtime for course rating changes so lists/cards can update immediately

-- Ensure full row data is available on UPDATE events
ALTER TABLE public.course_ratings REPLICA IDENTITY FULL;

-- Add table to Supabase Realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'course_ratings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.course_ratings';
  END IF;
END $$;
