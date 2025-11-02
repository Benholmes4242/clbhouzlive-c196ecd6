-- Phase 2: Visibility-aware RLS for games table
-- Add or update games read policy to enforce visibility rules

-- Drop existing read policies if they exist (we'll consolidate)
DROP POLICY IF EXISTS "Users can view games" ON games;
DROP POLICY IF EXISTS "read_games_visibility" ON games;

-- Create comprehensive read policy with visibility enforcement
CREATE POLICY "Users can view games with visibility rules" ON games
FOR SELECT
TO authenticated
USING (
  -- Always show your own games (hosted or participating)
  host_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM game_participants gp
    WHERE gp.game_id = games.id
      AND gp.user_id = auth.uid()
      AND gp.state IN ('invited', 'accepted')
  )
  OR
  -- Public games visible to all
  (
    visibility = 'public'
    AND status = 'active'
    AND expires_at > now()
  )
  OR
  -- Friends games: must follow the host
  (
    visibility = 'friends'
    AND status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1
      FROM user_follows uf
      WHERE uf.follower_id = auth.uid()
        AND uf.following_id = games.host_user_id
    )
  )
  OR
  -- Club games: must share home_club with host
  (
    visibility = 'club'
    AND status = 'active'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1
      FROM user_profiles me
      JOIN user_profiles host ON host.id = games.host_user_id
      WHERE me.id = auth.uid()
        AND me.home_club IS NOT NULL
        AND host.home_club IS NOT NULL
        AND me.home_club = host.home_club
    )
  )
);