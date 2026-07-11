DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments_v2'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments_v2;
  END IF;
END $$;
ALTER TABLE public.comments_v2 REPLICA IDENTITY FULL;