-- Fix type mismatch: cast eg_handicap_index to numeric to match return type
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text DEFAULT 'global',
  p_club_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  handicap_index numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_club_id uuid;
BEGIN
  -- Determine club ID: use p_club_id if provided, otherwise get user's primary club for 'club' scope
  IF p_club_id IS NOT NULL THEN
    v_user_club_id := p_club_id;
  ELSIF p_scope = 'club' AND p_current_user_id IS NOT NULL THEN
    SELECT primary_club_id INTO v_user_club_id
    FROM user_profiles
    WHERE id = p_current_user_id;
  END IF;

  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  -- CTE for users who have this club as secondary (user_home_clubs)
  secondary_club_members AS (
    SELECT user_profile_id
    FROM user_home_clubs
    WHERE club_id = v_user_club_id
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC NULLS LAST, up.id) AS rn,
      up.id AS uid,
      up.username AS uname,
      up.display_name AS dname,
      up.profile_photo_url AS aurl,
      up.eg_handicap_index::numeric AS hindex  -- Cast to numeric to match return type
    FROM user_profiles up
    WHERE up.is_public = true
      AND up.eg_handicap_index IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL 
            AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
        OR (p_scope = 'club' AND v_user_club_id IS NOT NULL 
            AND (up.primary_club_id = v_user_club_id 
                 OR up.id IN (SELECT user_profile_id FROM secondary_club_members)))
      )
  )
  SELECT
    r.rn AS rank,
    r.uid AS user_id,
    r.uname AS username,
    r.dname AS display_name,
    r.aurl AS avatar_url,
    r.hindex AS handicap_index,
    (p_current_user_id IS NOT NULL AND r.uid = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rn
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;