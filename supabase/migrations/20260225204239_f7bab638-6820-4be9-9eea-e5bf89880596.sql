
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comment-images', 'comment-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

CREATE POLICY "Users can upload comment images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comment-images');

CREATE POLICY "Anyone can view comment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-images');

CREATE POLICY "Users can delete own comment images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'comment-images' AND (storage.foldername(name))[1] = auth.uid()::text);
