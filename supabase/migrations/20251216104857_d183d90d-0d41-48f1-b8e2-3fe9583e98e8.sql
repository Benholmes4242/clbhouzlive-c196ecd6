-- Enable Realtime for social graph tables
-- This allows real-time subscriptions to user_follows, business_follows, and user_friends

-- Enable REPLICA IDENTITY FULL for complete row data in realtime events
ALTER TABLE public.user_follows REPLICA IDENTITY FULL;
ALTER TABLE public.user_friends REPLICA IDENTITY FULL;
ALTER TABLE public.business_follows REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication if not already added
DO $$
BEGIN
  -- Check if publication exists and add tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add user_follows if not already in publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_follows'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
    END IF;
    
    -- Add user_friends if not already in publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'user_friends'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_friends;
    END IF;
    
    -- Add business_follows if not already in publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'business_follows'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.business_follows;
    END IF;
  END IF;
END $$;