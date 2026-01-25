-- Fix type mismatches in get_top100_course_leaderboard return values
CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  scope_param text DEFAULT 'worldwide'::text, 
  time_range_param text DEFAULT 'all_time'::text, 
  sort_param text DEFAULT 'most_played'::text, 
  limit_param integer DEFAULT 20, 
  offset_param integer DEFAULT 0, 
  current_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  course_id uuid, 
  course_name text, 
  country text, 
  sub_country text, 
  thumbnail_url text, 
  list_slug text, 
  times_played bigint, 
  avg_rating numeric, 
  global_rank integer, 
  regional_rank integer, 
  usa_rank integer, 
  friends_count bigint, 
  friends_avg_rating numeric, 
  shortlisted_count bigint, 
  shortlisted_by_me boolean, 
  unique_players bigint, 
  rank bigint, 
  previous_rank bigint, 
  rank_change integer, 
  is_trending boolean, 
  is_hall_of_fame boolean, 
  season_wins integer, 
  prestige_tags text[], 
  current_user_played boolean, 
  current_user_rating numeric, 
  current_user_play_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(current_user_id, auth.uid());

  RETURN QUERY
  WITH top100_courses AS (
    SELECT
      gc.id,
      gc.name,
      gc.country AS gc_country,
      gc.sub_country,
      gc.thumbnail_image,
      gc.global_rank,
      gc.regional_rank,
      gc.usa_rank,
      gc.continent,
      CASE
        WHEN gc.global_rank IS NOT NULL THEN 'global'
        WHEN gc.usa_rank IS NOT NULL THEN 'usa'
        WHEN gc.regional_rank IS NOT NULL THEN 'gb-i'
        ELSE 'worldwide'
      END AS list_slug
    FROM golf_courses gc
    WHERE gc.global_rank IS NOT NULL
       OR gc.regional_rank IS NOT NULL
       OR gc.usa_rank IS NOT NULL
  ),
  my_friends AS (
    SELECT
      CASE
        WHEN uf.user_id = v_user_id THEN uf.friend_id
        WHEN uf.friend_id = v_user_id THEN uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE (uf.user_id = v_user_id OR uf.friend_id = v_user_id)
      AND uf.status = 'accepted'
  ),
  course_stats AS (
    SELECT 
      tc.id AS cs_course_id,
      tc.name AS cs_name,
      tc.gc_country AS cs_country,
      tc.sub_country AS cs_sub_country,
      tc.thumbnail_image AS cs_thumbnail,
      tc.global_rank AS cs_global_rank,
      tc.regional_rank AS cs_regional_rank,
      tc.usa_rank AS cs_usa_rank,
      tc.list_slug AS cs_list_slug,
      COUNT(DISTINCT cr.id)::bigint AS times_played,
      COUNT(DISTINCT cr.user_id)::bigint AS unique_players,
      AVG(cr.rating)::numeric(3,1) AS avg_rating,
      COUNT(DISTINCT CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.user_id END)::bigint AS friends_count,
      AVG(CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.rating END)::numeric(3,1) AS friends_avg_rating,
      bool_or(cr.user_id = v_user_id) AS current_user_played,
      (SELECT cr2.rating FROM course_ratings cr2 WHERE cr2.course_id = tc.id AND cr2.user_id = v_user_id ORDER BY cr2.created_at DESC LIMIT 1) AS current_user_rating,
      (SELECT COUNT(*)::integer FROM course_ratings cr3 WHERE cr3.course_id = tc.id AND cr3.user_id = v_user_id) AS current_user_play_count
    FROM top100_courses tc
    LEFT JOIN course_ratings cr
      ON cr.course_id = tc.id
      AND cr.is_mock = false
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
        OR (time_range_param = 'this_season' AND cr.created_at >= COALESCE(
          (SELECT start_date FROM championship_seasons WHERE status = 'active' LIMIT 1),
          date_trunc('year', now())
        ))
      )
    WHERE
      CASE 
        WHEN scope_param = 'worldwide' THEN true
        WHEN scope_param = 'global-top-100' THEN tc.global_rank IS NOT NULL AND tc.global_rank <= 100
        WHEN scope_param = 'gb-i-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 
          AND tc.gc_country IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        WHEN scope_param = 'usa-top-100' THEN tc.usa_rank IS NOT NULL AND tc.usa_rank <= 100
        WHEN scope_param = 'europe-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 
          AND tc.continent = 'Europe' 
          AND tc.gc_country NOT IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        ELSE true
      END
    GROUP BY tc.id, tc.name, tc.gc_country, tc.sub_country, tc.thumbnail_image, 
             tc.global_rank, tc.regional_rank, tc.usa_rank, tc.list_slug
  ),
  shortlist_counts AS (
    SELECT
      scs.course_id AS sc_course_id,
      COUNT(*)::bigint AS shortlisted_count,
      bool_or(scs.user_id = v_user_id) AS shortlisted_by_me
    FROM course_shortlists scs
    GROUP BY scs.course_id
  ),
  with_ranks AS (
    SELECT 
      cs.cs_course_id,
      cs.cs_name,
      cs.cs_country,
      cs.cs_sub_country,
      cs.cs_thumbnail,
      cs.cs_global_rank,
      cs.cs_regional_rank,
      cs.cs_usa_rank,
      cs.cs_list_slug,
      cs.times_played,
      cs.unique_players,
      cs.avg_rating,
      cs.friends_count,
      cs.friends_avg_rating,
      cs.current_user_played,
      cs.current_user_rating,
      cs.current_user_play_count,
      COALESCE(sc.shortlisted_count, 0::bigint) AS shortlisted_count,
      COALESCE(sc.shortlisted_by_me, false) AS shortlisted_by_me,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE sort_param
            WHEN 'most_played' THEN cs.times_played
            WHEN 'highest_rated' THEN (COALESCE(cs.avg_rating, 0) * 1000000)::bigint
            WHEN 'trending' THEN (COALESCE(cs.avg_rating, 0) / NULLIF(LOG(GREATEST(cs.times_played, 1) + 1), 0) * 1000000)::bigint
            WHEN 'rising' THEN (COALESCE(cs.avg_rating, 0) / NULLIF(LOG(GREATEST(cs.times_played, 1) + 1), 0) * 1000000)::bigint
            WHEN 'friends' THEN cs.friends_count
            ELSE cs.times_played
          END DESC NULLS LAST,
          cs.cs_name ASC
      )::bigint AS computed_rank,
      (SELECT crh.rank FROM course_rank_history crh 
       WHERE crh.course_id = cs.cs_course_id 
       AND crh.rank_type = sort_param 
       AND crh.time_period = time_range_param
       AND crh.recorded_date < CURRENT_DATE
       ORDER BY crh.recorded_at DESC LIMIT 1)::bigint AS previous_rank
    FROM course_stats cs
    LEFT JOIN shortlist_counts sc ON sc.sc_course_id = cs.cs_course_id
  ),
  with_prestige AS (
    SELECT 
      wr.*,
      (COALESCE(wr.previous_rank, wr.computed_rank)::integer - wr.computed_rank::integer)::integer AS rank_change,
      ((COALESCE(wr.previous_rank, wr.computed_rank)::integer - wr.computed_rank::integer) >= 5) AS is_trending,
      EXISTS(SELECT 1 FROM course_prestige_tags cpt WHERE cpt.course_id = wr.cs_course_id AND cpt.tag_type = 'hall_of_fame') AS is_hall_of_fame,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = wr.cs_course_id AND cpt.tag_type = 'season_winner') AS season_wins,
      ARRAY(SELECT cpt.tag_label FROM course_prestige_tags cpt WHERE cpt.course_id = wr.cs_course_id ORDER BY cpt.awarded_at DESC LIMIT 2) AS prestige_tags
    FROM with_ranks wr
  )
  SELECT
    wp.cs_course_id AS course_id,
    wp.cs_name AS course_name,
    wp.cs_country AS country,
    wp.cs_sub_country AS sub_country,
    wp.cs_thumbnail AS thumbnail_url,
    wp.cs_list_slug AS list_slug,
    wp.times_played,
    wp.avg_rating,
    wp.cs_global_rank AS global_rank,
    wp.cs_regional_rank AS regional_rank,
    wp.cs_usa_rank AS usa_rank,
    wp.friends_count,
    wp.friends_avg_rating,
    wp.shortlisted_count,
    wp.shortlisted_by_me,
    wp.unique_players,
    wp.computed_rank AS rank,
    wp.previous_rank,
    wp.rank_change,
    wp.is_trending,
    wp.is_hall_of_fame,
    wp.season_wins,
    wp.prestige_tags,
    COALESCE(wp.current_user_played, false) AS current_user_played,
    wp.current_user_rating,
    COALESCE(wp.current_user_play_count, 0) AS current_user_play_count
  FROM with_prestige wp
  WHERE (sort_param != 'friends' OR wp.friends_count > 0)
  ORDER BY wp.computed_rank
  LIMIT limit_param
  OFFSET offset_param;
END;
$function$;