-- Phase 1: Open to Play Foundation Schema

-- Create enum types for pings
CREATE TYPE ping_format AS ENUM ('NINE', 'EIGHTEEN', 'RANGE', 'CASUAL');
CREATE TYPE ping_visibility AS ENUM ('FRIENDS', 'NEARBY', 'ALL');
CREATE TYPE ping_status AS ENUM ('ACTIVE', 'MATCHING', 'CLOSED');
CREATE TYPE ping_response_state AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- Main pings table
CREATE TABLE public.pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.golf_courses(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  players_needed SMALLINT NOT NULL DEFAULT 1 CHECK (players_needed BETWEEN 1 AND 3),
  format ping_format NOT NULL,
  visibility ping_visibility NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status ping_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ping responses table
CREATE TABLE public.ping_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_id UUID NOT NULL REFERENCES public.pings(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  state ping_response_state NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ping_id, responder_id)
);

-- Ping matches table (for accepted handshakes)
CREATE TABLE public.ping_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_id UUID NOT NULL REFERENCES public.pings(id) ON DELETE CASCADE,
  participant_ids UUID[] NOT NULL,
  dm_thread_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_pings_creator ON public.pings(creator_id);
CREATE INDEX idx_pings_club ON public.pings(club_id);
CREATE INDEX idx_pings_status_expires ON public.pings(status, expires_at);
CREATE INDEX idx_pings_location ON public.pings(lat, lng);
CREATE INDEX idx_ping_responses_ping ON public.ping_responses(ping_id);
CREATE INDEX idx_ping_responses_responder ON public.ping_responses(responder_id);

-- Trigger to update updated_at
CREATE TRIGGER update_pings_updated_at
  BEFORE UPDATE ON public.pings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ping_responses_updated_at
  BEFORE UPDATE ON public.ping_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to expire old pings
CREATE OR REPLACE FUNCTION public.expire_pings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Close expired pings
  UPDATE public.pings 
  SET status = 'CLOSED', updated_at = now()
  WHERE status = 'ACTIVE' AND expires_at < now();
  
  -- Expire pending responses for closed pings
  UPDATE public.ping_responses 
  SET state = 'EXPIRED', updated_at = now()
  WHERE state = 'PENDING' 
    AND ping_id IN (SELECT id FROM public.pings WHERE status = 'CLOSED');
END;
$$;

-- RLS Policies for pings table
ALTER TABLE public.pings ENABLE ROW LEVEL SECURITY;

-- Creators can view/manage their own pings
CREATE POLICY "Creators can view their own pings"
  ON public.pings FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create pings"
  ON public.pings FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own pings"
  ON public.pings FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own pings"
  ON public.pings FOR DELETE
  USING (auth.uid() = creator_id);

-- Users can view active pings based on visibility
CREATE POLICY "Users can view active pings"
  ON public.pings FOR SELECT
  USING (
    status = 'ACTIVE' 
    AND expires_at > now()
    AND (
      visibility = 'ALL'
      OR visibility = 'NEARBY'
      OR (
        visibility = 'FRIENDS' 
        AND EXISTS (
          SELECT 1 FROM public.user_follows
          WHERE follower_id = auth.uid() AND following_id = creator_id
        )
      )
    )
  );

-- RLS Policies for ping_responses table
ALTER TABLE public.ping_responses ENABLE ROW LEVEL SECURITY;

-- Creators can view responses to their pings
CREATE POLICY "Creators can view responses to their pings"
  ON public.ping_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pings 
      WHERE id = ping_id AND creator_id = auth.uid()
    )
  );

-- Responders can view their own responses
CREATE POLICY "Responders can view their own responses"
  ON public.ping_responses FOR SELECT
  USING (auth.uid() = responder_id);

-- Users can create responses
CREATE POLICY "Users can create responses"
  ON public.ping_responses FOR INSERT
  WITH CHECK (auth.uid() = responder_id);

-- Creators can update response state (accept/decline)
CREATE POLICY "Creators can update response state"
  ON public.ping_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pings 
      WHERE id = ping_id AND creator_id = auth.uid()
    )
  );

-- RLS Policies for ping_matches table
ALTER TABLE public.ping_matches ENABLE ROW LEVEL SECURITY;

-- Participants can view their matches
CREATE POLICY "Participants can view their matches"
  ON public.ping_matches FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

-- System can create matches (done via edge function)
CREATE POLICY "System can create matches"
  ON public.ping_matches FOR INSERT
  WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.pings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ping_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ping_matches;