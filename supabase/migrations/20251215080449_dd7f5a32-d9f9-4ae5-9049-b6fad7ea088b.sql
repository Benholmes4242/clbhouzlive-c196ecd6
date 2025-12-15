-- 1) Fix leaderboard RPC slug mismatch: 'gbi' → 'gb-i'
-- Drop and recreate the get_top100_leaderboard function with correct slug
CREATE OR REPLACE FUNCTION public.get_top100_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0,
  current_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  top100_courses_played bigint,
  global_rank bigint,
  regional_rank bigint,
  is_friend boolean,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  list_slugs text[];
BEGIN
  -- Map scope to list slugs (FIXED: 'gbi' → 'gb-i')
  CASE scope_param
    WHEN 'worldwide' THEN list_slugs := ARRAY['global', 'gb-i', 'usa', 'europe'];
    WHEN 'gbi' THEN list_slugs := ARRAY['gb-i'];  -- Support old param name
    WHEN 'gb-i' THEN list_slugs := ARRAY['gb-i'];
    WHEN 'usa' THEN list_slugs := ARRAY['usa'];
    WHEN 'europe' THEN list_slugs := ARRAY['europe'];
    WHEN 'global' THEN list_slugs := ARRAY['global'];
    ELSE list_slugs := ARRAY['global', 'gb-i', 'usa', 'europe'];
  END CASE;

  RETURN QUERY
  WITH user_courses AS (
    SELECT 
      cr.user_id,
      COUNT(DISTINCT cr.course_id) as courses_played,
      MAX(cr.created_at) as last_activity
    FROM course_ratings cr
    INNER JOIN course_top100_memberships ctm ON cr.course_id = ctm.course_id
    INNER JOIN top100_lists t ON ctm.list_id = t.id
    WHERE t.slug = ANY(list_slugs)
      AND cr.rating IS NOT NULL
      AND cr.is_mock = false
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
      )
    GROUP BY cr.user_id
    HAVING COUNT(DISTINCT cr.course_id) > 0
  ),
  ranked_users AS (
    SELECT 
      uc.user_id,
      uc.courses_played,
      uc.last_activity,
      ROW_NUMBER() OVER (ORDER BY uc.courses_played DESC, uc.last_activity DESC) as g_rank,
      ROW_NUMBER() OVER (ORDER BY uc.courses_played DESC, uc.last_activity DESC) as r_rank
    FROM user_courses uc
    INNER JOIN user_profiles up ON uc.user_id = up.id
    WHERE up.is_public = true
  )
  SELECT 
    ru.user_id,
    up.username::text,
    up.display_name::text,
    up.profile_photo_url::text,
    up.home_club::text,
    ru.courses_played,
    ru.g_rank,
    ru.r_rank,
    CASE 
      WHEN current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM user_friends uf 
        WHERE uf.user_id = current_user_id 
          AND uf.friend_id = ru.user_id 
          AND uf.status = 'accepted'
      )
    END as is_friend,
    ru.last_activity
  FROM ranked_users ru
  INNER JOIN user_profiles up ON ru.user_id = up.id
  ORDER BY ru.g_rank
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- 2) Add CHECK constraint on course_ratings.rating for 0.0-10.0 range
-- First, verify no rows violate the constraint (should return 0)
DO $$
DECLARE
  violation_count integer;
BEGIN
  SELECT COUNT(*) INTO violation_count
  FROM course_ratings
  WHERE rating IS NOT NULL AND (rating < 0 OR rating > 10);
  
  IF violation_count > 0 THEN
    RAISE EXCEPTION 'Found % rows with rating outside 0-10 range', violation_count;
  END IF;
END $$;

-- Add the constraint (if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'course_ratings_rating_range_check'
  ) THEN
    ALTER TABLE course_ratings
    ADD CONSTRAINT course_ratings_rating_range_check
    CHECK (rating >= 0 AND rating <= 10);
  END IF;
END $$;

-- Add constraint for 1 decimal place precision
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'course_ratings_rating_precision_check'
  ) THEN
    ALTER TABLE course_ratings
    ADD CONSTRAINT course_ratings_rating_precision_check
    CHECK (rating = ROUND(rating::numeric, 1));
  END IF;
END $$;