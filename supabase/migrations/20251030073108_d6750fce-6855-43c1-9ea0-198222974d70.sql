-- Update RLS policies for game_join_requests to validate games are public/active

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own join requests" ON public.game_join_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.game_join_requests;

-- Allow any authenticated user to request to join a public, active game
CREATE POLICY "Users can create join requests for public games"
ON public.game_join_requests
FOR INSERT
WITH CHECK (
  requester_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_join_requests.game_id
      AND g.visibility = 'public'
      AND g.status = 'active'
      AND g.expires_at > now()
  )
);

-- Requesters and hosts can view their related requests
CREATE POLICY "Requesters and hosts can view their join requests"
ON public.game_join_requests
FOR SELECT
USING (
  requester_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_join_requests.game_id
      AND g.host_user_id = auth.uid()
  )
);