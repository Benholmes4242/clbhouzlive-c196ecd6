
-- Create storage bucket for course images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images', 
  'course-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Storage policies for course images
CREATE POLICY "Anyone can upload course images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Anyone can view course images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can update course images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete course images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');
