-- Add constraint to ensure only videos are allowed for immersive media
ALTER TABLE profile_media 
ADD CONSTRAINT immersive_only_videos 
CHECK (
  (is_immersive = true AND media_type = 'video') OR 
  (is_immersive = false OR is_immersive IS NULL)
);