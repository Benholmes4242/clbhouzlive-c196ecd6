BEGIN;

-- =====================================================================
-- A1: explore_courses_by_rating — aggregates view variant, DESC-only
-- =====================================================================
CREATE OR REPLACE FUNCTION public.explore_courses_by_rating(
  p_country text DEFAULT NULL::text,
  p_sub_country text DEFAULT NULL::text,
  p_search text DEFAULT NULL::text,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, name text, country text, region text, continent continent,
  latitude numeric, longitude numeric, global_rank integer, regional_rank integer,
  description text, thumbnail_image text, website_url text, top100_url text,
  created_at timestamp with time zone, updated_at timestamp with time zone,
  usa_rank integer, sub_country text, country_rank integer, club_id uuid,
  region_key text, course_type course_type, has_hosted_major boolean,
  major_championships text[], country_code character, average_rating numeric
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    gc.id, gc.name, gc.country, gc.region, gc.continent,
    gc.latitude, gc.longitude, gc.global_rank, gc.regional_rank,
    gc.description, gc.thumbnail_image, gc.website_url, gc.top100_url,
    gc.created_at, gc.updated_at, gc.usa_rank, gc.sub_country,
    gc.country_rank, gc.club_id, gc.region_key, gc.course_type,
    gc.has_hosted_major, gc.major_championships, gc.country_code,
    cra.avg_overall_score AS average_rating
  FROM public.golf_courses gc
  LEFT JOIN public.course_rating_aggregates cra ON cra.course_id = gc.id
  WHERE
    (p_country IS NULL OR gc.country = p_country)
    AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
    AND (p_search IS NULL OR gc.name ILIKE '%' || p_search || '%')
  ORDER BY
    COALESCE(cra.avg_overall_score, -1) DESC NULLS LAST,
    COALESCE(cra.review_count, 0) DESC,
    (
      COALESCE(cra.avg_design_score, 0) +
      COALESCE(cra.avg_condition_score, 0) +
      COALESCE(cra.avg_clubhouse_score, 0) +
      COALESCE(cra.avg_facilities_score, 0)
    ) DESC,
    gc.name ASC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- =====================================================================
-- A2: get_course_leaderboard — CTE variant, expand course_stats
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_course_leaderboard(
  p_sort_by text,
  p_sort_order text,
  p_time_period text,
  p_current_user_id uuid,
  p_limit integer,
  p_offset integer,
  p_country text,
  p_sub_country text,
  p_exclude_countries text[]
)
RETURNS TABLE(
  course_id uuid, course_name text, club_name text, country text, city text,
  region text, image_url text, avg_rating numeric, rating_count bigint,
  total_rounds bigint, rank bigint, rank_change integer, has_played boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_period_start timestamp with time zone;
  v_prev_capture_date DATE;
BEGIN
  IF p_time_period = 'week' THEN
    v_period_start := date_trunc('week', now());
  ELSIF p_time_period = 'month' THEN
    v_period_start := date_trunc('month', now());
  ELSIF p_time_period = 'year' THEN
    v_period_start := date_trunc('year', now());
  ELSIF p_time_period = 'season' THEN
    SELECT start_date INTO v_period_start
    FROM championship_seasons
    WHERE status = 'active'
    LIMIT 1;
    IF v_period_start IS NULL THEN
      v_period_start := date_trunc('year', now());
    END IF;
  ELSE
    v_period_start := NULL;
  END IF;

  SELECT MAX(ls.captured_at) INTO v_prev_capture_date
  FROM leaderboard_snapshots ls
  WHERE ls.surface = 'courses'
    AND ls.scope = p_sort_by
    AND ls.captured_at <= CURRENT_DATE - INTERVAL '7 days';

  RETURN QUERY
  WITH reviewed_courses AS (
    SELECT DISTINCT gc.id AS course_id
    FROM golf_courses gc
    INNER JOIN course_ratings cr ON cr.course_id = gc.id
    WHERE cr.is_mock = false
      AND (p_country IS NULL OR gc.country = p_country)
      AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
      AND (p_exclude_countries IS NULL OR gc.country IS NULL OR NOT (gc.country = ANY(p_exclude_countries)))
  ),
  course_stats AS (
    SELECT
      rc.course_id,
      COALESCE(AVG(cr.rating), 0) AS avg_rating,
      COUNT(cr.id) AS rating_count,
      COUNT(DISTINCT cr.id) AS total_rounds,
      COALESCE(AVG(cr.design_score), 0) AS avg_design,
      COALESCE(AVG(cr.condition_score), 0) AS avg_condition,
      COALESCE(AVG(cr.clubhouse_score), 0) AS avg_clubhouse,
      COALESCE(AVG(cr.facilities_score), 0) AS avg_facilities
    FROM reviewed_courses rc
    LEFT JOIN course_ratings cr ON cr.course_id = rc.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY rc.course_id
  ),
  ranked_courses AS (
    SELECT
      gc.id AS course_id,
      gc.name AS course_name,
      club.name AS club_name,
      gc.country,
      gc.sub_country AS city,
      gc.region,
      gc.thumbnail_image AS image_url,
      ROUND(cs.avg_rating, 2) AS avg_rating,
      cs.rating_count,
      cs.total_rounds,
      CASE
        WHEN p_sort_by = 'rating' THEN
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            gc.name ASC)
      END AS rank
    FROM reviewed_courses rc
    INNER JOIN golf_courses gc ON gc.id = rc.course_id
    LEFT JOIN golf_clubs club ON club.id = gc.club_id
    INNER JOIN course_stats cs ON cs.course_id = rc.course_id
    WHERE (p_sort_by <> 'rating' OR cs.rating_count >= 3)
  ),
  prev_snapshot AS (
    SELECT ls.entity_id, ls.rank AS prev_rank
    FROM leaderboard_snapshots ls
    WHERE ls.surface = 'courses'
      AND ls.scope = p_sort_by
      AND ls.captured_at = v_prev_capture_date
  )
  SELECT
    wrc.course_id,
    wrc.course_name,
    wrc.club_name,
    wrc.country,
    wrc.city,
    wrc.region,
    wrc.image_url,
    wrc.avg_rating,
    wrc.rating_count,
    wrc.total_rounds,
    wrc.rank,
    COALESCE((ps.prev_rank - wrc.rank)::integer, 0) AS rank_change,
    CASE
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
        AND cr2.user_id = p_current_user_id
      )
    END AS has_played
  FROM ranked_courses wrc
  LEFT JOIN prev_snapshot ps ON ps.entity_id = wrc.course_id
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- =====================================================================
-- A3: get_top100_course_leaderboard (7-arg) — CTE variant, expand course_stats
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  p_sort_by text DEFAULT 'rating'::text,
  p_sort_order text DEFAULT 'desc'::text,
  p_time_period text DEFAULT 'all_time'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL::text
)
RETURNS TABLE(
  course_id uuid, course_name text, club_name text, country text, city text,
  region text, image_url text, avg_rating numeric, rating_count bigint,
  total_rounds bigint, rank bigint, rank_change integer, has_played boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_period_start timestamp with time zone;
BEGIN
  IF p_time_period = 'week' THEN
    v_period_start := date_trunc('week', now());
  ELSIF p_time_period = 'month' THEN
    v_period_start := date_trunc('month', now());
  ELSIF p_time_period = 'year' THEN
    v_period_start := date_trunc('year', now());
  ELSE
    v_period_start := NULL;
  END IF;

  RETURN QUERY
  WITH top100_courses AS (
    SELECT DISTINCT gc.id as course_id
    FROM golf_courses gc
    INNER JOIN course_top100_memberships ctm ON ctm.course_id = gc.id
    WHERE (p_country IS NULL OR gc.country = p_country)
  ),
  course_stats AS (
    SELECT
      t.course_id,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds,
      COALESCE(AVG(cr.design_score), 0) as avg_design,
      COALESCE(AVG(cr.condition_score), 0) as avg_condition,
      COALESCE(AVG(cr.clubhouse_score), 0) as avg_clubhouse,
      COALESCE(AVG(cr.facilities_score), 0) as avg_facilities
    FROM top100_courses t
    LEFT JOIN course_ratings cr ON cr.course_id = t.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY t.course_id
  ),
  ranked_courses AS (
    SELECT
      gc.id as course_id,
      gc.name as course_name,
      club.name as club_name,
      gc.country,
      gc.sub_country as city,
      gc.region,
      gc.thumbnail_image as image_url,
      ROUND(cs.avg_rating, 2) as avg_rating,
      cs.rating_count,
      cs.total_rounds,
      CASE
        WHEN p_sort_by = 'rating' THEN
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            gc.name ASC)
      END as rank
    FROM top100_courses t
    INNER JOIN golf_courses gc ON gc.id = t.course_id
    LEFT JOIN golf_clubs club ON club.id = gc.club_id
    INNER JOIN course_stats cs ON cs.course_id = t.course_id
  ),
  with_rank_change AS (
    SELECT
      rc.*,
      COALESCE(
        (SELECT rc.rank::integer - crh.rank::integer
         FROM course_rank_history crh
         WHERE crh.course_id = rc.course_id
           AND crh.rank_type = p_sort_by
           AND crh.time_period = p_time_period
           AND crh.recorded_date < CURRENT_DATE
         ORDER BY crh.recorded_date DESC
         LIMIT 1),
        0
      ) as rank_change
    FROM ranked_courses rc
  )
  SELECT
    wrc.course_id,
    wrc.course_name,
    wrc.club_name,
    wrc.country,
    wrc.city,
    wrc.region,
    wrc.image_url,
    wrc.avg_rating,
    wrc.rating_count,
    wrc.total_rounds,
    wrc.rank,
    wrc.rank_change,
    CASE
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
        AND cr2.user_id = p_current_user_id
      )
    END as has_played
  FROM with_rank_change wrc
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- =====================================================================
-- A4: get_top100_course_leaderboard (8-arg) — full ROW_NUMBER refactor
-- Adds breakdown averages to course_stats and replaces the tangled
-- single ROW_NUMBER() with branched ordering supporting both directions
-- on the rating sort. Other sorts (most_played) preserve prior behaviour.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  p_sort_by text DEFAULT 'rating'::text,
  p_sort_order text DEFAULT 'desc'::text,
  p_time_period text DEFAULT 'all_time'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL::text,
  p_sub_country text DEFAULT NULL::text
)
RETURNS TABLE(
  course_id uuid, course_name text, club_name text, country text, city text,
  region text, image_url text, avg_rating numeric, rating_count bigint,
  total_rounds bigint, rank bigint, rank_change integer, has_played boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_time_filter timestamp with time zone;
BEGIN
  IF p_time_period = 'month' THEN
    v_time_filter := date_trunc('month', now());
  ELSIF p_time_period = 'year' THEN
    v_time_filter := date_trunc('year', now());
  ELSE
    v_time_filter := NULL;
  END IF;

  RETURN QUERY
  WITH course_stats AS (
    SELECT
      gc.id as course_id,
      gc.name as course_name,
      COALESCE(gclub.name, gc.name) as club_name,
      gc.country,
      gc.sub_country as city,
      gc.region,
      COALESCE(gc.thumbnail_image, '') as image_url,
      ROUND(AVG(cr.rating)::numeric, 2) as avg_rating,
      COUNT(DISTINCT cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds,
      COALESCE(AVG(cr.design_score), 0) as avg_design,
      COALESCE(AVG(cr.condition_score), 0) as avg_condition,
      COALESCE(AVG(cr.clubhouse_score), 0) as avg_clubhouse,
      COALESCE(AVG(cr.facilities_score), 0) as avg_facilities
    FROM golf_courses gc
    INNER JOIN course_top100_memberships ctm ON gc.id = ctm.course_id
    LEFT JOIN golf_clubs gclub ON gc.club_id = gclub.id
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id
      AND (v_time_filter IS NULL OR cr.created_at >= v_time_filter)
    WHERE
      (p_country IS NULL OR p_sub_country IS NOT NULL OR gc.country = p_country)
      AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
    GROUP BY gc.id, gc.name, gclub.name, gc.country, gc.sub_country, gc.region, gc.thumbnail_image
  ),
  ranked_courses AS (
    SELECT
      cs.*,
      CASE
        WHEN p_sort_by = 'rating' AND p_sort_order = 'asc' THEN
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating ASC NULLS LAST,
            cs.rating_count ASC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) ASC,
            cs.course_name ASC)
        WHEN p_sort_by = 'rating' THEN
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            cs.course_name ASC)
        WHEN p_sort_by = 'most_played' AND p_sort_order = 'asc' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds ASC NULLS LAST, cs.course_name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.course_name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY
            cs.avg_rating DESC NULLS LAST,
            cs.rating_count DESC NULLS LAST,
            (cs.avg_design + cs.avg_condition + cs.avg_clubhouse + cs.avg_facilities) DESC,
            cs.course_name ASC)
      END as rank
    FROM course_stats cs
  ),
  with_rank_change AS (
    SELECT
      rc.*,
      COALESCE(
        (SELECT rc.rank::integer - crh.rank::integer
         FROM course_rank_history crh
         WHERE crh.course_id = rc.course_id
           AND crh.rank_type = p_sort_by
           AND crh.time_period = p_time_period
         ORDER BY crh.recorded_at DESC
         LIMIT 1),
        0
      ) as rank_change
    FROM ranked_courses rc
  ),
  with_played_status AS (
    SELECT
      wrc.*,
      EXISTS(
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
          AND cr2.user_id = p_current_user_id
      ) as has_played
    FROM with_rank_change wrc
  )
  SELECT
    wps.course_id,
    wps.course_name,
    wps.club_name,
    wps.country,
    wps.city,
    wps.region,
    wps.image_url,
    wps.avg_rating,
    wps.rating_count,
    wps.total_rounds,
    wps.rank,
    wps.rank_change,
    wps.has_played
  FROM with_played_status wps
  ORDER BY wps.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- =====================================================================
