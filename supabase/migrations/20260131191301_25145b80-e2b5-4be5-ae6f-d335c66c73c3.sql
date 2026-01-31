-- Create storage bucket for cached player headshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-headshots',
  'player-headshots',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to cached headshots
CREATE POLICY "Public can view player headshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-headshots');

-- Allow service role to upload (edge functions use service role)
CREATE POLICY "Service role can upload player headshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-headshots');

CREATE POLICY "Service role can update player headshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'player-headshots');

CREATE POLICY "Service role can delete player headshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'player-headshots');