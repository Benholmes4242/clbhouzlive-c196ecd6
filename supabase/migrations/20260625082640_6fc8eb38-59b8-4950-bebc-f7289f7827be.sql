
-- ============================================================
-- Handicap Privacy Phase 1
-- Route every cross-user handicap surface through the canonical
-- helpers can_view_handicap / can_appear_in_leaderboard.
-- ============================================================

-- ── TASK A ──────────────────────────────────────────────────
-- get_exploration_leaderboard: replace show_in_exploration_leaderboards
-- with the canonical predicate.
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
          CASE p_metric
            WHEN 'countries' THEN ues.countries_played
            WHEN 'continents' THEN COALESCE(ues.continents_played, 0)
            WHEN 'regions' THEN COALESCE(ues.regions_completed, 0)
            ELSE ues.countries_played
          END DESC,
          CASE p_metric
            WHEN 'countries' THEN COALESCE(ues.continents_played, 0)
            WHEN 'continents' THEN ues.countries_played
            WHEN 'regions' THEN ues.countries_played
            ELSE COALESCE(ues.continents_played, 0)
          END DESC,
          CASE p_metric
            WHEN 'countries' THEN COALESCE(ues.regions_completed, 0)
            WHEN 'continents' THEN COALESCE(ues.regions_completed, 0)
            WHEN 'regions' THEN COALESCE(ues.continents_played, 0)
            ELSE COALESCE(ues.regions_completed, 0)
          END DESC,
          COALESCE(ucc.total_courses, 0) DESC,
          up.created_at ASC,
          up.id ASC
      ) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    LEFT JOIN user_course_counts ucc ON ucc.user_id = ues.user_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE
      public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
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

-- nearby_golfers: keep the person, null the handicap NUMBER.
CREATE OR REPLACE FUNCTION public.nearby_golfers(
  me uuid,
  my_lat double precision,
  my_lng double precision,
  max_km double precision DEFAULT 10,
  only_open boolean DEFAULT false,
  visibility_filter text DEFAULT 'everyone'::text,
  limit_rows integer DEFAULT 30,
  offset_rows integer DEFAULT 0
)
 RETURNS TABLE(user_id uuid, display_name text, username text, profile_photo_url text, eg_handicap_index numeric, home_club text, distance_m double precision, open_to_play boolean, latitude double precision, longitude double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH me_point AS (
    SELECT ST_SetSRID(ST_MakePoint(my_lng, my_lat), 4326)::GEOGRAPHY AS g
  )
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.profile_photo_url,
    CASE WHEN public.can_view_handicap(me, p.id) THEN p.eg_handicap_index ELSE NULL END AS eg_handicap_index,
    p.home_club,
    ST_Distance(n.location, (SELECT g FROM me_point)) AS distance_m,
    n.open_to_play,
    ST_Y(n.location::geometry) AS latitude,
    ST_X(n.location::geometry) AS longitude
  FROM public.user_nearby_status n
  JOIN public.user_profiles p ON p.id = n.user_id
  WHERE
    n.location IS NOT NULL
    AND n.last_location_update IS NOT NULL
    AND n.last_location_update > (now() - interval '5 minutes')
    AND (
      visibility_filter = 'all'
      OR (visibility_filter = 'everyone' AND COALESCE(n.visibility_mode, 'everyone') = 'everyone')
      OR (
        visibility_filter = 'friends'
        AND EXISTS (
          SELECT 1 FROM public.user_follows f
          WHERE (f.follower_id = me AND f.following_id = n.user_id)
             OR (f.follower_id = n.user_id AND f.following_id = me)
        )
      )
    )
    AND (NOT only_open OR n.open_to_play = true)
    AND ST_DWithin(n.location, (SELECT g FROM me_point), max_km * 1000)
    AND n.user_id <> COALESCE(me, '00000000-0000-0000-0000-000000000000'::UUID)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE
        (b.blocker_id = me AND b.blocked_id = n.user_id)
        OR
        (b.blocker_id = n.user_id AND b.blocked_id = me)
    )
  ORDER BY distance_m ASC
  LIMIT limit_rows OFFSET offset_rows;
