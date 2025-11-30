-- Create RPC function for Top 100 leaderboard with server-side aggregation
CREATE OR REPLACE FUNCTION get_top100_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param int DEFAULT 20,
  offset_param int DEFAULT 0,
  current_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_list_ids uuid[];
  time_filter timestamptz;
  result jsonb;
  current_user_data jsonb := NULL;
BEGIN
  -- Resolve scope to list IDs
  IF scope_param = 'worldwide' THEN
    SELECT array_agg(id)
    INTO target_list_ids
    FROM top100_lists
    WHERE is_active = true;
  ELSE
    SELECT array_agg(id)
    INTO target_list_ids
    FROM top100_lists
    WHERE slug = scope_param AND is_active = true;
  END IF;

  IF target_list_ids IS NULL OR array_length(target_list_ids, 1) IS NULL THEN
    RETURN jsonb_build_object(
      'entries', '[]'::jsonb,
      'total_count', 0,
      'current_user_entry', NULL
    );
  END IF;

  -- Resolve time filter
  CASE time_range_param
    WHEN 'this_year' THEN
      time_filter := date_trunc('year', now());
    WHEN 'this_month' THEN
      time_filter := date_trunc('month', now());
    ELSE
      time_filter := NULL;
  END CASE;

  -- Build leaderboard with ranking
  WITH valid_courses AS (
    SELECT DISTINCT course_id
    FROM course_top100_memberships
    WHERE list_id = ANY(target_list_ids)
  ),
  filtered_activity AS (
    SELECT 
      uca.user_id,
      uca.course_id
    FROM user_course_activity uca
    INNER JOIN valid_courses vc ON uca.course_id = vc.course_id
    WHERE uca.is_top100 = true
      AND (time_filter IS NULL OR uca.last_played_at >= time_filter)
  ),
  user_counts AS (
    SELECT 
      user_id,
      COUNT(DISTINCT course_id) as total_top100_played
    FROM filtered_activity
    GROUP BY user_id
  ),
  all_time_counts AS (
    SELECT 
      uca.user_id,
      COUNT(DISTINCT uca.course_id) as worldwide_count
    FROM user_course_activity uca
    WHERE uca.is_top100 = true
    GROUP BY uca.user_id
  ),
  leaderboard_data AS (
    SELECT 
      uc.user_id,
      up.display_name,
      up.profile_photo_url,
      up.home_club,
      uc.total_top100_played,
      COALESCE(atc.worldwide_count, uc.total_top100_played) as worldwide_count,
      CASE 
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 300 THEN 'platinum'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 200 THEN 'gold'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 100 THEN 'silver'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 50 THEN 'green'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 20 THEN 'blue'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) > 0 THEN 'bronze'
        ELSE NULL
      END as prestige_ring,
      CASE 
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 300 THEN '300 Club Champion'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 200 THEN '200 Clubhouse Elite'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 100 THEN '100 Century Club'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 50 THEN '50 Club'
        WHEN COALESCE(atc.worldwide_count, uc.total_top100_played) >= 20 THEN '20 Club'
        ELSE NULL
      END as milestone_label,
      ROW_NUMBER() OVER (ORDER BY uc.total_top100_played DESC, up.display_name ASC) as rank
    FROM user_counts uc
    INNER JOIN user_profiles up ON uc.user_id = up.id
    LEFT JOIN all_time_counts atc ON uc.user_id = atc.user_id
  ),
  paginated_entries AS (
    SELECT 
      user_id,
      display_name,
      profile_photo_url as avatar_url,
      home_club,
      total_top100_played,
      prestige_ring,
      milestone_label,
      rank
    FROM leaderboard_data
    ORDER BY rank
    LIMIT limit_param
    OFFSET offset_param
  ),
  total_count_calc AS (
    SELECT COUNT(*) as total
    FROM leaderboard_data
  )
  SELECT jsonb_build_object(
    'entries', COALESCE(
      (SELECT jsonb_agg(row_to_json(pe.*))
       FROM paginated_entries pe),
      '[]'::jsonb
    ),
    'total_count', (SELECT total FROM total_count_calc),
    'current_user_entry', (
      SELECT row_to_json(ld.*)
      FROM leaderboard_data ld
      WHERE ld.user_id = current_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_top100_leaderboard TO authenticated;

COMMENT ON FUNCTION get_top100_leaderboard IS 'Returns Top 100 leaderboard with server-side aggregation and ranking';
