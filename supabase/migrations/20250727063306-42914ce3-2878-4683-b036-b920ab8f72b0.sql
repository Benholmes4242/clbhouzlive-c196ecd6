-- Create storage policies for profile-backgrounds bucket

-- Allow users to upload their own cover photos
CREATE POLICY "Users can upload their own cover photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view cover photos (make them publicly accessible)
CREATE POLICY "Cover photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-backgrounds');

-- Allow users to update their own cover photos
CREATE POLICY "Users can update their own cover photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own cover photos
CREATE POLICY "Users can delete their own cover photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-backgrounds' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);