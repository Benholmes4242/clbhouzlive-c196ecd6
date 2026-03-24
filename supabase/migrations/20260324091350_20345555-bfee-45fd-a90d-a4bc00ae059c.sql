-- Fix 1: get_lowest_handicap_leaderboard - change p_current_user_id and p_club_id to text, cast to uuid
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text,
  p_current_user_id text DEFAULT NULL,
  p_club_id text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  user_id uuid, display_name text, avatar_url text,
  handicap_index numeric, club_name text, country text,
  rank bigint, is_current_user boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      up.id AS user_id,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index AS handicap_index,
      gc.name AS club_name,
      gc.country,
      ROW_NUMBER() OVER (ORDER BY up.eg_handicap_index ASC) AS rank
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
      AND (
        p_scope = 'global'
        OR (p_scope = 'club'
            AND p_club_id IS NOT NULL
            AND up.primary_club_id = p_club_id::uuid)
        OR (p_scope = 'friends'
            AND p_current_user_id IS NOT NULL
            AND (
              up.id IN (
                SELECT uf.following_id FROM user_follows uf
                WHERE uf.follower_id = p_current_user_id::uuid
              )
              OR up.id = p_current_user_id::uuid
            ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  )
  SELECT
    r.user_id, r.display_name, r.avatar_url,
    r.handicap_index, r.club_name, r.country, r.rank,
    (r.user_id = p_current_user_id::uuid) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- Fix 2: get_podium_seasonal - change p_current_user_id and p_club_id to text, cast to uuid
CREATE OR REPLACE FUNCTION public.get_podium_seasonal(
  p_scope text,
  p_country text DEFAULT NULL,
  p_current_user_id text DEFAULT NULL,
  p_club_id text DEFAULT NULL,
  p_division_id text DEFAULT NULL
)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, courses_count integer, rank bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.display_name,
    up.profile_photo_url AS avatar_url,
    COALESCE(uss.courses_logged, 0)::integer AS courses_count,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(uss.courses_logged, 0) DESC, up.created_at ASC
    ) AS rank
  FROM user_profiles up
  LEFT JOIN user_season_stats uss ON uss.user_id = up.id
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE 
    up.show_in_exploration_leaderboards = TRUE
    AND CASE 
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN 
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'division' AND p_division_id IS NOT NULL THEN 
        uss.current_division = p_division_id::uuid
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN 
        up.id IN (
          SELECT uf.following_id 
          FROM user_follows uf 
          WHERE uf.follower_id = p_current_user_id::uuid
        ) OR up.id = p_current_user_id::uuid
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN 
        up.primary_club_id = p_club_id::uuid OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc 
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id::uuid
        )
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
  ORDER BY courses_count DESC, up.created_at ASC
  LIMIT 3;
END;
$function$;