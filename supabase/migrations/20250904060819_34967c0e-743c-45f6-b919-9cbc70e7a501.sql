-- Create coaches table
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

-- Create coach service areas table
CREATE TABLE IF NOT EXISTS public.coach_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_km INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for coach service areas
ALTER TABLE public.coach_service_areas ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own service areas
CREATE POLICY "Coaches can manage their own service areas" ON public.coach_service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.coaches 
      WHERE coaches.id = coach_service_areas.coach_id 
      AND coaches.user_id = auth.uid()
    )
  );

-- Public can view all service areas
CREATE POLICY "Public can view service areas" ON public.coach_service_areas
  FOR SELECT USING (true);

-- Create swing coach outreach table
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

-- Coaches can view outreach targeting them
CREATE POLICY "Coaches can view targeting outreach" ON public.swing_coach_outreach
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.swing_coach_outreach_targets sot
      JOIN public.coaches c ON c.id = sot.coach_id
      WHERE sot.outreach_id = swing_coach_outreach.id
      AND c.user_id = auth.uid()
    )
  );

-- Create outreach targets table
CREATE TABLE IF NOT EXISTS public.swing_coach_outreach_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_id UUID NOT NULL REFERENCES public.swing_coach_outreach(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(outreach_id, coach_id)
);

-- Enable RLS for outreach targets
ALTER TABLE public.swing_coach_outreach_targets ENABLE ROW LEVEL SECURITY;

-- Users can view targets for their own outreach
CREATE POLICY "Users can view their own outreach targets" ON public.swing_coach_outreach_targets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.swing_coach_outreach sco
      WHERE sco.id = swing_coach_outreach_targets.outreach_id
      AND sco.user_id = auth.uid()
    )
  );

-- Coaches can manage targets for their own profile
CREATE POLICY "Coaches can manage their own targets" ON public.swing_coach_outreach_targets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      WHERE c.id = swing_coach_outreach_targets.coach_id
      AND c.user_id = auth.uid()
    )
  );

-- System can create outreach targets
CREATE POLICY "System can create outreach targets" ON public.swing_coach_outreach_targets
  FOR INSERT WITH CHECK (true);

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_coaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coaches_updated_at();

CREATE OR REPLACE FUNCTION public.update_swing_coach_outreach_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_swing_coach_outreach_updated_at
  BEFORE UPDATE ON public.swing_coach_outreach
  FOR EACH ROW
  EXECUTE FUNCTION public.update_swing_coach_outreach_updated_at();