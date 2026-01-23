-- Fix exploration stats to use sub_country instead of country for granular tracking

-- First, update the exploration stats trigger function to use sub_country
CREATE OR REPLACE FUNCTION public.update_exploration_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_country TEXT;
BEGIN
  -- Get the sub_country for the rated course
  SELECT gc.sub_country INTO v_sub_country
  FROM golf_courses gc
  WHERE gc.id = NEW.course_id;

  -- Skip if no sub_country
  IF v_sub_country IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert exploration stats
  INSERT INTO user_exploration_stats (user_id, countries_played, country_list, updated_at)
  SELECT 
    NEW.user_id,
    COUNT(DISTINCT gc.sub_country),
    ARRAY_AGG(DISTINCT gc.sub_country) FILTER (WHERE gc.sub_country IS NOT NULL),
    NOW()
  FROM course_ratings cr
  JOIN golf_courses gc ON gc.id = cr.course_id
  WHERE cr.user_id = NEW.user_id AND gc.sub_country IS NOT NULL
  ON CONFLICT (user_id) 
  DO UPDATE SET
    countries_played = EXCLUDED.countries_played,
    country_list = EXCLUDED.country_list,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Re-backfill using sub_country for accurate country tracking
TRUNCATE user_exploration_stats;

INSERT INTO user_exploration_stats (user_id, countries_played, country_list, updated_at)
SELECT 
  cr.user_id,
  COUNT(DISTINCT gc.sub_country) as countries_played,
  ARRAY_AGG(DISTINCT gc.sub_country) FILTER (WHERE gc.sub_country IS NOT NULL) as country_list,
  NOW() as updated_at
FROM course_ratings cr
JOIN golf_courses gc ON gc.id = cr.course_id
WHERE gc.sub_country IS NOT NULL
GROUP BY cr.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  countries_played = EXCLUDED.countries_played,
  country_list = EXCLUDED.country_list,
  updated_at = NOW();

-- Also update the get_countries_leaderboard RPC to use sub_country
DROP FUNCTION IF EXISTS public.get_countries_leaderboard(text, integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_countries_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  countries_count integer,
  country_list text[],
  rank bigint,
  is_friend boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      ues.user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      ues.countries_played AS countries_count,
      ues.country_list,
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, ues.updated_at ASC) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    WHERE ues.countries_played > 0
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE p_current_user_id IS NOT NULL
      AND uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  )
  SELECT 
    ru.user_id,
    ru.display_name,
    ru.username,
    ru.avatar_url,
    ru.countries_count::integer,
    ru.country_list,
    ru.rank,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE 
    CASE 
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_user_exploration_status to also use sub_country data
DROP FUNCTION IF EXISTS public.get_user_exploration_status(uuid);

CREATE OR REPLACE FUNCTION public.get_user_exploration_status(
  p_user_id uuid
)
RETURNS TABLE (
  countries_count integer,
  country_list text[],
  regions_count integer,
  region_list text[],
  global_rank bigint,
  friends_rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      ues.countries_played,
      ues.country_list,
      ues.regions_completed,
      ues.region_list
    FROM user_exploration_stats ues
    WHERE ues.user_id = p_user_id
  ),
  global_ranking AS (
    SELECT COUNT(*) + 1 AS rank
    FROM user_exploration_stats ues2
    WHERE ues2.countries_played > COALESCE((SELECT countries_played FROM user_stats), 0)
  ),
  friend_ids AS (
    SELECT 
      CASE 
        WHEN uf.user_id = p_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_user_id OR uf.friend_id = p_user_id)
  ),
  friends_ranking AS (
    SELECT COUNT(*) + 1 AS rank
    FROM user_exploration_stats ues3
    WHERE ues3.user_id IN (SELECT fi.friend_id FROM friend_ids fi)
      AND ues3.countries_played > COALESCE((SELECT countries_played FROM user_stats), 0)
  )
  SELECT 
    COALESCE(us.countries_played, 0)::integer AS countries_count,
    COALESCE(us.country_list, ARRAY[]::text[]) AS country_list,
    COALESCE(us.regions_completed, 0)::integer AS regions_count,
    COALESCE(us.region_list, ARRAY[]::text[]) AS region_list,
    COALESCE(gr.rank, 0)::bigint AS global_rank,
    COALESCE(fr.rank, 0)::bigint AS friends_rank
  FROM (SELECT 1) AS dummy
  LEFT JOIN user_stats us ON TRUE
  LEFT JOIN global_ranking gr ON TRUE
  LEFT JOIN friends_ranking fr ON TRUE;
END;
$$;