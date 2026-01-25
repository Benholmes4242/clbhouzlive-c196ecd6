-- Create all-time championship leaderboard function
-- Aggregates lifetime courses across all seasons

CREATE OR REPLACE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_photo_url text,
  home_club text,
  total_courses bigint,
  rank bigint,
  is_friend boolean,
  is_rival boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH lifetime_stats AS (
    -- Aggregate all courses ever logged per user
    SELECT 
      up.id as user_id,
      up.username,
      COALESCE(up.display_name, up.username, 'Anonymous') as display_name,
      up.profile_photo_url,
      up.home_club,
      COALESCE(up.courses_logged_all_time, 0)::bigint as total_courses
    FROM user_profiles up
    WHERE up.is_deleted = false
      AND COALESCE(up.courses_logged_all_time, 0) > 0
  ),
  ranked AS (
    SELECT 
      ls.*,
      ROW_NUMBER() OVER (ORDER BY ls.total_courses DESC, ls.display_name ASC)::bigint as rank
    FROM lifetime_stats ls
  ),
  friend_check AS (
    SELECT 
      r.*,
      CASE 
        WHEN p_current_user_id IS NOT NULL THEN
          EXISTS (
            SELECT 1 FROM friendships f 
            WHERE f.status = 'accepted' 
            AND ((f.user_id = p_current_user_id AND f.friend_id = r.user_id)
              OR (f.friend_id = p_current_user_id AND f.user_id = r.user_id))
          )
        ELSE false
      END as is_friend,
      CASE 
        WHEN p_current_user_id IS NOT NULL THEN
          EXISTS (
            SELECT 1 FROM user_rivals ur 
            WHERE ur.user_id = p_current_user_id 
            AND ur.rival_user_id = r.user_id
          )
        ELSE false
      END as is_rival
    FROM ranked r
  )
  SELECT 
    fc.user_id,
    fc.username,
    fc.display_name,
    fc.profile_photo_url,
    fc.home_club,
    fc.total_courses,
    fc.rank,
    fc.is_friend,
    fc.is_rival
  FROM friend_check fc
  WHERE
    CASE 
      WHEN p_scope = 'global' THEN true
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        fc.is_friend = true OR fc.user_id = p_current_user_id
      WHEN p_scope = 'division' THEN true -- Division doesn't apply to all-time
      ELSE true
    END
  ORDER BY fc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;