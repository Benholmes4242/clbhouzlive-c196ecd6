-- Create game_beacons table for Phase 3: Create a Game
CREATE TABLE public.game_beacons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  course_name TEXT,
  game_type TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  participants UUID[],
  note TEXT
);

-- Create indexes for efficient querying
CREATE INDEX game_beacons_active_idx ON public.game_beacons (is_active, expires_at);
CREATE INDEX game_beacons_host_idx ON public.game_beacons (host_user_id);

-- Enable Row Level Security
ALTER TABLE public.game_beacons ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own game beacons
CREATE POLICY "users can create their own game beacons"
ON public.game_beacons
FOR INSERT
TO authenticated
WITH CHECK (host_user_id = auth.uid());

-- Policy: Users can update their own beacons
CREATE POLICY "users can update their own beacons"
ON public.game_beacons
FOR UPDATE
TO authenticated
USING (host_user_id = auth.uid())
WITH CHECK (host_user_id = auth.uid());

-- Policy: Anyone can read active, non-expired beacons
CREATE POLICY "anyone can read active beacons"
ON public.game_beacons
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND expires_at > now()
);

-- Enable realtime for live beacon updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_beacons;