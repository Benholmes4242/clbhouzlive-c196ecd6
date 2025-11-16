-- Add achievement_id column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS achievement_id uuid REFERENCES achievements(id) ON DELETE SET NULL;

-- Create index for faster achievement post queries
CREATE INDEX IF NOT EXISTS idx_posts_achievement_id ON posts(achievement_id) WHERE achievement_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN posts.achievement_id IS 'Optional reference to an achievement being shared in this post';