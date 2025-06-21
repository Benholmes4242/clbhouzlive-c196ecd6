
-- Enable RLS on course_ratings table if not already enabled
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own ratings
CREATE POLICY "Users can view their own course ratings" 
  ON public.course_ratings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own ratings
CREATE POLICY "Users can create their own course ratings" 
  ON public.course_ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own ratings
CREATE POLICY "Users can update their own course ratings" 
  ON public.course_ratings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own ratings
CREATE POLICY "Users can delete their own course ratings" 
  ON public.course_ratings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow users to view all course ratings for display purposes (like seeing others' reviews)
CREATE POLICY "Users can view all course ratings for public display" 
  ON public.course_ratings 
  FOR SELECT 
  USING (true);
