-- Add caddie_pick_comment_id to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS caddie_pick_comment_id uuid REFERENCES post_comments(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_caddie_pick ON posts(caddie_pick_comment_id) WHERE caddie_pick_comment_id IS NOT NULL;