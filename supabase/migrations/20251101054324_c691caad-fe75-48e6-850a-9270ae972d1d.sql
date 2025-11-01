-- ============================================
-- RLS FIX: game_participants recursion
-- ============================================

-- 1) Helper function to check participation without recursive policy evaluation
CREATE OR REPLACE FUNCTION public.user_is_game_participant(_game_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM game_participants
    WHERE game_id = _game_id
      AND user_id = _user_id
  );
$$;

-- 2) Drop the recursive SELECT policy and recreate a safe one
DROP POLICY IF EXISTS gp_read ON public.game_participants;

CREATE POLICY gp_read ON public.game_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.games g
    WHERE g.id = game_participants.game_id
      AND (
        g.host_user_id = auth.uid()
        OR public.user_is_game_participant(g.id, auth.uid())
        OR (g.visibility = 'public' AND g.status = 'active' AND g.expires_at > now())
      )
  )
);

-- Safety: ensure RLS + realtime config are sane
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants REPLICA IDENTITY FULL;

-- Note: Cannot use ALTER PUBLICATION syntax in migrations, this should already be configured