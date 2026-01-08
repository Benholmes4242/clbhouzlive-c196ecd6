-- RPC: insert_leaderboard_milestones(milestones jsonb)
-- Batch insert milestones with deduplication, enforces user_id = auth.uid()

CREATE OR REPLACE FUNCTION public.insert_leaderboard_milestones(milestones jsonb)
RETURNS TABLE(inserted_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inserted integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF milestones IS NULL OR jsonb_typeof(milestones) <> 'array' THEN
    RAISE EXCEPTION 'milestones must be a JSON array';
  END IF;

  WITH payload AS (
    SELECT
      v_uid AS user_id,
      (elem->>'milestone_type')::milestone_type       AS milestone_type,
      (elem->>'rank_scope')::leaderboard_scope        AS rank_scope,
      (elem->>'time_range')::leaderboard_time_range   AS time_range,
      NULLIF(elem->>'rank_value','')::integer         AS rank_value,
      NULLIF(elem->>'rank_delta','')::integer         AS rank_delta,
      NULLIF(elem->>'rivals_overtaken','')::integer   AS rivals_overtaken,
      NULLIF(elem->>'percentile','')::integer         AS percentile,
      NULLIF(elem->>'season_id','')::uuid             AS season_id,
      NULLIF(elem->>'season_key','')::text            AS season_key,
      NULLIF(elem->>'dedupe_key','')::text            AS dedupe_key
    FROM jsonb_array_elements(milestones) AS elem
  ),
  validated AS (
    SELECT *
    FROM payload
    WHERE dedupe_key IS NOT NULL
      AND rank_value IS NOT NULL
      AND rank_value > 0
      AND (rivals_overtaken IS NULL OR rivals_overtaken >= 0)
      AND (percentile IS NULL OR (percentile >= 1 AND percentile <= 100))
  ),
  ins AS (
    INSERT INTO public.leaderboard_milestones (
      user_id, milestone_type, rank_scope, time_range,
      rank_value, rank_delta, rivals_overtaken, percentile,
      season_id, season_key, dedupe_key
    )
    SELECT
      user_id, milestone_type, rank_scope, time_range,
      rank_value, rank_delta, rivals_overtaken, percentile,
      season_id, season_key, dedupe_key
    FROM validated
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM ins;

  RETURN QUERY SELECT v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_leaderboard_milestones(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_leaderboard_milestones(jsonb) TO authenticated;

COMMENT ON FUNCTION public.insert_leaderboard_milestones(jsonb)
IS 'Safely inserts milestone events for the current user from a JSON array. Ignores duplicates via dedupe_key.';


-- RPC: get_season_recap(season_key_param text, scope_param leaderboard_scope)
-- Returns JSON recap for monthly season

CREATE OR REPLACE FUNCTION public.get_season_recap(
  season_key_param text,
  scope_param leaderboard_scope DEFAULT 'global'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_start date;
  v_end date;
  v_payload jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF season_key_param !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'season_key must be YYYY-MM';
  END IF;

  v_start := (season_key_param || '-01')::date;
  v_end := (v_start + INTERVAL '1 month')::date;

  WITH
  courses AS (
    SELECT
      COUNT(DISTINCT cr.course_id)::int AS courses_logged
    FROM public.course_ratings cr
    JOIN public.course_top100_memberships ctm ON ctm.course_id = cr.course_id
    JOIN public.top100_lists t ON t.id = ctm.list_id
    WHERE cr.user_id = v_uid
      AND cr.rating IS NOT NULL
      AND cr.is_mock = false
      AND cr.created_at >= v_start
      AND cr.created_at < v_end
      AND t.slug IN ('global','gb-i','europe','usa')
  ),
  ms AS (
    SELECT *
    FROM public.leaderboard_milestones
    WHERE user_id = v_uid
      AND season_key = season_key_param
      AND rank_scope = scope_param
  ),
  ms_summary AS (
    SELECT
      COUNT(*)::int AS milestones_count,
      COALESCE(SUM(COALESCE(rivals_overtaken,0)),0)::int AS rivals_overtaken_total,
      COALESCE(MAX(CASE WHEN milestone_type='fast_climber' THEN rank_delta END), 0)::int AS biggest_climb,
      COALESCE(MIN(CASE WHEN milestone_type='new_personal_best' THEN rank_value END), NULL) AS best_rank_value,
      COALESCE(MAX(CASE WHEN milestone_type='entered_rank_tier' THEN rank_value END), NULL) AS top_tier_reached
    FROM ms
  ),
  highlights AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', milestone_type::text,
        'rank_value', rank_value,
        'rank_delta', rank_delta,
        'rivals_overtaken', rivals_overtaken,
        'percentile', percentile,
        'time_range', time_range::text,
        'created_at', created_at
      )
      ORDER BY created_at DESC
    ) AS items
    FROM (
      SELECT * FROM ms ORDER BY created_at DESC LIMIT 6
    ) x
  )
  SELECT jsonb_build_object(
    'season_key', season_key_param,
    'scope', scope_param::text,
    'season_start', v_start,
    'season_end', v_end,
    'courses_logged', (SELECT courses_logged FROM courses),
    'milestones', jsonb_build_object(
      'count', (SELECT milestones_count FROM ms_summary),
      'rivals_overtaken_total', (SELECT rivals_overtaken_total FROM ms_summary),
      'biggest_climb', (SELECT biggest_climb FROM ms_summary),
      'best_rank', (SELECT best_rank_value FROM ms_summary),
      'top_tier_reached', (SELECT top_tier_reached FROM ms_summary)
    ),
    'highlights', COALESCE((SELECT items FROM highlights), '[]'::jsonb),
    'share_line', (
      'In ' || season_key_param || ', you logged ' ||
      COALESCE((SELECT courses_logged FROM courses),0)::text ||
      ' Top 100 courses.'
    )
  ) INTO v_payload;

  RETURN v_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.get_season_recap(text, leaderboard_scope) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_season_recap(text, leaderboard_scope) TO authenticated;

COMMENT ON FUNCTION public.get_season_recap(text, leaderboard_scope)
IS 'Returns a single JSON recap payload for the authenticated user for a monthly season_key (YYYY-MM) and scope.';