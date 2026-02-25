
-- 1. Unique constraints to prevent duplicate likes/reactions
ALTER TABLE comment_likes 
  ADD CONSTRAINT unique_comment_like UNIQUE (comment_id, user_id);

ALTER TABLE comment_reactions 
  ADD CONSTRAINT unique_comment_reaction UNIQUE (comment_id, user_id, reaction_type);

-- 2. Validate reaction types
ALTER TABLE comment_reactions 
  ADD CONSTRAINT valid_reaction_type 
  CHECK (reaction_type IN ('heart', 'fire', 'golf', 'eagle', 'birdie', 'clap'));

-- 3. Soft delete support
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 4. Edited indicator
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient ON comment_notifications(recipient_user_id);
