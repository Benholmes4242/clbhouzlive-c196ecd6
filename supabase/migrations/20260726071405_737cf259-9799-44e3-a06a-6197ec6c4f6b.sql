-- Indexes to support the date floors in get_week_in_golf
CREATE INDEX IF NOT EXISTS whs_scores_capture_date_idx
  ON public.whs_scores (capture_date DESC);

CREATE INDEX IF NOT EXISTS gam_notif_outbox_type_created_idx
  ON public.gam_notification_outbox (notification_type, created_at DESC);

CREATE INDEX IF NOT EXISTS gam_notif_outbox_legend_lost_idx
  ON public.gam_notification_outbox (created_at DESC)
  WHERE notification_type = 'legend_lost';

-- Canonical, version-controlled definition.
-- Fix: all_events / gated are MATERIALIZED so the UNION (and its correlated
-- legend_lost subplan) is evaluated ONCE instead of being re-executed per
-- eligible user_profiles row (previously 29 loops -> 17.9M shared buffers).
-- Every branch keeps a date floor at c_fallback so nothing older than the
-- fallback window can reach the output.
CREATE OR REPLACE FUNCTION public.get_week_in_golf(p_limit integer DEFAULT 12, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(event_type text, rarity integer, occurred_at timestamp with time zone, user_id uuid, username text, display_name text, avatar_url text, line1 text, line2 text, course_id uuid, course_region text, course_country text, window_days integer, event_key text, reaction_count bigint, my_reacted boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_points numeric; c_window numeric; c_fallback numeric;
  c_min numeric; c_cap numeric;
BEGIN
  SELECT COALESCE(MAX(CASE WHEN key = 'wig_big_round_points' THEN value END), 42),
         COALESCE(MAX(CASE WHEN key = 'wig_window_days' THEN value END), 7),
         COALESCE(MAX(CASE WHEN key = 'wig_fallback_days' THEN value END), 14),
         COALESCE(MAX(CASE WHEN key = 'wig_min_events' THEN value END), 3),
         COALESCE(MAX(CASE WHEN key = 'wig_user_cap' THEN value END), 2)
    INTO c_points, c_window, c_fallback, c_min, c_cap
    FROM feed_config;

  RETURN QUERY
  WITH all_events AS MATERIALIZED (
    SELECT * FROM (
      SELECT
        CASE
          WHEN h.par - h.actual_gross = 3 AND h.actual_gross > 1 THEN 'albatross'
          WHEN h.actual_gross = 1 THEN 'ace'
          ELSE 'eagle'
        END AS ev_type,
        CASE
          WHEN h.par - h.actual_gross = 3 AND h.actual_gross > 1 THEN 1
          WHEN h.actual_gross = 1 THEN 2
          ELSE 5
        END AS ev_rarity,
        s.capture_date AS ev_at,
        wc.user_id AS ev_user,
        CASE
          WHEN h.actual_gross = 1 THEN 'Hole-in-one ' || chr(183) || ' Hole ' || h.hole_no
          WHEN h.par - h.actual_gross = 3 THEN 'Albatross ' || chr(183) || ' Hole ' || h.hole_no
          ELSE 'Eagle ' || chr(183) || ' Hole ' || h.hole_no
        END AS ev_line1,
        gc.name AS ev_line2,
        s.course_id AS ev_course,
        gc.region AS ev_region, gc.country AS ev_country
      FROM whs_score_holes h
      JOIN whs_scores s ON s.id = h.score_id
      JOIN whs_connections wc ON wc.id = s.connection_id AND wc.deleted_at IS NULL
      LEFT JOIN golf_courses gc ON gc.id = s.course_id
      WHERE h.played = true
        AND h.actual_gross IS NOT NULL AND h.par IS NOT NULL
        AND (h.actual_gross = 1 OR h.par - h.actual_gross >= 2)
        AND s.is_penalty_score = false
        AND s.capture_date > NOW() - make_interval(days => c_fallback::integer)

      UNION ALL
      SELECT
        'big_round', 4, s.capture_date, wc.user_id,
        s.stableford_points || ' pts ' || chr(183) || ' Stableford',
        gc.name,
        s.course_id,
        gc.region, gc.country
      FROM whs_scores s
      JOIN whs_connections wc ON wc.id = s.connection_id AND wc.deleted_at IS NULL
      LEFT JOIN golf_courses gc ON gc.id = s.course_id
      WHERE s.stableford_points >= c_points
        AND s.total_holes = 18 AND s.is_nine_hole = false
        AND s.is_penalty_score = false
        AND s.capture_date > NOW() - make_interval(days => c_fallback::integer)

      UNION ALL
      SELECT
        'rank_unlocked', 6, o.created_at, o.user_id,
        COALESCE(o.template_payload->>'label', 'New rank'),
        COALESCE(o.template_payload->>'medals', '') ||
          CASE WHEN o.template_payload->>'medals' IS NOT NULL THEN ' medals' ELSE '' END,
        NULL::uuid,
        NULL::text, NULL::text
      FROM gam_notification_outbox o
      WHERE o.notification_type = 'level_up'
        AND o.created_at > NOW() - make_interval(days => c_fallback::integer)

      UNION ALL
      SELECT
        CASE WHEN o.template_payload->>'category' LIKE '%all_time%'
             THEN 'crown_taken' ELSE 'course_record' END,
        CASE WHEN o.template_payload->>'category' LIKE '%all_time%'
             THEN 3 ELSE 7 END,
        o.created_at, o.user_id,
        initcap(replace(
          replace(replace(o.template_payload->>'category',
                          '_all_time', ''), '_90d', ''),
          '_', ' '))
        || CASE
             WHEN o.template_payload->>'category' LIKE '%all_time%' THEN ' (all-time)'
             WHEN o.template_payload->>'category' LIKE '%90d%' THEN ' (90 days)'
             ELSE '' END,
        COALESCE(gcl.name, o.template_payload->>'course_name', '') ||
          COALESCE((
            SELECT ' ' || chr(183) || ' from ' || upl.display_name
            FROM gam_notification_outbox ol
            JOIN user_profiles upl ON upl.id = ol.user_id
            WHERE ol.notification_type = 'legend_lost'
              AND ol.template_payload->>'course_id' =
                  o.template_payload->>'course_id'
              AND ol.template_payload->>'category' =
                  o.template_payload->>'category'
              AND ol.created_at BETWEEN o.created_at - interval '1 hour'
                                    AND o.created_at + interval '1 hour'
              AND ol.user_id <> o.user_id
            LIMIT 1
          ), ''),
        NULLIF(o.template_payload->>'course_id','')::uuid,
        gcl.region, gcl.country
      FROM gam_notification_outbox o
      LEFT JOIN golf_courses gcl
        ON gcl.id = NULLIF(o.template_payload->>'course_id','')::uuid
      WHERE o.notification_type = 'legend_earned'
        AND o.created_at > NOW() - make_interval(days => c_fallback::integer)
    ) raw (ev_type, ev_rarity, ev_at, ev_user, ev_line1, ev_line2, ev_course, ev_region, ev_country)
  ),
  gated AS MATERIALIZED (
    SELECT a.*,
           (a.ev_at > NOW() - make_interval(days => c_window::integer)) AS in_primary,
           up.username AS u_name, up.display_name AS d_name,
           up.profile_photo_url AS avatar
    FROM all_events a
    JOIN user_profiles up ON up.id = a.ev_user
    WHERE COALESCE(up.handicap_visibility, 'public') = 'public'
      AND up.eg_handicap_index IS NOT NULL
  ),
  window_pick AS (
    SELECT (COUNT(*) FILTER (WHERE g.in_primary)) >= c_min::integer AS use_primary
    FROM gated g
  ),
  windowed AS (
    SELECT g.*,
           CASE WHEN wp.use_primary THEN c_window::integer
                ELSE c_fallback::integer END AS eff_days
    FROM gated g CROSS JOIN window_pick wp
    WHERE (NOT wp.use_primary) OR g.in_primary
  ),
  best_per_round AS (
    SELECT w.*, ROW_NUMBER() OVER (
      PARTITION BY w.ev_user, w.ev_at ORDER BY w.ev_rarity ASC
    ) AS rn_inst
    FROM windowed w
  ),
  capped AS (
    SELECT b.*, ROW_NUMBER() OVER (
      PARTITION BY b.ev_user ORDER BY b.ev_rarity ASC, b.ev_at DESC
    ) AS rn_user
    FROM best_per_round b
    WHERE b.rn_inst = 1
  )
  SELECT c.ev_type, c.ev_rarity, c.ev_at,
         c.ev_user, c.u_name, c.d_name, c.avatar,
         c.ev_line1, c.ev_line2, c.ev_course, c.ev_region, c.ev_country, c.eff_days,
         md5(c.ev_type || ':' || c.ev_user::text || ':'
             || COALESCE(c.ev_course::text, '-') || ':'
             || c.ev_line1 || ':' || c.ev_at::date::text) AS event_key,
         (SELECT COUNT(*) FROM feat_reactions fr
           WHERE fr.event_key = md5(c.ev_type || ':' || c.ev_user::text || ':'
             || COALESCE(c.ev_course::text, '-') || ':'
             || c.ev_line1 || ':' || c.ev_at::date::text)) AS reaction_count,
         (p_user_id IS NOT NULL AND EXISTS (
           SELECT 1 FROM feat_reactions fr2
           WHERE fr2.user_id = p_user_id
             AND fr2.event_key = md5(c.ev_type || ':' || c.ev_user::text || ':'
               || COALESCE(c.ev_course::text, '-') || ':'
               || c.ev_line1 || ':' || c.ev_at::date::text))) AS my_reacted
  FROM capped c
  WHERE c.rn_user <= c_cap::integer
  ORDER BY c.ev_rarity ASC, c.ev_at DESC
  LIMIT p_limit;
END;
$function$;