-- Migration 1: Social Links Columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS instagram_handle text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS twitter_handle    text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS tiktok_handle     text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS youtube_handle    text DEFAULT '' NOT NULL;

-- Backfill from existing social_links JSONB where data exists
UPDATE user_profiles
SET
  instagram_handle = COALESCE(social_links->>'instagram', ''),
  twitter_handle   = COALESCE(social_links->>'twitter', ''),
  tiktok_handle    = COALESCE(social_links->>'tiktok', ''),
  youtube_handle   = COALESCE(social_links->>'youtube', '')
WHERE social_links IS NOT NULL;

COMMENT ON COLUMN user_profiles.instagram_handle IS 'Instagram username without @ prefix';
COMMENT ON COLUMN user_profiles.twitter_handle   IS 'Twitter/X username without @ prefix';
COMMENT ON COLUMN user_profiles.tiktok_handle    IS 'TikTok username without @ prefix';
COMMENT ON COLUMN user_profiles.youtube_handle   IS 'YouTube channel handle without @ prefix';