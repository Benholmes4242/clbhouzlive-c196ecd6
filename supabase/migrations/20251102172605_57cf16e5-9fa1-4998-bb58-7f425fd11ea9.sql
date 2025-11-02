-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles of game participants" ON public.user_profiles;

-- Create security definer function to check game participant visibility
CREATE OR REPLACE FUNCTION public.can_view_game_participant_profile(
  _profile_user_id uuid,
  _viewer_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_participants gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.user_id = _profile_user_id
      AND (
        g.host_user_id = _viewer_id
        OR EXISTS (
          SELECT 1
          FROM public.game_participants gp2
          WHERE gp2.game_id = g.id
            AND gp2.user_id = _viewer_id
        )
      )
  );
$$;

-- Set proper function ownership to postgres
ALTER FUNCTION public.can_view_game_participant_profile(uuid, uuid) OWNER TO postgres;

-- Limit who can run the function
REVOKE ALL ON FUNCTION public.can_view_game_participant_profile(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_game_participant_profile(uuid, uuid) TO authenticated;

-- Re-create the policy using the security definer function, with self-view always allowed
CREATE POLICY "Users can view profiles of game participants"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.can_view_game_participant_profile(id, auth.uid())
);

-- Performance indexes to keep the policy fast
CREATE INDEX IF NOT EXISTS idx_gp_user_id ON public.game_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_gp_game_id ON public.game_participants (game_id);
CREATE INDEX IF NOT EXISTS idx_games_host_user_id ON public.games (host_user_id);