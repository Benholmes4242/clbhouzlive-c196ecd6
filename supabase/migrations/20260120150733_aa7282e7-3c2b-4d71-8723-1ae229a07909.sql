-- Phase 1: Add is_pinned column to track manual positioning
ALTER TABLE user_top_ten_courses 
ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Phase 2: Create exclusions table for courses users explicitly remove
CREATE TABLE user_top10_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Index for fast lookups
CREATE INDEX idx_top10_exclusions_user ON user_top10_exclusions(user_id);

-- RLS policies
ALTER TABLE user_top10_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exclusions" ON user_top10_exclusions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exclusions" ON user_top10_exclusions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exclusions" ON user_top10_exclusions
  FOR DELETE USING (auth.uid() = user_id);