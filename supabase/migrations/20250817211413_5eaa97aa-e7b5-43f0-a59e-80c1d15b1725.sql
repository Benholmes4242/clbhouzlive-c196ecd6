-- Create storage bucket for profile media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-media', 'profile-media', true);

-- Create policies for profile media uploads
CREATE POLICY "Users can view profile media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-media');

CREATE POLICY "Users can upload their own profile media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);