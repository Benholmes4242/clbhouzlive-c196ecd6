-- Fix: Drop existing function before recreating with new return type
DROP FUNCTION IF EXISTS get_user_exploration_status(uuid);

-- Update get_user_exploration_status to include continents
CREATE OR REPLACE FUNCTION get_user_exploration_status(p_user_id uuid)
RETURNS TABLE (
  countries_count integer,
  country_list text[],
  continents_count integer,
  continent_list text[],
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
      ues.continents_played,
      ues.continent_list,
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
    COALESCE(us.continents_played, 0)::integer AS continents_count,
    COALESCE(us.continent_list, ARRAY[]::text[]) AS continent_list,
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