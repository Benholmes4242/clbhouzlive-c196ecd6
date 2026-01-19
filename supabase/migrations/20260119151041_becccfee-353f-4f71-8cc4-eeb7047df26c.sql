-- Add hls_url column to store pre-computed HLS URLs
ALTER TABLE post_media ADD COLUMN IF NOT EXISTS hls_url TEXT;

-- Backfill existing videos with HLS URLs
UPDATE post_media 
SET hls_url = 'https://customer-4ah4gni80ytefpck.cloudflarestream.com/' || stream_id || '/manifest/video.m3u8'
WHERE stream_id IS NOT NULL 
  AND media_type = 'video'
  AND hls_url IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_media_hls_url ON post_media(hls_url) WHERE hls_url IS NOT NULL;