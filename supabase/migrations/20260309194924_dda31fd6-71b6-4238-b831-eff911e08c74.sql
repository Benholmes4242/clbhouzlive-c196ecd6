-- Migration 3: College ID Column
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES college_media(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_college_id
  ON user_profiles(college_id)
  WHERE college_id IS NOT NULL;

COMMENT ON COLUMN user_profiles.college_id IS 'FK to college_media — enables college-based filtering and features';