-- Clean slate: drop everything related to achievements
DROP VIEW IF EXISTS user_achievements_view CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- Master catalogue of achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon_key TEXT,
  points INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-user unlocked achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  source_context JSONB,
  UNIQUE (user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read the public catalogue
CREATE POLICY "Anyone can read achievements" ON achievements
  FOR SELECT USING (true);

-- Users can only see their own unlocked achievements
CREATE POLICY "Users can read own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Insert is done by backend / service role
CREATE POLICY "Service insert only" ON user_achievements
  FOR INSERT WITH CHECK (false);

-- Seed initial achievements
INSERT INTO achievements (code, name, description, category, points, sort_order)
VALUES
  ('FIRST_REVIEW', 'First Review', 'Leave your first written review on any course.', 'skill', 50, 10),
  ('FIVE_REVIEWS', 'Course Critic', 'Leave 5 course reviews.', 'skill', 100, 20),
  ('TEN_REVIEWS', 'Local Insider', 'Leave 10 course reviews.', 'skill', 200, 30),
  ('FIRST_COURSE', 'First Round Logged', 'Log your first course on Clbhouz.', 'exploration', 25, 40),
  ('TEN_COURSES', 'On Tour', 'Log 10 different courses.', 'exploration', 100, 50),
  ('TWENTY_FIVE_COURSES', 'Course Collector', 'Log 25 different courses.', 'exploration', 200, 60),
  ('TOP100_ANY_5', 'Top 100 Taster', 'Play 5 Top 100 courses worldwide.', 'exploration', 150, 70),
  ('TOP100_ANY_10', 'Top 100 Explorer', 'Play 10 Top 100 courses worldwide.', 'exploration', 300, 80),
  ('FIRST_FRIEND', 'First Friend', 'Follow your first golfer.', 'social', 50, 90),
  ('FIVE_FRIENDS', 'Clubhouse Crew', 'Follow 5 golfers.', 'social', 100, 100);

-- View for fast reading
CREATE VIEW user_achievements_view AS
SELECT
  a.id AS achievement_id,
  a.code,
  a.name,
  a.description,
  a.category,
  a.icon_key,
  a.points,
  a.sort_order,
  ua.user_id,
  ua.unlocked_at,
  ua.source_context,
  (ua.user_id IS NOT NULL) AS is_unlocked
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id;