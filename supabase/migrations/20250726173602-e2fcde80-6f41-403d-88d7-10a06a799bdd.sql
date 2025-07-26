-- Create storage bucket for profile backgrounds
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-backgrounds', 'profile-backgrounds', true);

-- Create policies for profile background uploads
CREATE POLICY "Users can view all profile backgrounds" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-backgrounds');

CREATE POLICY "Users can upload their own profile backgrounds" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile backgrounds" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile backgrounds" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add background_image_url column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS background_image_url TEXT;