-- A5: get_course_hall_of_fame — Highest Rated branch tiebreakers
-- HAVING clauses left untouched per scope.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_course_hall_of_fame()
RETURNS TABLE(
  course_id uuid, course_name text, location text, thumbnail_url text,
  lifetime_plays bigint, lifetime_avg_rating numeric, season_wins integer,
  hall_of_fame_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  -- Most Played (Top 3)
  (
    SELECT
      gc.id AS course_id,
      gc.name AS course_name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image AS thumbnail_url,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = gc.id AND cpt.tag_type = 'season_winner') AS season_wins,
      'most_played'::text AS hall_of_fame_category
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL
       OR gc.regional_rank IS NOT NULL
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    HAVING COUNT(cr.id) >= 1
    ORDER BY COUNT(cr.id) DESC, gc.name ASC
    LIMIT 3
  )
  UNION ALL
  -- Highest Rated (Top 3, min 1 rating)
  (
    SELECT
      gc.id AS course_id,
      gc.name AS course_name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image AS thumbnail_url,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = gc.id AND cpt.tag_type = 'season_winner') AS season_wins,
      'highest_rated'::text AS hall_of_fame_category
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL
       OR gc.regional_rank IS NOT NULL
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    HAVING COUNT(cr.id) >= 1
    ORDER BY
      AVG(cr.rating) DESC NULLS LAST,
      COUNT(cr.id) DESC,
      (
        COALESCE(AVG(cr.design_score), 0) +
        COALESCE(AVG(cr.condition_score), 0) +
        COALESCE(AVG(cr.clubhouse_score), 0) +
        COALESCE(AVG(cr.facilities_score), 0)
      ) DESC,
      gc.name ASC
    LIMIT 3
  );
END;
$function$;

COMMIT;