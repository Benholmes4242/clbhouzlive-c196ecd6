-- Create coach profiles table
CREATE TABLE public.coach_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  region_code TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  pricing_note TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);

-- Create coach regions table
CREATE TABLE public.coach_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'UK',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create swing shares table
CREATE TABLE public.swing_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  user_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  consent_flags JSONB NOT NULL DEFAULT '{}',
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coach feedback table
CREATE TABLE public.coach_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  author TEXT NOT NULL DEFAULT 'coach',
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swing_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_profiles
CREATE POLICY "Public can view active coaches"
ON public.coach_profiles
FOR SELECT
USING (status = 'active');

CREATE POLICY "Coaches can update their own profile"
ON public.coach_profiles
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()));

-- RLS Policies for coach_regions
CREATE POLICY "Public can view regions"
ON public.coach_regions
FOR SELECT
USING (true);

-- RLS Policies for swing_shares
CREATE POLICY "Users can view their own shares"
ON public.swing_shares
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shares"
ON public.swing_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares"
ON public.swing_shares
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view shares sent to them"
ON public.swing_shares
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.coach_profiles 
  WHERE coach_profiles.id = swing_shares.coach_id 
  AND coach_profiles.email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
));

-- RLS Policies for coach_feedback
CREATE POLICY "Users can view feedback for their shares"
ON public.coach_feedback
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.swing_shares 
  WHERE swing_shares.id = coach_feedback.share_id 
  AND swing_shares.user_id = auth.uid()
));

CREATE POLICY "Coaches can create feedback for their shares"
ON public.coach_feedback
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.swing_shares ss
  JOIN public.coach_profiles cp ON cp.id = ss.coach_id
  WHERE ss.id = coach_feedback.share_id 
  AND cp.email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
));

CREATE POLICY "Coaches can view feedback for their shares"
ON public.coach_feedback
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.swing_shares ss
  JOIN public.coach_profiles cp ON cp.id = ss.coach_id
  WHERE ss.id = coach_feedback.share_id 
  AND cp.email = (SELECT email FROM auth.users WHERE auth.users.id = auth.uid())
));

-- Create indexes
CREATE INDEX idx_coach_profiles_region ON public.coach_profiles(region_code);
CREATE INDEX idx_coach_profiles_status ON public.coach_profiles(status);
CREATE INDEX idx_swing_shares_analysis ON public.swing_shares(analysis_id);
CREATE INDEX idx_swing_shares_user ON public.swing_shares(user_id);
CREATE INDEX idx_swing_shares_coach ON public.swing_shares(coach_id);
CREATE INDEX idx_swing_shares_status ON public.swing_shares(status);
CREATE INDEX idx_coach_feedback_share ON public.coach_feedback(share_id);

-- Add foreign key constraints
ALTER TABLE public.swing_shares
ADD CONSTRAINT fk_swing_shares_analysis
FOREIGN KEY (analysis_id) REFERENCES public.pro_ai_analyses(id) ON DELETE CASCADE;

ALTER TABLE public.swing_shares
ADD CONSTRAINT fk_swing_shares_coach
FOREIGN KEY (coach_id) REFERENCES public.coach_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.coach_feedback
ADD CONSTRAINT fk_coach_feedback_share
FOREIGN KEY (share_id) REFERENCES public.swing_shares(id) ON DELETE CASCADE;

ALTER TABLE public.coach_feedback
ADD CONSTRAINT fk_coach_feedback_coach
FOREIGN KEY (coach_id) REFERENCES public.coach_profiles(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swing_shares_updated_at
  BEFORE UPDATE ON public.swing_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample coach data
INSERT INTO public.coach_regions (region_code, name, country, lat, lng) VALUES
('SE1', 'South East London', 'UK', 51.5074, -0.1278),
('SW1', 'South West London', 'UK', 51.4994, -0.1357),
('N1', 'North London', 'UK', 51.5388, -0.1426),
('E1', 'East London', 'UK', 51.5156, -0.0722),
('W1', 'West London', 'UK', 51.5142, -0.1506);

INSERT INTO public.coach_profiles (name, email, phone, region_code, specialties, pricing_note, bio, lat, lng) VALUES
('James Mitchell', 'james.mitchell@golfcoach.uk', '+44 7700 900123', 'SE1', 
 '{"Driver", "Iron Play", "Short Game"}', '£80-120/hour', 
 'PGA Professional with 15 years experience. Specializes in fixing slices and improving consistency.', 
 51.5074, -0.1278),
('Sarah Thompson', 'sarah.thompson@golfacademy.co.uk', '+44 7700 900124', 'SW1',
 '{"Putting", "Short Game", "Course Management"}', '£90-150/hour',
 'Former tour player turned coach. Expert in mental game and short game techniques.',
 51.4994, -0.1357),
('David Wilson', 'david.wilson@proswinggolf.com', '+44 7700 900125', 'N1',
 '{"Swing Mechanics", "Driver", "Iron Play"}', '£75-100/hour',
 'TPI Certified coach specializing in biomechanics and swing efficiency.',
 51.5388, -0.1426),
('Emma Roberts', 'emma.roberts@golflessons.uk', '+44 7700 900126', 'E1',
 '{"Beginners", "Junior Golf", "Iron Play"}', '£60-90/hour',
 'Patient and encouraging coach perfect for beginners and junior golfers.',
 51.5156, -0.0722),
('Michael Brown', 'michael.brown@elitegolf.co.uk', '+44 7700 900127', 'W1',
 '{"Advanced Techniques", "Tournament Prep", "Driver"}', '£120-200/hour',
 'High-performance coach working with scratch golfers and professionals.',
 51.5142, -0.1506);