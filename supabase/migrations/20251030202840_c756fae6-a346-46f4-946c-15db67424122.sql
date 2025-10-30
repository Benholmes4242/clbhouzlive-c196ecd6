-- Phase 1: Server-side realtime fixes (fully defensive)

-- 1) Add tables to realtime publication (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_join_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_join_requests;
  END IF;
END $$;

-- 2) Set REPLICA IDENTITY FULL for all game-related tables
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_participants REPLICA IDENTITY FULL;
ALTER TABLE public.game_join_requests REPLICA IDENTITY FULL;

-- 3) Create or update user_nearby_status table
CREATE TABLE IF NOT EXISTS public.user_nearby_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add is_hidden column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_nearby_status' 
    AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE public.user_nearby_status ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_nearby_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_nearby_status;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL
ALTER TABLE public.user_nearby_status REPLICA IDENTITY FULL;

-- Enable RLS
ALTER TABLE public.user_nearby_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can view non-hidden nearby status" ON public.user_nearby_status;
DROP POLICY IF EXISTS "Users can insert their own status" ON public.user_nearby_status;
DROP POLICY IF EXISTS "Users can update their own status" ON public.user_nearby_status;
DROP POLICY IF EXISTS "Users can delete their own status" ON public.user_nearby_status;

-- Create RLS policies
CREATE POLICY "Users can view non-hidden nearby status"
  ON public.user_nearby_status
  FOR SELECT
  USING (is_hidden = false AND updated_at > now() - interval '5 minutes');

CREATE POLICY "Users can insert their own status"
  ON public.user_nearby_status
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status"
  ON public.user_nearby_status
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status"
  ON public.user_nearby_status
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_nearby_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_nearby_status_updated_at ON public.user_nearby_status;
CREATE TRIGGER user_nearby_status_updated_at
  BEFORE UPDATE ON public.user_nearby_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_nearby_status_updated_at();