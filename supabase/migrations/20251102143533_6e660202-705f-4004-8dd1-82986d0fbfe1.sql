-- Join Requests: Table, Indexes, RLS, and Helper Function

-- 1) Create join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('pending','approved','rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Uniqueness: one active pending per requester/game
CREATE UNIQUE INDEX IF NOT EXISTS join_requests_unique_pending
  ON public.join_requests (game_id, requester_id)
  WHERE state = 'pending';

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS join_requests_game_id_idx ON public.join_requests (game_id);
CREATE INDEX IF NOT EXISTS join_requests_requester_id_idx ON public.join_requests (requester_id);

-- 4) Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies
-- Requester can INSERT their own pending request
CREATE POLICY jr_insert_self ON public.join_requests
FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());

-- Requester can SELECT their own requests
CREATE POLICY jr_read_self ON public.join_requests
FOR SELECT TO authenticated
USING (requester_id = auth.uid());

-- Host can SELECT requests for their games
CREATE POLICY jr_read_host ON public.join_requests
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.id = join_requests.game_id
    AND g.host_user_id = auth.uid()
));

-- Host can UPDATE state for their games (approve/reject)
CREATE POLICY jr_update_host ON public.join_requests
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.games g
  WHERE g.id = join_requests.game_id
    AND g.host_user_id = auth.uid()
))
WITH CHECK (true);

-- 6) Helper RPC for safe slot decrement
CREATE OR REPLACE FUNCTION public.decrement_slots_if_available(p_game_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.games
  SET slots_open = CASE WHEN slots_open > 0 THEN slots_open - 1 ELSE 0 END,
      updated_at = now()
  WHERE id = p_game_id;
END;
$$;