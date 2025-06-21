
-- Create course_media table to store uploaded photos and videos for course ratings
CREATE TABLE public.course_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.golf_courses(id) ON DELETE CASCADE,
  rating_id UUID NOT NULL REFERENCES public.course_ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.course_media ENABLE ROW LEVEL SECURITY;

-- Create policies for course media
CREATE POLICY "Users can view course media" 
  ON public.course_media 
  FOR SELECT 
  USING (true); -- Public viewing of course media

CREATE POLICY "Users can upload media for their own ratings" 
  ON public.course_media 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course media" 
  ON public.course_media 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course media" 
  ON public.course_media 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for course media
INSERT INTO storage.buckets (id, name, public) VALUES ('course-media', 'course-media', true);

-- Storage policies for course media
CREATE POLICY "Anyone can upload course media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-media');

CREATE POLICY "Anyone can view course media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-media');

CREATE POLICY "Users can update their own course media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own course media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-media' AND auth.uid()::text = (storage.foldername(name))[1]);
