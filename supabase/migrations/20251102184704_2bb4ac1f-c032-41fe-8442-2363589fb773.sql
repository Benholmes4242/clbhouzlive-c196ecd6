-- 1) Drop old FK to auth.users if it exists
ALTER TABLE public.game_participants
  DROP CONSTRAINT IF EXISTS game_participants_user_id_fkey;

-- 2) Add FK to user_profiles so PostgREST can embed
ALTER TABLE public.game_participants
  ADD CONSTRAINT game_participants_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.user_profiles(id)
  ON DELETE CASCADE;

-- 3) Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_gp_game_id ON public.game_participants (game_id);
CREATE INDEX IF NOT EXISTS idx_gp_user_id ON public.game_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_gp_role_state ON public.game_participants (role, state);

-- 4) Ensure RLS policy allows reading participants for my games
DROP POLICY IF EXISTS "Can read participants for my games" ON public.game_participants;
CREATE POLICY "Can read participants for my games"
ON public.game_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_participants.game_id
      AND (
        g.host_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.game_participants gp2
          WHERE gp2.game_id = g.id AND gp2.user_id = auth.uid()
        )
      )
  )
);

-- 5) Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';