-- Create user relationships table for follow/friend system
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'following',
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_relationships_follower
  ON user_relationships(follower_id);

CREATE INDEX IF NOT EXISTS idx_user_relationships_following
  ON user_relationships(following_id);

ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

-- RLS: users can see public follow graph
DROP POLICY IF EXISTS "Anyone can view relationships" ON user_relationships;
CREATE POLICY "Anyone can view relationships"
  ON user_relationships
  FOR SELECT
  USING (true);

-- Only the current user can manage who they follow
DROP POLICY IF EXISTS "Users manage their own follows" ON user_relationships;
CREATE POLICY "Users manage their own follows"
  ON user_relationships
  FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Add performance indexes for course ratings lookups
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_course
  ON course_ratings(user_id, course_id);