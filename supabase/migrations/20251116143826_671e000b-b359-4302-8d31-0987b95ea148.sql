-- PHASE 1: Core Infrastructure Migration (Final)

-- 1. Create top100_lists table
CREATE TABLE IF NOT EXISTS top100_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial lists
INSERT INTO top100_lists (slug, name, short_label, sort_order) VALUES
  ('global', 'Global Top 100', 'Global', 1),
  ('gb-i', 'Britain & Ireland Top 100', 'GB&I', 2),
  ('usa', 'USA Top 100', 'USA', 3),
  ('europe', 'Continental Europe Top 100', 'Europe', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create course_top100_memberships table
CREATE TABLE IF NOT EXISTS course_top100_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES top100_lists(id) ON DELETE CASCADE,
  rank INT NOT NULL CHECK (rank >= 1 AND rank <= 100),
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, list_id),
  UNIQUE(list_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_course_top100_course ON course_top100_memberships(course_id);
CREATE INDEX IF NOT EXISTS idx_course_top100_list ON course_top100_memberships(list_id);
CREATE INDEX IF NOT EXISTS idx_course_top100_rank ON course_top100_memberships(list_id, rank);

-- 3. Add rating breakdown columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_ratings' AND column_name='design_score') THEN
    ALTER TABLE course_ratings ADD COLUMN design_score NUMERIC CHECK (design_score >= 0 AND design_score <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_ratings' AND column_name='condition_score') THEN
    ALTER TABLE course_ratings ADD COLUMN condition_score NUMERIC CHECK (condition_score >= 0 AND condition_score <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_ratings' AND column_name='facilities_score') THEN
    ALTER TABLE course_ratings ADD COLUMN facilities_score NUMERIC CHECK (facilities_score >= 0 AND facilities_score <= 10);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_ratings_course ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user ON course_ratings(user_id);

-- 4. Create course_rating_aggregates view
CREATE OR REPLACE VIEW course_rating_aggregates AS
SELECT
  course_id,
  AVG(rating) as avg_overall_score,
  AVG(design_score) as avg_design_score,
  AVG(condition_score) as avg_condition_score,
  AVG(facilities_score) as avg_facilities_score,
  COUNT(*) as review_count,
  COUNT(*) FILTER (WHERE review IS NOT NULL AND review != '') as text_review_count
FROM course_ratings
GROUP BY course_id;

-- 5. Create user_course_activity view
CREATE OR REPLACE VIEW user_course_activity AS
SELECT DISTINCT
  up.user_id,
  up.course_id,
  up.first_played_at,
  up.last_played_at,
  cr.rating as rating_value,
  CASE WHEN cr.review IS NOT NULL AND cr.review != '' THEN true ELSE false END as has_review,
  CASE WHEN cr.rating IS NOT NULL THEN true ELSE false END as has_rating,
  false as in_top_ten,
  CASE 
    WHEN gc.global_rank IS NOT NULL AND gc.global_rank BETWEEN 1 AND 100 THEN true
    WHEN EXISTS (SELECT 1 FROM course_top100_memberships ctm WHERE ctm.course_id = gc.id) THEN true
    ELSE false
  END as is_top100
FROM (
  SELECT DISTINCT 
    user_id,
    course_id,
    MIN(created_at) OVER (PARTITION BY user_id, course_id) as first_played_at,
    MAX(created_at) OVER (PARTITION BY user_id, course_id) as last_played_at
  FROM course_ratings
) up
JOIN golf_courses gc ON gc.id = up.course_id
LEFT JOIN course_ratings cr ON cr.user_id = up.user_id AND cr.course_id = up.course_id;

-- 6. Create course_change_log table
CREATE TABLE IF NOT EXISTS course_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  change_type TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  change_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_course ON course_change_log(course_id);
CREATE INDEX IF NOT EXISTS idx_change_log_admin ON course_change_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_change_log_created ON course_change_log(created_at DESC);

-- 7. Add search indexes
CREATE INDEX IF NOT EXISTS idx_golf_courses_name_gin ON golf_courses USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_golf_courses_country ON golf_courses(country);
CREATE INDEX IF NOT EXISTS idx_golf_courses_region ON golf_courses(region);
CREATE INDEX IF NOT EXISTS idx_golf_courses_continent ON golf_courses(continent);

-- 8. Enable RLS
ALTER TABLE top100_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_top100_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active lists" ON top100_lists;
CREATE POLICY "Anyone can view active lists" ON top100_lists FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage lists" ON top100_lists;
CREATE POLICY "Admins can manage lists" ON top100_lists FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Anyone can view memberships" ON course_top100_memberships;
CREATE POLICY "Anyone can view memberships" ON course_top100_memberships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage memberships" ON course_top100_memberships;
CREATE POLICY "Admins can manage memberships" ON course_top100_memberships FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view change log" ON course_change_log;
CREATE POLICY "Admins can view change log" ON course_change_log FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert change log" ON course_change_log;
CREATE POLICY "Admins can insert change log" ON course_change_log FOR INSERT WITH CHECK (is_admin());