-- Create tables for Sportradar tournament data

-- Tournament seasons
CREATE TABLE public.sr_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sr_id TEXT NOT NULL UNIQUE, -- Sportradar season ID
  tour_id TEXT NOT NULL,
  tour_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tournaments/Events
CREATE TABLE public.sr_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sr_id TEXT NOT NULL UNIQUE, -- Sportradar tournament ID
  season_id UUID REFERENCES public.sr_seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT, -- scheduled, inprogress, closed, cancelled
  start_date DATE,
  end_date DATE,
  purse NUMERIC,
  currency TEXT,
  points_type TEXT,
  venue_name TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_country TEXT,
  venue_course_name TEXT,
  venue_par INTEGER,
  venue_yardage INTEGER,
  defending_champion TEXT,
  raw_data JSONB, -- Store full API response for reference
  is_featured BOOLEAN DEFAULT false, -- Admin can mark tournaments to show on tourhub
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sync log to track API fetches
CREATE TABLE public.sr_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- schedule, leaderboard, etc
  tour_id TEXT,
  season_id TEXT,
  tournament_id TEXT,
  status TEXT NOT NULL, -- success, error
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.sr_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_sync_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all data
CREATE POLICY "Admins can read sr_seasons"
ON public.sr_seasons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can insert sr_seasons"
ON public.sr_seasons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can update sr_seasons"
ON public.sr_seasons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can read sr_tournaments"
ON public.sr_tournaments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can insert sr_tournaments"
ON public.sr_tournaments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can update sr_tournaments"
ON public.sr_tournaments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can read sr_sync_log"
ON public.sr_sync_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Admins can insert sr_sync_log"
ON public.sr_sync_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Public read policy for featured tournaments (for tourhub)
CREATE POLICY "Public can read featured tournaments"
ON public.sr_tournaments FOR SELECT
USING (is_featured = true);

-- Create indexes for better query performance
CREATE INDEX idx_sr_tournaments_season_id ON public.sr_tournaments(season_id);
CREATE INDEX idx_sr_tournaments_start_date ON public.sr_tournaments(start_date);
CREATE INDEX idx_sr_tournaments_status ON public.sr_tournaments(status);
CREATE INDEX idx_sr_tournaments_is_featured ON public.sr_tournaments(is_featured);
CREATE INDEX idx_sr_sync_log_sync_type ON public.sr_sync_log(sync_type);
CREATE INDEX idx_sr_sync_log_started_at ON public.sr_sync_log(started_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_sr_seasons_updated_at
  BEFORE UPDATE ON public.sr_seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sr_tournaments_updated_at
  BEFORE UPDATE ON public.sr_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();