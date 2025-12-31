-- Add post-level studio edits columns to posts table
-- These are post-wide settings (apply to entire post, not per-media)

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS studio_music jsonb,
  ADD COLUMN IF NOT EXISTS audio_mode text,
  ADD COLUMN IF NOT EXISTS achievement_badge_id uuid;

-- Add comment for documentation
COMMENT ON COLUMN posts.studio_music IS 'Post-level music track (applies to entire post)';
COMMENT ON COLUMN posts.audio_mode IS 'Audio mode: original | music_only';
COMMENT ON COLUMN posts.achievement_badge_id IS 'Achievement badge displayed on post';