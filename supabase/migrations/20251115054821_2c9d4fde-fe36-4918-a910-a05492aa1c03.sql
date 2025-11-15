-- Phase 1: Core Join Request System

-- Update game_join_requests table (if exists, otherwise create)
-- This table stores join requests from users to games
CREATE TABLE IF NOT EXISTS public.game_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_join_requests ENABLE ROW LEVEL SECURITY;

-- Create unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request 
ON public.game_join_requests(game_id, requester_user_id) 
WHERE status = 'pending';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_join_requests_game_id ON public.game_join_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_game_join_requests_requester ON public.game_join_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_game_join_requests_status ON public.game_join_requests(status);

-- RLS Policies for game_join_requests
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON public.game_join_requests
  FOR SELECT
  USING (auth.uid() = requester_user_id);

-- Hosts can view requests for their games
CREATE POLICY "Hosts can view game requests" ON public.game_join_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_join_requests.game_id
      AND games.host_user_id = auth.uid()
    )
  );

-- Users can create requests for games they don't host
CREATE POLICY "Users can create join requests" ON public.game_join_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = requester_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_id
      AND games.host_user_id = auth.uid()
    )
  );

-- Only hosts can update request status
CREATE POLICY "Hosts can update request status" ON public.game_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.games
      WHERE games.id = game_join_requests.game_id
      AND games.host_user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_game_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_game_join_requests_updated_at ON public.game_join_requests;
CREATE TRIGGER update_game_join_requests_updated_at
  BEFORE UPDATE ON public.game_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_game_join_requests_updated_at();