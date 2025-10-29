-- Add new fields to game_beacons table
ALTER TABLE public.game_beacons
ADD COLUMN IF NOT EXISTS host_handicap numeric,
ADD COLUMN IF NOT EXISTS other_player_handicaps numeric[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tee_time timestamp with time zone;

-- Create game_join_requests table
CREATE TABLE IF NOT EXISTS public.game_join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.game_beacons(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on game_join_requests
ALTER TABLE public.game_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own join requests
CREATE POLICY "Users can create their own join requests"
ON public.game_join_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.game_join_requests
FOR SELECT
TO authenticated
USING (auth.uid() = requester_user_id);

-- Policy: Game hosts can view requests for their games
CREATE POLICY "Game hosts can view requests for their games"
ON public.game_join_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_beacons
    WHERE game_beacons.id = game_join_requests.game_id
    AND game_beacons.host_user_id = auth.uid()
  )
);

-- Policy: Game hosts can update requests for their games
CREATE POLICY "Game hosts can update requests for their games"
ON public.game_join_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_beacons
    WHERE game_beacons.id = game_join_requests.game_id
    AND game_beacons.host_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_beacons
    WHERE game_beacons.id = game_join_requests.game_id
    AND game_beacons.host_user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_join_requests_game_id ON public.game_join_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_game_join_requests_requester_user_id ON public.game_join_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_game_join_requests_status ON public.game_join_requests(status);

-- Trigger for updated_at
CREATE TRIGGER update_game_join_requests_updated_at
BEFORE UPDATE ON public.game_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();