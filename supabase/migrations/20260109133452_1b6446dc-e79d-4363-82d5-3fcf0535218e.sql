-- Course mapping cache table for SR venue -> golf_courses resolution
CREATE TABLE public.sr_course_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_venue_name text NOT NULL,
  sr_venue_course_name text,
  sr_city text,
  sr_country text,
  golf_course_id uuid REFERENCES public.golf_courses(id),
  confidence numeric(3,2) DEFAULT 1.0,
  source text NOT NULL DEFAULT 'exact' CHECK (source IN ('exact', 'fuzzy', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sr_venue_name, sr_city, sr_country)
);

-- Index for fast lookups
CREATE INDEX idx_sr_course_map_lookup ON public.sr_course_map(sr_venue_name, sr_city, sr_country);

-- Enable RLS
ALTER TABLE public.sr_course_map ENABLE ROW LEVEL SECURITY;

-- Public read policy (this is reference data)
CREATE POLICY "Anyone can read course mappings" ON public.sr_course_map
  FOR SELECT USING (true);

-- Player images cache table for enriched headshots
CREATE TABLE public.sr_player_images (
  sr_player_id uuid PRIMARY KEY REFERENCES public.sr_players(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('wiki', 'pga', 'manual', 'generated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sr_player_images ENABLE ROW LEVEL SECURITY;

-- Public read policy (this is reference data)
CREATE POLICY "Anyone can read player images" ON public.sr_player_images
  FOR SELECT USING (true);

-- Update timestamp trigger for sr_course_map
CREATE TRIGGER update_sr_course_map_updated_at
  BEFORE UPDATE ON public.sr_course_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for sr_player_images  
CREATE TRIGGER update_sr_player_images_updated_at
  BEFORE UPDATE ON public.sr_player_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();