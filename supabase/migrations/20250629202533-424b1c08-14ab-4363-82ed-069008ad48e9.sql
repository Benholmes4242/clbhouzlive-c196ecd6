
-- Create table to store review media
CREATE TABLE public.course_review_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.course_ratings(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on course_review_media table
ALTER TABLE public.course_review_media ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view all review media for public display
CREATE POLICY "Users can view all course review media" 
  ON public.course_review_media 
  FOR SELECT 
  USING (true);

-- Policy for users to insert media for their own reviews
CREATE POLICY "Users can create media for their own reviews" 
  ON public.course_review_media 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_ratings 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Policy for users to delete media from their own reviews
CREATE POLICY "Users can delete media from their own reviews" 
  ON public.course_review_media 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.course_ratings 
      WHERE id = review_id AND user_id = auth.uid()
    )
  );

-- Create storage bucket for course review media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-review-media', 
  'course-review-media', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'video/mp4', 'video/quicktime', 'video/mov']
);

-- Storage policies for course review media
CREATE POLICY "Anyone can view course review media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-review-media');

CREATE POLICY "Authenticated users can upload course review media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-review-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own course review media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own course review media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-review-media' AND auth.uid()::text = (storage.foldername(name))[1]);
