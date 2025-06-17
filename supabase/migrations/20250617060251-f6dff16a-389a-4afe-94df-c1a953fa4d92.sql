
-- Add a user_follows table for following relationships (different from friends)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Add Row Level Security (RLS) if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE n.nspname = 'public' AND c.relname = 'user_follows' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for user_follows if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_follows' 
        AND policyname = 'Users can view their follow relationships'
    ) THEN
        CREATE POLICY "Users can view their follow relationships" 
          ON public.user_follows 
          FOR SELECT 
          USING (auth.uid() = follower_id OR auth.uid() = following_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_follows' 
        AND policyname = 'Users can create follow relationships'
    ) THEN
        CREATE POLICY "Users can create follow relationships" 
          ON public.user_follows 
          FOR INSERT 
          WITH CHECK (auth.uid() = follower_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_follows' 
        AND policyname = 'Users can delete their follow relationships'
    ) THEN
        CREATE POLICY "Users can delete their follow relationships" 
          ON public.user_follows 
          FOR DELETE 
          USING (auth.uid() = follower_id);
    END IF;
END $$;
