CREATE OR REPLACE FUNCTION public.get_share_prompt_candidates(p_day_start timestamptz)
RETURNS TABLE (
  notif_id uuid,
  notif_type text,
  category text,
  whs_score_id uuid,
  course_id uuid,
  course_name text,
  course_country text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_enabled numeric;
  v_contested_only numeric;
  v_daily_cap numeric;
  v_window_hours numeric;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT value INTO v_enabled FROM public.feed_config WHERE key = 'cs_share_prompt_enabled';
  IF COALESCE(v_enabled, 0) <> 1 THEN
    RETURN;
  END IF;

  SELECT value INTO v_contested_only FROM public.feed_config WHERE key = 'cs_share_contested_only';
  SELECT value INTO v_daily_cap FROM public.feed_config WHERE key = 'cs_share_daily_cap';
  SELECT value INTO v_window_hours FROM public.feed_config WHERE key = 'cs_share_window_hours';

  v_contested_only := COALESCE(v_contested_only, 1);
  v_daily_cap := COALESCE(v_daily_cap, 1);
  v_window_hours := COALESCE(v_window_hours, 48);

  RETURN QUERY
  WITH base AS (
    SELECT
      n.id AS notif_id,
      n.type AS notif_type,
      NULLIF(n.data->>'category', '') AS category,
      NULLIF(n.data->>'course_id', '')::uuid AS course_id,
      NULLIF(n.data->>'whs_score_id', '')::uuid AS badge_score_id,
      n.created_at
    FROM public.notifications n
    WHERE n.user_id = v_user
      AND n.type IN ('legend_earned', 'badge_earned')
      AND COALESCE(n.is_deleted, false) = false
      AND n.created_at >= now() - make_interval(hours => v_window_hours::int)
      AND n.created_at >= p_day_start
  ),
  enriched AS (
    SELECT
      b.*,
      CASE
        WHEN b.notif_type = 'badge_earned' THEN b.badge_score_id
        ELSE (
          SELECT gcl.trigger_whs_score_id
          FROM public.gam_course_legends gcl
          WHERE gcl.user_id = v_user
            AND gcl.course_id = b.course_id
            AND gcl.category = b.category
          ORDER BY gcl.attained_at DESC
          LIMIT 1
        )
      END AS score_id,
      CASE
        WHEN b.notif_type = 'badge_earned' THEN true
        ELSE EXISTS (
          SELECT 1
          FROM public.notifications l
          WHERE l.type = 'legend_lost'
            AND (l.data->>'taken_by')::uuid = v_user
            AND NULLIF(l.data->>'course_id', '')::uuid = b.course_id
            AND l.data->>'category' = b.category
            AND l.created_at BETWEEN b.created_at - interval '10 minutes'
                                 AND b.created_at + interval '10 minutes'
        )
      END AS contested,
      CASE
        WHEN b.notif_type = 'badge_earned' THEN true
        ELSE COALESCE(
          (SELECT fc.value FROM public.feed_config fc WHERE fc.key = 'cs_cat_' || b.category),
          0
        ) = 1
      END AS category_enabled
    FROM base b
  ),
  qualified AS (
    SELECT
      e.*,
      CASE
        WHEN e.notif_type = 'badge_earned' THEN 90
        WHEN e.category LIKE 'most_albatrosses%' THEN 1
        WHEN e.category LIKE 'most_aces%' THEN 2
        WHEN e.category LIKE 'lowest_gross%' THEN 3
        WHEN e.category LIKE 'most_eagles%' THEN 4
        WHEN e.category LIKE 'best_score_diff%' THEN 5
        WHEN e.category LIKE 'best_stableford%' THEN 6
        WHEN e.category LIKE 'most_birdies%' THEN 7
        ELSE 80
      END AS priority
    FROM enriched e
    WHERE e.score_id IS NOT NULL
      AND e.category_enabled
      AND (v_contested_only <> 1 OR e.contested)
  )
  SELECT
    q.notif_id,
    q.notif_type,
    q.category,
    q.score_id,
    COALESCE(q.course_id, s.course_id) AS course_id,
    gc.name AS course_name,
    gc.country AS course_country,
    q.created_at
  FROM qualified q
  LEFT JOIN public.whs_scores s ON s.id = q.score_id
  LEFT JOIN public.golf_courses gc ON gc.id = COALESCE(q.course_id, s.course_id)
  WHERE COALESCE(q.course_id, s.course_id) IS NOT NULL
  ORDER BY q.priority ASC, q.created_at DESC
  LIMIT GREATEST(v_daily_cap::int, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_share_prompt_candidates(timestamptz) TO authenticated;