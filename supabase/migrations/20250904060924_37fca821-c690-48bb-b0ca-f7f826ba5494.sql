-- Create coaches table first
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academy TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  specialties TEXT[],
  price_min INTEGER,
  price_max INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for coaches
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own profiles
CREATE POLICY "Coaches can manage their own profiles" ON public.coaches
  FOR ALL USING (auth.uid() = user_id);

-- Public can view active coaches
CREATE POLICY "Public can view active coaches" ON public.coaches
  FOR SELECT USING (active = true);

-- Create swing coach outreach table (before creating foreign key references to it)
CREATE TABLE IF NOT EXISTS public.swing_coach_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swing_analysis_id UUID NOT NULL,
  city TEXT,
  region TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 25,
  focus TEXT,
  price_min INTEGER,
  price_max INTEGER,
  share_video BOOLEAN DEFAULT false,
  share_analysis_text BOOLEAN DEFAULT false,
  consented_at TIMESTAMPTZ,
  terms_version TEXT DEFAULT '1.0',
  first_name_only BOOLEAN DEFAULT false,
  mask_precise_location BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for swing coach outreach
ALTER TABLE public.swing_coach_outreach ENABLE ROW LEVEL SECURITY;

-- Users can manage their own outreach requests
CREATE POLICY "Users can manage their own outreach" ON public.swing_coach_outreach
  FOR ALL USING (auth.uid() = user_id);