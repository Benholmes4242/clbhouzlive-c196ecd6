-- Create a bucket for player headshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-headshots', 'player-headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Player headshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-headshots');

-- Allow authenticated users to upload (for admin purposes)
CREATE POLICY "Authenticated users can upload player headshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'player-headshots' AND auth.role() = 'authenticated');

-- Update Gordon Sargent's photo_url
UPDATE sr_players
SET photo_url = 'https://ybxkehyomcakqjvuhnna.supabase.co/storage/v1/object/public/player-headshots/gordon-sargent.webp',
    updated_at = now()
WHERE id = 'd62542a1-3e5f-4bda-be72-cfecd738c183';