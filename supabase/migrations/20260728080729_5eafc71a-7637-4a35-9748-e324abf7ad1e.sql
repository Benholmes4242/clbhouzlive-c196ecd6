DROP FUNCTION IF EXISTS public.get_under_threat(uuid, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_under_threat(p_user_id uuid, p_limit integer DEFAULT 20, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(course_id uuid, course_name text, course_region text, course_country text, hero_image_url text, category text, category_label text, my_value numeric, attained_at timestamp with time zone, challenger_user_id uuid, challenger_name text, challenger_avatar text, challenger_value numeric, gap numeric, challenger_active_7d boolean, threat_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH my_crowns AS (
    SELECT l.course_id AS c_id, l.category AS cat, l.value AS my_val,
           l.attained_at AS att
    FROM gam_course_legends l
    WHERE l.user_id = p_user_id AND l.is_current = true AND l.rank = 1
      AND (p_course_id IS NULL OR l.course_id = p_course_id)
  ),
  challengers AS (
    SELECT l2.course_id AS c_id, l2.category AS cat,
           l2.user_id AS ch_id, l2.value AS ch_val
    FROM gam_course_legends l2
    WHERE l2.is_current = true AND l2.rank = 2
      AND (p_course_id IS NULL OR l2.course_id = p_course_id)
  )
  SELECT
    mc.c_id, gc.name, gc.region, gc.country, gc.thumbnail_image, mc.cat,
    initcap(replace(replace(replace(mc.cat, '_all_time',''), '_90d',''), '_',' '))
      || CASE WHEN mc.cat LIKE '%all_time%' THEN ' (all-time)'
              WHEN mc.cat LIKE '%90d%' THEN ' (90 days)' ELSE '' END,
    mc.my_val, mc.att,
    ch.ch_id, up.display_name, up.profile_photo_url,
    ch.ch_val,
    CASE WHEN ch.ch_id IS NULL THEN NULL
         WHEN mc.cat LIKE 'lowest_gross%' OR mc.cat LIKE 'best_score_diff%'
           THEN ch.ch_val - mc.my_val
         ELSE mc.my_val - ch.ch_val END,
    COALESCE(EXISTS (
      SELECT 1 FROM whs_scores s
      JOIN whs_connections wc ON wc.id = s.connection_id
      WHERE wc.user_id = ch.ch_id
        AND s.capture_date > NOW() - interval '7 days'
    ), false),
    CASE WHEN ch.ch_id IS NULL THEN 0
      ELSE (1.0 / (1.0 + GREATEST(
          CASE WHEN mc.cat LIKE 'lowest_gross%' OR mc.cat LIKE 'best_score_diff%'
               THEN ch.ch_val - mc.my_val
               ELSE mc.my_val - ch.ch_val END, 0)))
        * CASE WHEN EXISTS (
            SELECT 1 FROM whs_scores s2
            JOIN whs_connections wc2 ON wc2.id = s2.connection_id
            WHERE wc2.user_id = ch.ch_id
              AND s2.capture_date > NOW() - interval '7 days'
          ) THEN 1.5 ELSE 1.0 END
    END
  FROM my_crowns mc
  LEFT JOIN challengers ch ON ch.c_id = mc.c_id AND ch.cat = mc.cat
  LEFT JOIN user_profiles up ON up.id = ch.ch_id
  LEFT JOIN golf_courses gc ON gc.id = mc.c_id
  ORDER BY 16 DESC, mc.att ASC
  LIMIT p_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_under_threat(uuid, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_under_threat(uuid, integer, uuid) TO service_role;