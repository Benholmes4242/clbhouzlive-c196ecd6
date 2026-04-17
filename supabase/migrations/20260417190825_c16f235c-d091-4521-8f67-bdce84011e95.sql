-- ============================================================================
-- Leaderboard Snapshot Infrastructure (Brief 2)
-- ============================================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  surface       TEXT      NOT NULL,
  scope         TEXT      NOT NULL,
  season_id     TEXT,
  entity_id     UUID      NOT NULL,
  rank          INTEGER   NOT NULL,
  metric_value  NUMERIC,
  captured_at   DATE      NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_snapshots_lookup
  ON public.leaderboard_snapshots
  (surface, scope, COALESCE(season_id, ''), captured_at, entity_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_date
  ON public.leaderboard_snapshots (surface, scope, captured_at);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_entity
  ON public.leaderboard_snapshots (entity_id, surface, scope, captured_at DESC);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
-- No policies: only SECURITY DEFINER functions (bypass RLS) may read/write.

-- ============================================================================
-- 2. Drop existing leaderboard RPCs we need to replace
-- (CREATE OR REPLACE cannot remove parameter defaults; explicit DROP required.)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_championship_leaderboard(text, integer, integer, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.get_course_leaderboard(text, text, text, uuid, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.get_course_leaderboard(text, text, text, uuid, integer, integer, text, text, text[]);

-- ============================================================================
-- 3. Recreate Top 100 seasonal with real rank_change_week
-- ============================================================================
CREATE FUNCTION public.get_championship_leaderboard(
  p_scope TEXT,
  p_limit INTEGER,
  p_offset INTEGER,
  p_current_user_id UUID,
  p_club_id UUID,
  p_country TEXT
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  home_club TEXT,
  courses_logged INTEGER,
  rank BIGINT,
  rank_change_today INTEGER,
  rank_change_week INTEGER,
  division_id TEXT,
  division_name TEXT,
  division_ring_color TEXT,
  zone_type TEXT,
  streak_days INTEGER,
  is_active_streak BOOLEAN,
  last_activity_at TIMESTAMPTZ,
  courses_to_next_division INTEGER,
  is_friend BOOLEAN,
  is_rival BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ============================================================================
-- 4. Recreate Courses leaderboard (9-arg) with real rank_change
-- ============================================================================
CREATE FUNCTION public.get_course_leaderboard(
  p_sort_by TEXT,
  p_sort_order TEXT,
  p_time_period TEXT,
  p_current_user_id UUID,
  p_limit INTEGER,
  p_offset INTEGER,
  p_country TEXT,
  p_sub_country TEXT,
  p_exclude_countries TEXT[]
)
RETURNS TABLE (
  course_id UUID,
  course_name TEXT,
  club_name TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  image_url TEXT,
  avg_rating NUMERIC,
  rating_count BIGINT,
  total_rounds BIGINT,
  rank BIGINT,
  rank_change INTEGER,
  has_played BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      COUNT(DISTINCT cr.id) AS total_rounds
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
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'most_played' THEN
          ROW_NUMBER() OVER (ORDER BY cs.total_rounds DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        WHEN p_sort_by = 'trending' THEN
          ROW_NUMBER() OVER (ORDER BY cs.rating_count DESC NULLS LAST, cs.avg_rating DESC NULLS LAST, gc.name ASC)
        ELSE
          ROW_NUMBER() OVER (ORDER BY cs.avg_rating DESC NULLS LAST, cs.rating_count DESC NULLS LAST, cs.total_rounds DESC NULLS LAST, gc.name ASC)
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
$$;

-- ============================================================================
-- 5. Capture functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.capture_top100_snapshot(p_season_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_snapshots
    (surface, scope, season_id, entity_id, rank, metric_value, captured_at)
  SELECT 'top100', 'seasonal', p_season_id, lb.user_id, lb.rank::INTEGER,
         lb.courses_logged::NUMERIC, CURRENT_DATE
  FROM public.get_championship_leaderboard('global', 500, 0, NULL, NULL, NULL) lb
  ON CONFLICT (surface, scope, COALESCE(season_id, ''), captured_at, entity_id) DO UPDATE
    SET rank = EXCLUDED.rank, metric_value = EXCLUDED.metric_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_top100_alltime_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_snapshots
    (surface, scope, season_id, entity_id, rank, metric_value, captured_at)
  SELECT 'top100', 'all_time', NULL, lb.user_id, lb.rank::INTEGER,
         lb.total_courses::NUMERIC, CURRENT_DATE
  FROM public.get_championship_leaderboard_alltime('global', 500, 0, NULL, NULL, NULL) lb
  ON CONFLICT (surface, scope, COALESCE(season_id, ''), captured_at, entity_id) DO UPDATE
    SET rank = EXCLUDED.rank, metric_value = EXCLUDED.metric_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_global_snapshot(p_metric TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_snapshots
    (surface, scope, season_id, entity_id, rank, metric_value, captured_at)
  SELECT 'global', p_metric, NULL, lb.user_id, lb.rank::INTEGER,
    CASE p_metric
      WHEN 'countries'  THEN lb.countries_count::NUMERIC
      WHEN 'continents' THEN lb.continents_count::NUMERIC
      WHEN 'regions'    THEN lb.regions_count::NUMERIC
      ELSE NULL
    END,
    CURRENT_DATE
  FROM public.get_exploration_leaderboard('global', p_metric, NULL, NULL, NULL, 500, 0) lb
  ON CONFLICT (surface, scope, COALESCE(season_id, ''), captured_at, entity_id) DO UPDATE
    SET rank = EXCLUDED.rank, metric_value = EXCLUDED.metric_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_courses_snapshot(p_sort TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_snapshots
    (surface, scope, season_id, entity_id, rank, metric_value, captured_at)
  SELECT 'courses', p_sort, NULL, lb.course_id, lb.rank::INTEGER,
    CASE p_sort
      WHEN 'rating'      THEN lb.avg_rating::NUMERIC
      WHEN 'most_played' THEN lb.total_rounds::NUMERIC
      WHEN 'trending'    THEN lb.rating_count::NUMERIC
      ELSE NULL
    END,
    CURRENT_DATE
  FROM public.get_course_leaderboard(p_sort, 'desc', 'all_time', NULL, 200, 0, NULL, NULL, NULL) lb
  ON CONFLICT (surface, scope, COALESCE(season_id, ''), captured_at, entity_id) DO UPDATE
    SET rank = EXCLUDED.rank, metric_value = EXCLUDED.metric_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_handicap_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_snapshots
    (surface, scope, season_id, entity_id, rank, metric_value, captured_at)
  SELECT 'handicap', 'global', NULL, lb.user_id, lb.rank::INTEGER,
         lb.handicap_index::NUMERIC, CURRENT_DATE
  FROM public.get_lowest_handicap_leaderboard('global', NULL, NULL, NULL, 500, 0) lb
  ON CONFLICT (surface, scope, COALESCE(season_id, ''), captured_at, entity_id) DO UPDATE
    SET rank = EXCLUDED.rank, metric_value = EXCLUDED.metric_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.capture_all_leaderboard_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_season_id TEXT;
BEGIN
  SELECT id::TEXT INTO v_current_season_id
  FROM championship_seasons
  WHERE status = 'active'
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_current_season_id IS NOT NULL THEN
    PERFORM public.capture_top100_snapshot(v_current_season_id);
  END IF;

  PERFORM public.capture_top100_alltime_snapshot();
  PERFORM public.capture_global_snapshot('countries');
  PERFORM public.capture_courses_snapshot('rating');
  PERFORM public.capture_handicap_snapshot();
END;
$$;

-- ============================================================================
-- 6. Retention / pruning
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prune_leaderboard_snapshots()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.leaderboard_snapshots
  WHERE captured_at < CURRENT_DATE - INTERVAL '90 days'
    AND EXTRACT(DAY FROM captured_at) <> 28
    AND captured_at >= CURRENT_DATE - INTERVAL '2 years';

  DELETE FROM public.leaderboard_snapshots
  WHERE captured_at < CURRENT_DATE - INTERVAL '2 years';
$$;

-- ============================================================================
-- 7. Cron scheduling (idempotent)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'leaderboard-snapshots-daily') THEN
    PERFORM cron.unschedule('leaderboard-snapshots-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'leaderboard-snapshots-prune') THEN
    PERFORM cron.unschedule('leaderboard-snapshots-prune');
  END IF;
END $$;

SELECT cron.schedule(
  'leaderboard-snapshots-daily',
  '0 4 * * *',
  $$ SELECT public.capture_all_leaderboard_snapshots(); $$
);

SELECT cron.schedule(
  'leaderboard-snapshots-prune',
  '0 5 * * 0',
  $$ SELECT public.prune_leaderboard_snapshots(); $$
);

-- ============================================================================
-- 8. Bootstrap baseline snapshot
-- ============================================================================
SELECT public.capture_all_leaderboard_snapshots();