$function$;

-- get_championship_leaderboard_alltime: add the predicate (was unfiltered).
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
      AND public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
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

-- get_lowest_handicap_leaderboard: replace two flag checks with one predicate.
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
      AND public.can_appear_in_leaderboard(p_current_user_id::uuid, up.id, 'global')
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

-- get_similar_handicap_leaderboard: replace is_public/show_handicap/show_in flags.
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
      AND public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
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

-- get_handicap_improvement_leaderboard: replace flag checks with predicate.
CREATE OR REPLACE FUNCTION public.get_handicap_improvement_leaderboard(
  p_scope text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_club_id text DEFAULT NULL::text,
  p_country text DEFAULT NULL::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(user_id uuid, username text, display_name text, profile_photo_url text, current_handicap numeric, previous_handicap numeric, improvement numeric, primary_club_id uuid, club_name text, rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      (
        SELECT uhh.handicap_index
        FROM user_handicap_history uhh
        WHERE uhh.user_id = up.id
          AND uhh.recorded_at <= NOW() - INTERVAL '30 days'
        ORDER BY uhh.recorded_at DESC
        LIMIT 1
      ) AS previous_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE up.eg_handicap_index IS NOT NULL
      AND public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.previous_handicap,
      (ui.previous_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.previous_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.previous_handicap IS NOT NULL
      AND ui.previous_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- get_season_improvement_leaderboard: replace flag checks with predicate.
CREATE OR REPLACE FUNCTION public.get_season_improvement_leaderboard(
  p_scope text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_club_id text DEFAULT NULL::text,
  p_country text DEFAULT NULL::text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(user_id uuid, username text, display_name text, profile_photo_url text, current_handicap numeric, season_start_handicap numeric, improvement numeric, primary_club_id uuid, club_name text, rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_improvements AS (
    SELECT
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url,
      up.eg_handicap_index AS current_handicap,
      ssh.season_start_handicap,
      up.primary_club_id,
      gc.club_name
    FROM user_profiles up
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    LEFT JOIN user_season_start_handicaps ssh ON ssh.user_id = up.id
    WHERE up.eg_handicap_index IS NOT NULL
      AND public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
      AND ssh.season_start_handicap IS NOT NULL
      AND (
        p_scope = 'global'
        OR (p_scope = 'clubs' AND (
          up.primary_club_id = p_club_id::UUID
          OR EXISTS (
            SELECT 1 FROM user_home_clubs uhc
            WHERE uhc.user_profile_id = up.id
              AND uhc.club_id = p_club_id::UUID
          )
        ))
        OR (p_scope = 'country' AND gc.country = p_country)
      )
  ),
  ranked AS (
    SELECT
      ui.user_id,
      ui.username,
      ui.display_name,
      ui.profile_photo_url,
      ui.current_handicap,
      ui.season_start_handicap,
      (ui.season_start_handicap - ui.current_handicap) AS improvement,
      ui.primary_club_id,
      ui.club_name,
      ROW_NUMBER() OVER (ORDER BY (ui.season_start_handicap - ui.current_handicap) DESC NULLS LAST) AS rank
    FROM user_improvements ui
    WHERE ui.season_start_handicap > ui.current_handicap
  )
  SELECT * FROM ranked
  ORDER BY ranked.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- get_countries_leaderboard: replace show_in_exploration flag.
CREATE OR REPLACE FUNCTION public.get_countries_leaderboard(
  p_scope text DEFAULT 'global'::text,
  p_current_user_id uuid DEFAULT NULL::uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
 RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text, countries_count integer, country_list text[], courses_count bigint, home_club text, rank bigint, is_friend boolean)
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
  ranked_users AS (
    SELECT
      ues.user_id,
      up.display_name,
      up.username,
      up.profile_photo_url AS avatar_url,
      ues.countries_played AS countries_count,
      ues.country_list,
      COALESCE(ucc.total_courses, 0) AS courses_count,
      gc.name AS home_club,
      ROW_NUMBER() OVER (ORDER BY ues.countries_played DESC, ues.updated_at ASC) AS rank
    FROM user_exploration_stats ues
    JOIN user_profiles up ON up.id = ues.user_id
    LEFT JOIN user_course_counts ucc ON ucc.user_id = ues.user_id
    LEFT JOIN golf_clubs gc ON gc.id = up.primary_club_id
    WHERE ues.countries_played > 0
      AND public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
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
    ru.courses_count,
    ru.home_club,
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
$function$;

-- get_regions_leaderboard: replace is_public flag with the predicate.
CREATE OR REPLACE FUNCTION public.get_regions_leaderboard(
  p_scope text DEFAULT 'global'::text,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_current_user_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(rank bigint, user_id uuid, username text, display_name text, avatar_url text, regions_count integer, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_friends_cte AS (
    SELECT
      CASE
        WHEN uf.user_id = p_current_user_id THEN uf.friend_id
        ELSE uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE uf.status = 'accepted'
      AND (uf.user_id = p_current_user_id OR uf.friend_id = p_current_user_id)
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY ues.regions_completed DESC, up.created_at ASC) AS rank,
      up.id AS user_id,
      up.username,
      up.display_name,
      up.profile_photo_url AS avatar_url,
      COALESCE(ues.regions_completed, 0) AS regions_count
    FROM user_profiles up
    LEFT JOIN user_exploration_stats ues ON ues.user_id = up.id
    WHERE public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
      AND (
        p_scope = 'global'
        OR (p_scope = 'friends' AND (up.id IN (SELECT friend_id FROM user_friends_cte) OR up.id = p_current_user_id))
      )
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.regions_count::integer,
    (r.user_id = p_current_user_id) AS is_current_user
  FROM ranked r
  ORDER BY r.rank
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- ── TASK B ──────────────────────────────────────────────────
-- get_championship_leaderboard: filter at READ time inside the
-- live row source so privacy changes are instant.
CREATE OR REPLACE FUNCTION public.get_championship_leaderboard(
  p_scope text,
  p_limit integer,
  p_offset integer,
  p_current_user_id uuid,
  p_club_id uuid,
  p_country text
)
 RETURNS TABLE(user_id uuid, username text, display_name text, profile_photo_url text, home_club text, courses_logged integer, rank bigint, rank_change_today integer, rank_change_week integer, division_id text, division_name text, division_ring_color text, zone_type text, streak_days integer, is_active_streak boolean, last_activity_at timestamp with time zone, courses_to_next_division integer, is_friend boolean, is_rival boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_active_season_id uuid;
  v_prev_capture_date DATE;
BEGIN
  SELECT id INTO v_active_season_id
  FROM championship_seasons
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;

  SELECT MAX(ls.captured_at) INTO v_prev_capture_date
  FROM leaderboard_snapshots ls
  WHERE ls.surface = 'top100'
    AND ls.scope = 'seasonal'
    AND ls.season_id = v_active_season_id::TEXT
    AND ls.captured_at <= CURRENT_DATE - INTERVAL '7 days';

  RETURN QUERY
  WITH current_ranked AS (
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
      public.can_appear_in_leaderboard(p_current_user_id, up.id, 'global')
      AND CASE
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
  ),
  prev_snapshot AS (
    SELECT ls.entity_id, ls.rank AS prev_rank
    FROM leaderboard_snapshots ls
    WHERE ls.surface = 'top100'
      AND ls.scope = 'seasonal'
      AND ls.season_id = v_active_season_id::TEXT
      AND ls.captured_at = v_prev_capture_date
  )
  SELECT
    cr.user_id,
    cr.username,
    cr.display_name,
    cr.profile_photo_url,
    cr.home_club,
    cr.courses_logged,
    cr.rank,
    0::integer AS rank_change_today,
    COALESCE((ps.prev_rank - cr.rank)::integer, 0) AS rank_change_week,
    cr.division_id,
    cr.division_name,
    cr.division_ring_color,
    cr.zone_type,
    cr.streak_days,
    cr.is_active_streak,
    cr.last_activity_at,
    cr.courses_to_next_division,
    cr.is_friend,
    cr.is_rival
  FROM current_ranked cr
  LEFT JOIN prev_snapshot ps ON ps.entity_id = cr.user_id
  ORDER BY cr.rank
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- NOTE: get_course_leaderboard ranks COURSES, not users — it does
-- not join user_profiles and emits no per-user handicap or identity.
-- No can_appear_in_leaderboard filter is applicable; intentionally
-- left unchanged.

-- ── TASK C ──────────────────────────────────────────────────
-- get_friends_feed: null the handicap NUMBER unless visible.
-- (get_explore_feed does not return a handicap column, so it is
-- not modified — no surface to gate.)
CREATE OR REPLACE FUNCTION public.get_friends_feed(
  p_user_id uuid,
  p_mode text DEFAULT 'latest'::text,
  p_page_size integer DEFAULT 15,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text,
  p_viewer_actor_type text DEFAULT 'personal'::text,
  p_viewer_actor_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, review_course_region text, review_course_country text, review_course_sub_country text, course_region text, course_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, review_text text, post_tags jsonb, course_id uuid, course_name text, course_thumbnail_image text, course_latitude double precision, course_longitude double precision, course_global_rank integer, creator_handicap_index numeric, creator_show_handicap boolean, creator_home_club text, creator_home_club_visibility text, review_design_score numeric, review_condition_score numeric, review_facilities_score numeric, review_clubhouse_score numeric, course_avg_overall_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_mode TEXT := p_mode;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_search_query TEXT := p_search_query;
  v_search_pattern TEXT := NULL;
  v_viewer_actor_type TEXT := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id UUID := COALESCE(p_viewer_actor_id, p_user_id);
BEGIN
  IF v_search_query IS NOT NULL AND v_search_query <> '' THEN
    v_search_pattern := '%' || lower(v_search_query) || '%';
  END IF;

  RETURN QUERY
  WITH social_graph AS (
    SELECT uf.friend_id AS target_user_id, 'personal'::TEXT AS target_type, 'friend'::TEXT AS rel
    FROM user_friends uf WHERE uf.user_id = v_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id, 'personal'::TEXT, 'friend'::TEXT
    FROM user_friends uf2 WHERE uf2.friend_id = v_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id, 'personal'::TEXT, 'following'::TEXT
    FROM user_follows ufl WHERE ufl.follower_id = v_user_id
    UNION
    SELECT bf.business_id, 'business'::TEXT, 'following'::TEXT
    FROM business_follows bf WHERE bf.follower_id = v_user_id
  ),
  blocked_users AS (
    SELECT blocked_id FROM user_blocks WHERE blocker_id = v_user_id
    UNION
    SELECT blocker_id FROM user_blocks WHERE blocked_id = v_user_id
  ),
  candidates AS (
    SELECT
      p.id, p.content, p.created_at, p.user_id, p.actor_type, p.actor_id,
      p.status, p.source_review_id, p.course_id,
      COALESCE(p.like_count, 0)::bigint AS plc,
      COALESCE(p.comment_count, 0)::bigint AS pcc,
      0::bigint AS psc,
      sg.rel AS sg_rel,
      ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) AS creator_rank,
      (COALESCE(p.like_count, 0) * 3.0 + COALESCE(p.comment_count, 0) * 5.0)
        * EXP(-0.08 * EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0)
        AS score
    FROM posts p
    JOIN social_graph sg ON (
      (sg.target_type = 'personal' AND sg.target_user_id = p.user_id)
      OR (sg.target_type = 'business' AND sg.target_user_id = p.actor_id AND p.actor_type = 'business')
    )
    WHERE p.visibility = 'anyone'
      AND p.status = 'published'
      AND p.created_at > NOW() - INTERVAL '90 days'
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND p.id <> ALL(v_seen_post_ids)
      AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users)
      AND (
        v_search_pattern IS NULL
        OR lower(COALESCE(p.content, '')) LIKE v_search_pattern
        OR lower(COALESCE((SELECT up.display_name FROM user_profiles up WHERE up.id = p.user_id), '')) LIKE v_search_pattern
      )
  ),
  scored AS (
    SELECT
      c.*,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, NULL::text AS pm_stream_id,
      pm.duration_ms::numeric / 1000.0 AS pm_duration,
      pm.width AS pm_width, pm.height AS pm_height, pm.display_order AS pm_display_order
    FROM candidates c
    LEFT JOIN post_media pm ON pm.post_id = c.id
  )
  SELECT
    s.id, s.content, s.created_at, s.user_id,
    COALESCE(s.actor_type, 'personal'), s.actor_id, s.status, s.source_review_id,
    s.pm_id, s.pm_media_type, s.pm_media_url, s.pm_poster_url, s.pm_stream_id,
    s.pm_duration, s.pm_width, s.pm_height, s.pm_display_order,
    up.username, up.display_name, up.profile_photo_url,
    COALESCE(up.is_verified, false),
    ba.name, ba.logo_url, COALESCE(ba.is_verified, false),
    s.plc, s.pcc, s.psc,
    cr.rating, gc_review.id, gc_review.name, gc_review.thumbnail_image,
    gc_review.region, gc_review.country, gc_review.sub_country,
    gc_course.region, gc_course.country,
    COALESCE(s.sg_rel, 'none'),
    EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = s.id AND pl2.user_id = v_user_id),
    public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, s.actor_type, s.actor_id, s.user_id),
    s.score, cr.review,
    public.get_post_tags_jsonb(s.id),
    s.course_id, gc_course.name, gc_course.thumbnail_image,
    gc_course.latitude::double precision, gc_course.longitude::double precision,
    gc_course.global_rank,
    CASE WHEN public.can_view_handicap(v_user_id, s.user_id) THEN up.eg_handicap_index::numeric ELSE NULL END,
    COALESCE(up.show_handicap, true),
    up.home_club, COALESCE(up.home_club_visibility, 'public'),
    cr.design_score, cr.condition_score, cr.facilities_score, cr.clubhouse_score,
    cra.avg_overall_score
  FROM scored s
  LEFT JOIN user_profiles up ON up.id = s.user_id
  LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
  LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
  LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
  LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = COALESCE(cr.course_id, s.course_id)
  WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
  ORDER BY
    CASE WHEN v_mode = 'popular' THEN s.score END DESC NULLS LAST,
    s.created_at DESC
  LIMIT v_page_size;
END;
$function$;

-- ── TASK D ──────────────────────────────────────────────────
-- public_profiles view: route the handicap null-gate through can_view_handicap.
CREATE OR REPLACE VIEW public.public_profiles AS
 SELECT id,
    username,
    display_name,
    first_name,
    last_name,
    bio,
    profile_photo_url,
    background_image_url,
    cover_photo_url,
    header_photo_url,
    profile_video_url,
    profile_video_thumbnail_url,
    actor_type,
    user_type,
    profile_type,
    is_public,
    is_verified,
    is_verified_golfer,
    is_official_club,
    is_business_verified,
    is_verified_business,
    home_club,
    home_club_id,
    home_club_business_id,
    primary_club_id,
    college_id,
    city,
    country,
    instagram_handle,
    tiktok_handle,
    twitter_handle,
    youtube_handle,
    website_url,
    websites,
    social_links,
    created_at,
    CASE
        WHEN public.can_view_handicap(auth.uid(), p.id) THEN eg_handicap_index
        ELSE NULL::double precision
    END AS eg_handicap_index,
    CASE
        WHEN public.can_view_handicap(auth.uid(), p.id) THEN manual_handicap_index
        ELSE NULL::numeric
    END AS manual_handicap_index
   FROM user_profiles p
  WHERE COALESCE(is_public, true) = true
    AND deleted_at IS NULL
    AND COALESCE(is_suspended, false) = false
    AND email_confirmed = true;
