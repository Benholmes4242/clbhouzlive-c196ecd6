-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Replace SELECT policy to allow hosts to view their own games immediately after insert
DROP POLICY IF EXISTS "Users can view games" ON public.games;
CREATE POLICY "Users can view games"
ON public.games
FOR SELECT
USING (
  host_user_id = auth.uid()
  OR user_can_see_game(id, auth.uid())
);
