-- Fix user_nearby_status RLS policies and realtime for nearby golfers feature
-- FK already exists, just need to fix policies and enable realtime

-- 1) Add performance indexes for our query filters
CREATE INDEX IF NOT EXISTS idx_nearby_visibility_time
  ON public.user_nearby_status (visibility_mode, last_location_update DESC);

CREATE INDEX IF NOT EXISTS idx_nearby_user_id
  ON public.user_nearby_status (user_id);

-- 2) Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS nearby_insert_self ON public.user_nearby_status;
DROP POLICY IF EXISTS nearby_update_self ON public.user_nearby_status;
DROP POLICY IF EXISTS nearby_select_self ON public.user_nearby_status;
DROP POLICY IF EXISTS nearby_select_visible ON public.user_nearby_status;

-- 3) Create RLS policies
-- Users can insert their own location status
CREATE POLICY nearby_insert_self ON public.user_nearby_status
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own location status
CREATE POLICY nearby_update_self ON public.user_nearby_status
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own status
CREATE POLICY nearby_select_self ON public.user_nearby_status
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can view other users' status if not hidden and recently updated
CREATE POLICY nearby_select_visible ON public.user_nearby_status
  FOR SELECT 
  USING (
    visibility_mode <> 'hidden'
    AND lat IS NOT NULL
    AND lng IS NOT NULL
    AND last_location_update > now() - interval '24 hours'
  );

-- 4) Enable realtime for live updates
ALTER TABLE public.user_nearby_status REPLICA IDENTITY FULL;

-- Add table to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_nearby_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_nearby_status;
  END IF;
END $$;