-- ============================================================================
-- Sportradar Media Assets Table (headshots, logos, venues)
-- ============================================================================
CREATE TABLE public.sr_media_assets (
  id TEXT PRIMARY KEY,  -- Asset GUID from Sportradar
  kind TEXT NOT NULL CHECK (kind IN ('headshot', 'logo', 'venue')),
  sport TEXT NOT NULL DEFAULT 'golf',
  league TEXT NOT NULL,
  provider TEXT NOT NULL,  -- ap, getty, etc.
  title TEXT,
  description TEXT,
  copyright TEXT,
  refs JSONB DEFAULT '{}'::jsonb,  -- player_id, venue_id, org_id, etc.
  links JSONB DEFAULT '{}'::jsonb,  -- all sizes + original URLs
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  manifest_source_url TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_sr_media_assets_kind ON public.sr_media_assets(kind);
CREATE INDEX idx_sr_media_assets_sport_league ON public.sr_media_assets(sport, league);
CREATE INDEX idx_sr_media_assets_provider ON public.sr_media_assets(provider);
CREATE INDEX idx_sr_media_assets_refs ON public.sr_media_assets USING GIN(refs);

-- Enable RLS
ALTER TABLE public.sr_media_assets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read (admin will manage via service role)
CREATE POLICY "sr_media_assets_select_policy" 
ON public.sr_media_assets 
FOR SELECT 
USING (true);

-- ============================================================================
-- Sportradar Editorial Items Table (news, analysis)
-- ============================================================================
CREATE TABLE public.sr_editorial_items (
  id TEXT PRIMARY KEY,  -- Content ID from Sportradar
  sport TEXT NOT NULL DEFAULT 'golf',
  league TEXT NOT NULL,
  provider TEXT NOT NULL,  -- ap, ap_premium, etc.
  type TEXT NOT NULL,  -- news, analysis, preview, recap
  title TEXT,
  byline TEXT,
  dateline TEXT,
  content_long TEXT,
  content_long_html TEXT,
  created TIMESTAMPTZ,
  updated TIMESTAMPTZ,
  refs JSONB DEFAULT '{}'::jsonb,  -- player refs, tournament refs, etc.
  assets JSONB DEFAULT '{}'::jsonb,  -- only present if premium
  original_link TEXT,
  provider_content_id TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_sr_editorial_items_type ON public.sr_editorial_items(type);
CREATE INDEX idx_sr_editorial_items_sport_league ON public.sr_editorial_items(sport, league);
CREATE INDEX idx_sr_editorial_items_provider ON public.sr_editorial_items(provider);
CREATE INDEX idx_sr_editorial_items_created ON public.sr_editorial_items(created DESC);

-- Enable RLS
ALTER TABLE public.sr_editorial_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "sr_editorial_items_select_policy" 
ON public.sr_editorial_items 
FOR SELECT 
USING (true);

-- ============================================================================
-- Provider Availability Map (tracks which provider/league combos work)
-- ============================================================================
CREATE TABLE public.sr_media_provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport TEXT NOT NULL DEFAULT 'golf',
  league TEXT NOT NULL,
  provider TEXT NOT NULL,
  asset_type TEXT NOT NULL,  -- headshots, logos, venues
  status TEXT NOT NULL DEFAULT 'unknown',  -- available, unavailable, unknown
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  http_status INTEGER,
  error_message TEXT,
  manifest_url TEXT,
  UNIQUE(sport, league, provider, asset_type)
);

-- Enable RLS
ALTER TABLE public.sr_media_provider_availability ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "sr_media_provider_availability_select_policy" 
ON public.sr_media_provider_availability 
FOR SELECT 
USING (true);

-- ============================================================================
-- Add updated_at trigger for both tables
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sr_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sr_media_assets_updated_at
  BEFORE UPDATE ON public.sr_media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.sr_update_updated_at_column();

CREATE TRIGGER sr_editorial_items_updated_at
  BEFORE UPDATE ON public.sr_editorial_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sr_update_updated_at_column();