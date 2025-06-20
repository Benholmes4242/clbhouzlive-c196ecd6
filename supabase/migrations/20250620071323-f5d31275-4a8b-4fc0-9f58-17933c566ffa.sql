
-- Create a table for course ratings
CREATE TABLE public.course_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES public.golf_courses(id) ON DELETE CASCADE NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 10 AND (rating * 2) = FLOOR(rating * 2)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on course ratings
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for course ratings
CREATE POLICY "Anyone can view course ratings" 
  ON public.course_ratings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can rate courses they've played" 
  ON public.course_ratings 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_courses 
      WHERE user_id = auth.uid() 
      AND course_id = course_ratings.course_id 
      AND played = true
    )
  );

CREATE POLICY "Users can update their own ratings" 
  ON public.course_ratings 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.user_courses 
      WHERE user_id = auth.uid() 
      AND course_id = course_ratings.course_id 
      AND played = true
    )
  );

CREATE POLICY "Users can delete their own ratings" 
  ON public.course_ratings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_course_ratings_course_id ON public.course_ratings(course_id);
CREATE INDEX idx_course_ratings_user_id ON public.course_ratings(user_id);

-- Create a view for aggregated course ratings
CREATE OR REPLACE VIEW public.course_rating_stats AS
SELECT 
  course_id,
  ROUND(AVG(rating), 1) as average_rating,
  COUNT(*) as total_ratings
FROM public.course_ratings
GROUP BY course_id;
