-- Create profile-backgrounds storage bucket if it doesn't exist
DO $$
BEGIN
    -- Check if bucket exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-backgrounds') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('profile-backgrounds', 'profile-backgrounds', true);
    END IF;
END $$;

-- Create RLS policies for profile-backgrounds bucket
CREATE POLICY "Users can view all profile background images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-backgrounds');

CREATE POLICY "Users can upload their own profile backgrounds" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile backgrounds" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile backgrounds" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);