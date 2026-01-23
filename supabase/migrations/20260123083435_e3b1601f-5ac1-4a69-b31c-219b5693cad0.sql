-- Drop any old 5-parameter overload of get_handicap_improvement_leaderboard
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, integer, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(integer, text, integer, integer, uuid);

-- Drop the current 4-parameter version to recreate cleanly
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, integer, integer, uuid);

-- Recreate with the correct signature (p_scope, p_limit, p_offset, p_current_user_id)
CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text DEFAULT 'global',
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  improvement double precision,
  handicap_before double precision,
  current_handicap double precision,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_date timestamptz := now() - interval '30 days';
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT
      CASE
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS fid
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  earliest_in_window AS (
    SELECT DISTINCT ON (uhh.user_id)
      uhh.user_id,
      uhh.handicap_value AS earliest_handicap
    FROM user_handicap_history uhh
    WHERE uhh.recorded_at >= v_cutoff_date
    ORDER BY uhh.user_id, uhh.recorded_at ASC
  ),
  improvements AS (
    SELECT
      up.id AS uid,
      up.username,
      up.display_name,
      up.avatar_url,
      up.eg_handicap_index AS current_hcp,
      eiw.earliest_handicap AS before_hcp,
      (eiw.earliest_handicap - up.eg_handicap_index) AS imp
    FROM user_profiles up
    JOIN earliest_in_window eiw ON eiw.user_id = up.id
    WHERE up.eg_handicap_index IS NOT NULL
      AND eiw.earliest_handicap IS NOT NULL
      AND (eiw.earliest_handicap - up.eg_handicap_index) > 0
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT fid FROM friend_ids) OR up.id = p_current_user_id))
      )
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY imp DESC) AS rn,
      uid,
      username,
      display_name,
      avatar_url,
      imp,
      before_hcp,
      current_hcp
    FROM improvements
  )
  SELECT
    r.rn::bigint AS rank,
    r.uid AS user_id,
    r.username::text,
    r.display_name::text,
    r.avatar_url::text,
    r.imp::double precision AS improvement,
    r.before_hcp::double precision AS handicap_before,
    r.current_hcp::double precision AS current_handicap,
    (r.uid = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rn
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_handicap_improvement_leaderboard(text, integer, integer, uuid) TO anon, authenticated;