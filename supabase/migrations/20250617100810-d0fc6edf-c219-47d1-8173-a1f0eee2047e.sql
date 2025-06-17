
-- Create table to track which Top 100 courses users have played
CREATE TABLE public.user_top100_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES public.golf_courses(id) ON DELETE CASCADE NOT NULL,
  played BOOLEAN DEFAULT TRUE,
  played_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on the table
ALTER TABLE public.user_top100_courses ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own played courses" 
  ON public.user_top100_courses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own played courses" 
  ON public.user_top100_courses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own played courses" 
  ON public.user_top100_courses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own played courses" 
  ON public.user_top100_courses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow users to view other users' played courses if their profiles are public
CREATE POLICY "Users can view public profiles' played courses" 
  ON public.user_top100_courses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_id AND is_public = true
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_user_top100_courses_user_id ON public.user_top100_courses(user_id);
CREATE INDEX idx_user_top100_courses_course_id ON public.user_top100_courses(course_id);
CREATE INDEX idx_user_top100_courses_played ON public.user_top100_courses(played) WHERE played = true;
