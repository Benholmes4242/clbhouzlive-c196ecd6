
-- Create a user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_photo_url TEXT,
  eg_app_connected BOOLEAN DEFAULT FALSE,
  eg_handicap_index FLOAT,
  eg_recent_rounds JSONB,
  home_club TEXT, -- To store the name of the home golf club
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Course tracker table: tracks which Top 100 courses a user has played
CREATE TABLE public.user_course_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  checked BOOLEAN DEFAULT FALSE,
  played_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_tracker ENABLE ROW LEVEL SECURITY;

-- User can view/update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert/update/select their tracker data
CREATE POLICY "Users can view their own course tracker"
  ON public.user_course_tracker
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add course tracker entries"
  ON public.user_course_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracker"
  ON public.user_course_tracker
  FOR UPDATE USING (auth.uid() = user_id);
