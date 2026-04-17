
-- =========================================================================
-- FRONT PAGE LEADERBOARD TIEBREAKERS — FIX BRIEF 1 OF 3
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Top 100 seasonal — get_championship_leaderboard
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_scope text DEFAULT 'global'::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_club_id uuid DEFAULT NULL::uuid,
  p_country text DEFAULT NULL::text
)
RETURNS TABLE(user_id uuid, username text, display_name text, profile_photo_url text, home_club text, courses_logged integer, rank bigint, rank_change_today integer, rank_change_week integer, division_id text, division_name text, division_ring_color text, zone_type text, streak_days integer, is_active_streak boolean, last_activity_at timestamp with time zone, courses_to_next_division integer, is_friend boolean, is_rival boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_active_season_id uuid;
BEGIN
  SELECT id INTO v_active_season_id
  FROM championship_seasons
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;

  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.username,
    up.display_name,
    up.profile_photo_url,
    gc.name AS home_club,
    COALESCE(uss.courses_logged, 0)::integer AS courses_logged,
    ROW_NUMBER() OVER (
      ORDER BY
        COALESCE(uss.courses_logged, 0) DESC,
        COALESCE(uss.active_streak_days, 0) DESC,
        uss.last_activity_at DESC NULLS LAST,
        up.created_at ASC,
        up.id ASC
    ) AS rank,
    0::integer AS rank_change_today,
    0::integer AS rank_change_week,
    COALESCE(uss.current_division, 'rookie') AS division_id,
    dc.display_name AS division_name,
    dc.ring_color AS division_ring_color,
    NULL::text AS zone_type,
    COALESCE(uss.active_streak_days, 0)::integer AS streak_days,
    COALESCE(uss.active_streak_days, 0) > 0 AS is_active_streak,
    uss.last_activity_at,
    COALESCE(dc.threshold - COALESCE(uss.courses_logged, 0), 0)::integer AS courses_to_next_division,
    CASE WHEN p_current_user_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM user_follows uf
      WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
    ) ELSE FALSE END AS is_friend,
    FALSE AS is_rival
  FROM user_profiles up
  LEFT JOIN user_season_stats uss
    ON uss.user_id = up.id
    AND uss.season_id = v_active_season_id
  LEFT JOIN division_config dc ON dc.division_id = COALESCE(uss.current_division, 'rookie')
  LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
  WHERE
    CASE
      WHEN p_scope = 'country' AND p_country IS NOT NULL THEN
        gc.country = p_country
      WHEN p_scope = 'global' THEN TRUE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        up.id IN (
          SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_current_user_id
        ) OR up.id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN
        up.primary_club_id = p_club_id OR EXISTS (
          SELECT 1 FROM user_home_clubs uhc
          WHERE uhc.user_profile_id = up.id AND uhc.club_id = p_club_id
        )
      WHEN p_scope = 'division' THEN TRUE
      ELSE TRUE
    END
    AND COALESCE(uss.courses_logged, 0) > 0
  ORDER BY
    courses_logged DESC,
    COALESCE(uss.active_streak_days, 0) DESC,
    uss.last_activity_at DESC NULLS LAST,
    up.created_at ASC,
    up.id ASC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 2. Top 100 all-time — get_championship_leaderboard_alltime
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard_alltime(
  p_scope text DEFAULT 'global'::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_club_id uuid DEFAULT NULL::uuid,
  p_country text DEFAULT NULL::text
)
RETURNS TABLE(user_id uuid, username text, display_name text, profile_photo_url text, home_club text, total_courses bigint, rank bigint, is_friend boolean, is_rival boolean, current_division text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH lifetime_courses AS (
    SELECT
      cr.user_id,
      COUNT(DISTINCT cr.course_id) FILTER (
        WHERE EXISTS (SELECT 1 FROM course_top100_memberships t WHERE t.course_id = cr.course_id)
      ) AS top100_count,
      COUNT(*) AS total_ratings,
      MAX(cr.created_at) AS last_rating_at
    FROM course_ratings cr
    GROUP BY cr.user_id
  ),
  ranked_users AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      gc.name AS home_club,
      COALESCE(lc.top100_count, 0) AS total_courses,
      ROW_NUMBER() OVER (
        ORDER BY
          COALESCE(lc.top100_count, 0) DESC,
          COALESCE(lc.total_ratings, 0) DESC,
          lc.last_rating_at DESC NULLS LAST,
          up.created_at ASC,
          up.id ASC
      ) AS rank,
      EXISTS (
        SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = p_current_user_id AND uf.following_id = up.id
      ) AS is_friend,
      FALSE AS is_rival,
      COALESCE(
        (SELECT dc.division_id FROM division_config dc
         WHERE dc.threshold <= COALESCE(lc.top100_count, 0)
         ORDER BY dc.threshold DESC LIMIT 1),
        'rookie'
      ) AS current_division
    FROM user_profiles up
    LEFT JOIN lifetime_courses lc ON lc.user_id = up.id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE
      COALESCE(lc.top100_count, 0) > 0
      AND (
        CASE
          WHEN p_scope = 'global' THEN TRUE
          WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
            up.id IN (
              SELECT uf.following_id FROM user_follows uf
              WHERE uf.follower_id = p_current_user_id
            ) OR up.id = p_current_user_id
          WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN
            up.primary_club_id = p_club_id
            OR EXISTS (
              SELECT 1 FROM user_home_clubs uhc
              WHERE uhc.user_profile_id = up.id AND uhc.business_id = p_club_id
            )
          ELSE TRUE
        END
      )
  )
  SELECT
    ranked_users.user_id,
    ranked_users.username,
    ranked_users.display_name,
    ranked_users.profile_photo_url,
    ranked_users.home_club,
    ranked_users.total_courses,
    ranked_users.rank,
    ranked_users.is_friend,
    ranked_users.is_rival,
    ranked_users.current_division
  FROM ranked_users
  ORDER BY ranked_users.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 3. Global — get_exploration_leaderboard
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_exploration_leaderboard(
  p_scope text,
  p_metric text DEFAULT 'countries'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_club_id uuid DEFAULT NULL::uuid,
  p_country text DEFAULT NULL::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(rank bigint, user_id uuid, username text, display_name text, avatar_url text, countries_count integer, country_list text[], continents_count integer, continent_list text[], regions_count integer, region_list text[], courses_count bigint, home_club text, home_club_id uuid, is_friend boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_course_counts AS (
    SELECT cr.user_id, COUNT(*) AS total_courses
    FROM course_ratings cr
    GROUP BY cr.user_id
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
  ),
  ranked_users AS (
    SELECT
      ues.user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      ues.countries_played,
      ues.country_list,
      COALESCE(ues.continents_played, 0) AS continents_played,
      COALESCE(ues.continent_list, ARRAY[]::text[]) AS continent_list,
      COALESCE(ues.regions_completed, 0) AS regions_completed,
      COALESCE(ues.region_list, ARRAY[]::text[]) AS region_list,
      COALESCE(ucc.total_courses, 0) AS courses_count,
      gc.name AS home_club,
      gc.id AS home_club_id,
      up.primary_club_id,
      ROW_NUMBER() OVER (
        ORDER BY
          -- Primary metric (chosen by p_metric)
          CASE p_metric
            WHEN 'countries' THEN ues.countries_played
            WHEN 'continents' THEN COALESCE(ues.continents_played, 0)
            WHEN 'regions' THEN COALESCE(ues.regions_completed, 0)
            ELSE ues.countries_played
          END DESC,
          -- Tiebreaker 1: depth on the next dimension up
          CASE p_metric
            WHEN 'countries' THEN COALESCE(ues.continents_played, 0)
            WHEN 'continents' THEN ues.countries_played
            WHEN 'regions' THEN ues.countries_played
            ELSE COALESCE(ues.continents_played, 0)
          END DESC,
          -- Tiebreaker 2: depth on the third dimension
          CASE p_metric
            WHEN 'countries' THEN COALESCE(ues.regions_completed, 0)
            WHEN 'continents' THEN COALESCE(ues.regions_completed, 0)
            WHEN 'regions' THEN COALESCE(ues.continents_played, 0)
            ELSE COALESCE(ues.regions_completed, 0)
          END DESC,
          -- Tiebreaker 3: total engagement
          COALESCE(ucc.total_courses, 0) DESC,
          -- Tiebreaker 4: account age
          up.created_at ASC,
          -- Final deterministic resolver
          up.id ASC
      ) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    LEFT JOIN user_course_counts ucc ON ucc.user_id = ues.user_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE
      up.show_in_exploration_leaderboards = TRUE
      AND CASE p_metric
        WHEN 'countries' THEN ues.countries_played > 0
        WHEN 'continents' THEN COALESCE(ues.continents_played, 0) > 0
        WHEN 'regions' THEN COALESCE(ues.regions_completed, 0) > 0
        ELSE ues.countries_played > 0
      END
  )
  SELECT
    ru.rank,
    ru.user_id,
    ru.username,
    ru.display_name,
    ru.avatar_url,
    ru.countries_played::integer AS countries_count,
    ru.country_list,
    ru.continents_played::integer AS continents_count,
    ru.continent_list,
    ru.regions_completed::integer AS regions_count,
    ru.region_list,
    ru.courses_count,
    ru.home_club,
    ru.home_club_id,
    (p_current_user_id IS NOT NULL AND ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi)) AS is_friend
  FROM ranked_users ru
  WHERE
    CASE
      WHEN p_scope = 'friends' AND p_current_user_id IS NOT NULL THEN
        ru.user_id IN (SELECT fi.friend_id FROM friend_ids fi) OR ru.user_id = p_current_user_id
      WHEN p_scope = 'club' AND p_club_id IS NOT NULL THEN
        ru.primary_club_id = p_club_id
        OR ru.user_id IN (
          SELECT uhc.user_profile_id
          FROM user_home_clubs uhc
          WHERE uhc.club_id = p_club_id
        )
      ELSE TRUE
    END
  ORDER BY ru.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 4. Courses — get_course_leaderboard (8-arg overload)
--    Adds rating_count >= 3 gate ONLY for 'rating' sort.
--    Adds total_rounds tiebreaker for 'rating' sort.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_course_leaderboard(
  p_sort_by text DEFAULT 'rating'::text,
  p_sort_order text DEFAULT 'desc'::text,
  p_time_period text DEFAULT 'all_time'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL::text,
  p_sub_country text DEFAULT NULL::text
)
RETURNS TABLE(course_id uuid, course_name text, club_name text, country text, city text, region text, image_url text, avg_rating numeric, rating_count bigint, total_rounds bigint, rank bigint, rank_change integer, has_played boolean)
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
  WITH reviewed_courses AS (
    SELECT DISTINCT gc.id as course_id
    FROM golf_courses gc
    INNER JOIN course_ratings cr ON cr.course_id = gc.id
    WHERE cr.is_mock = false
      AND (p_country IS NULL OR gc.country = p_country)
      AND (p_sub_country IS NULL OR gc.sub_country = p_sub_country)
  ),
  course_stats AS (
    SELECT
      rc.course_id,
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds
    FROM reviewed_courses rc
    LEFT JOIN course_ratings cr ON cr.course_id = rc.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY rc.course_id
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
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
      END as rank
    FROM reviewed_courses rc
    INNER JOIN golf_courses gc ON gc.id = rc.course_id
    LEFT JOIN golf_clubs club ON club.id = gc.club_id
    INNER JOIN course_stats cs ON cs.course_id = rc.course_id
    -- Min-rating gate applies ONLY to the 'rating' sort
    WHERE (p_sort_by <> 'rating' OR cs.rating_count >= 3)
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
    0 as rank_change,
    CASE
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
        AND cr2.user_id = p_current_user_id
      )
    END as has_played
  FROM ranked_courses wrc
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 4b. Courses — get_course_leaderboard (9-arg overload with p_exclude_countries)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_course_leaderboard(
  p_sort_by text DEFAULT 'rating'::text,
  p_sort_order text DEFAULT 'desc'::text,
  p_time_period text DEFAULT 'all_time'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_country text DEFAULT NULL::text,
  p_sub_country text DEFAULT NULL::text,
  p_exclude_countries text[] DEFAULT NULL::text[]
)
RETURNS TABLE(course_id uuid, course_name text, club_name text, country text, city text, region text, image_url text, avg_rating numeric, rating_count bigint, total_rounds bigint, rank bigint, rank_change integer, has_played boolean)
LANGUAGE plpgsql
SECURITY DEFINER
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

  RETURN QUERY
  WITH reviewed_courses AS (
    SELECT DISTINCT gc.id as course_id
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
      COALESCE(AVG(cr.rating), 0) as avg_rating,
      COUNT(cr.id) as rating_count,
      COUNT(DISTINCT cr.id) as total_rounds
    FROM reviewed_courses rc
    LEFT JOIN course_ratings cr ON cr.course_id = rc.course_id
      AND (v_period_start IS NULL OR cr.created_at >= v_period_start)
      AND cr.is_mock = false
    GROUP BY rc.course_id
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
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
      END as rank
    FROM reviewed_courses rc
    INNER JOIN golf_courses gc ON gc.id = rc.course_id
    LEFT JOIN golf_clubs club ON club.id = gc.club_id
    INNER JOIN course_stats cs ON cs.course_id = rc.course_id
    -- Min-rating gate applies ONLY to the 'rating' sort
    WHERE (p_sort_by <> 'rating' OR cs.rating_count >= 3)
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
    0 as rank_change,
    CASE
      WHEN p_current_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.course_id = wrc.course_id
        AND cr2.user_id = p_current_user_id
      )
    END as has_played
  FROM ranked_courses wrc
  ORDER BY wrc.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 5. Handicap lowest — get_lowest_handicap_leaderboard
--    Tiebreaker uses recorded_at (matches existing index idx_handicap_history_user_date).
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lowest_handicap_leaderboard(
  p_scope text,
  p_current_user_id text DEFAULT NULL::text,
  p_club_id text DEFAULT NULL::text,
  p_country text DEFAULT NULL::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, handicap_index double precision, club_name text, country text, rank bigint, is_current_user boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      up.id,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index,
      gc.name,
      gc.country,
      ROW_NUMBER() OVER (
        ORDER BY
          up.eg_handicap_index ASC,
          (
            SELECT COUNT(*)
            FROM user_handicap_history uhh
            WHERE uhh.user_id = up.id
              AND uhh.recorded_at >= NOW() - INTERVAL '90 days'
          ) DESC,
          up.created_at ASC,
          up.id ASC
      ) AS rn
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
      AND (
        p_scope = 'global'
        OR (p_scope = 'club' AND p_club_id IS NOT NULL
            AND up.primary_club_id = p_club_id::uuid)
        OR (p_scope = 'friends' AND p_current_user_id IS NOT NULL
            AND (up.id IN (
              SELECT uf.following_id FROM user_follows uf
              WHERE uf.follower_id = p_current_user_id::uuid
            ) OR up.id = p_current_user_id::uuid))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  )
  SELECT r.id, r.display_name, r.profile_photo_url,
    r.eg_handicap_index, r.name, r.country, r.rn,
    (r.id = p_current_user_id::uuid)
  FROM ranked r
  ORDER BY r.rn
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- -------------------------------------------------------------------------
-- 6. Handicap similar window — get_similar_handicap_leaderboard
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_similar_handicap_leaderboard(
  p_target_handicap numeric,
  p_window_size integer DEFAULT 3,
  p_current_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(rank integer, user_id uuid, username text, display_name text, avatar_url text, handicap_index numeric, club_name text, is_current_user boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (
        ORDER BY
          up.eg_handicap_index ASC,
          (
            SELECT COUNT(*)
            FROM public.user_handicap_history uhh
            WHERE uhh.user_id = up.id
              AND uhh.recorded_at >= NOW() - INTERVAL '90 days'
          ) DESC,
          up.id ASC
      )::INTEGER AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      up.eg_handicap_index::NUMERIC AS handicap_index,
      gc.name AS club_name,
      (up.id = p_current_user_id) AS is_current_user
    FROM public.user_profiles up
    LEFT JOIN public.golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND up.is_public = TRUE
      AND up.show_handicap = TRUE
      AND up.show_in_handicap_leaderboards = TRUE
  ),
  centre AS (
    SELECT rank
    FROM ranked
    ORDER BY ABS(handicap_index - p_target_handicap) ASC, rank ASC
    LIMIT 1
  )
  SELECT r.rank, r.user_id, r.username, r.display_name, r.avatar_url, r.handicap_index, r.club_name, r.is_current_user
  FROM ranked r, centre c
  WHERE r.rank BETWEEN c.rank - p_window_size AND c.rank + p_window_size
  ORDER BY r.rank ASC;
$function$;
