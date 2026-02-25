-- Update check constraint to only allow 'image'
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS valid_media_type;
ALTER TABLE post_comments ADD CONSTRAINT valid_media_type 
  CHECK (media_type IS NULL OR media_type IN ('image'));

-- Drop voice note storage policies
DROP POLICY IF EXISTS "Anyone can read voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own voice notes" ON storage.objects;