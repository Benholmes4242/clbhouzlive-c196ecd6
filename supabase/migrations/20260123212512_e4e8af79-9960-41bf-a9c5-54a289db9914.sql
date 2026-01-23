-- 1. Season Podium Archive Table
CREATE TABLE IF NOT EXISTS season_podium_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES championship_seasons(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  season_name TEXT NOT NULL,
  first_place_user_id UUID NOT NULL REFERENCES user_profiles(id),
  first_place_courses INTEGER NOT NULL,
  first_place_division TEXT NOT NULL,
  second_place_user_id UUID REFERENCES user_profiles(id),
  second_place_courses INTEGER,
  second_place_division TEXT,
  third_place_user_id UUID REFERENCES user_profiles(id),
  third_place_courses INTEGER,
  third_place_division TEXT,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'division', 'friends')),
  division_id TEXT,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(season_id, scope, division_id)
);

CREATE INDEX IF NOT EXISTS idx_season_archive_season ON season_podium_archive(season_id);
CREATE INDEX IF NOT EXISTS idx_season_archive_users ON season_podium_archive(first_place_user_id, second_place_user_id, third_place_user_id);

ALTER TABLE season_podium_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for season archives" ON season_podium_archive;
CREATE POLICY "Public read for season archives" ON season_podium_archive FOR SELECT USING (true);

-- 2. User Hall of Fame Stats Table
CREATE TABLE IF NOT EXISTS user_hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seasons_won INTEGER NOT NULL DEFAULT 0,
  podium_finishes INTEGER NOT NULL DEFAULT 0,
  all_time_courses_logged INTEGER NOT NULL DEFAULT 0,
  all_time_countries_visited INTEGER NOT NULL DEFAULT 0,
  last_win_season_id UUID REFERENCES championship_seasons(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_hall_of_fame_wins ON user_hall_of_fame(seasons_won DESC);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_courses ON user_hall_of_fame(all_time_courses_logged DESC);

ALTER TABLE user_hall_of_fame ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for hall of fame" ON user_hall_of_fame;
CREATE POLICY "Public read for hall of fame" ON user_hall_of_fame FOR SELECT USING (true);

-- 3. Backfill Hall of Fame from Course Ratings
INSERT INTO user_hall_of_fame (user_id, all_time_courses_logged, all_time_countries_visited, updated_at)
SELECT 
  cr.user_id,
  COUNT(*) as all_time_courses_logged,
  COUNT(DISTINCT gc.sub_country) as all_time_countries_visited,
  NOW()
FROM course_ratings cr
JOIN golf_courses gc ON gc.id = cr.course_id
WHERE cr.user_id IS NOT NULL
GROUP BY cr.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  all_time_courses_logged = EXCLUDED.all_time_courses_logged,
  all_time_countries_visited = EXCLUDED.all_time_countries_visited,
  updated_at = NOW();