-- ============================================
-- TOUR HUB ENRICHMENT TABLES
-- Player headshots, event storytelling, winners
-- ============================================

-- 1. PLAYER MEDIA TABLE (headshots)
-- Decoupled from sr_players for clean media management
CREATE TABLE public.player_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.sr_players(id) ON DELETE CASCADE,
  headshot_url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- sportradar, pga, manual, licensed
  confidence NUMERIC(3,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id)
);

-- Indexes for player_media
CREATE INDEX idx_player_media_player_id ON public.player_media(player_id);

-- RLS: Public read, service-role write only
ALTER TABLE public.player_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for player_media"
  ON public.player_media FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies = service-role only writes

-- 2. EVENT MOMENTS TABLE (storytelling)
CREATE TABLE public.event_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.sr_players(id) ON DELETE SET NULL,
  moment_type TEXT NOT NULL CHECK (moment_type IN ('winner', 'playoff', 'record', 'ace', 'milestone', 'comeback', 'streak')),
  headline TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for event_moments
CREATE INDEX idx_event_moments_tournament_id ON public.event_moments(tournament_id);
CREATE INDEX idx_event_moments_player_id ON public.event_moments(player_id);
CREATE INDEX idx_event_moments_moment_type ON public.event_moments(moment_type);

-- RLS: Public read, service-role write only
ALTER TABLE public.event_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for event_moments"
  ON public.event_moments FOR SELECT
  USING (true);

-- 3. EVENT WINNERS TABLE (fast lookup, 1 row per event)
CREATE TABLE public.event_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.sr_tournaments(id) ON DELETE CASCADE UNIQUE,
  player_id UUID NOT NULL REFERENCES public.sr_players(id) ON DELETE CASCADE,
  winning_score INT,
  score_to_par INT,
  margin INT, -- strokes ahead of 2nd place
  final_round_score INT,
  is_playoff BOOLEAN DEFAULT false,
  headline TEXT, -- "7th PGA Tour win"
  narrative TEXT, -- One-line story summary
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for event_winners
CREATE INDEX idx_event_winners_tournament_id ON public.event_winners(tournament_id);
CREATE INDEX idx_event_winners_player_id ON public.event_winners(player_id);

-- RLS: Public read, service-role write only
ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for event_winners"
  ON public.event_winners FOR SELECT
  USING (true);

-- Trigger for updated_at on player_media and event_winners
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_player_media_updated_at
  BEFORE UPDATE ON public.player_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_event_winners_updated_at
  BEFORE UPDATE ON public.event_winners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.player_media IS 'Player headshot images with source tracking';
COMMENT ON TABLE public.event_moments IS 'Storytelling moments for tournament narratives';
COMMENT ON TABLE public.event_winners IS 'Quick lookup table for tournament winners (1 row per event)';