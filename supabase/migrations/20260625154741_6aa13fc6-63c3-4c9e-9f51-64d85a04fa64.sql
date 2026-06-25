
CREATE OR REPLACE FUNCTION public.get_user_course_anchored_content(
  p_user_id uuid,
  p_limit_per_course integer DEFAULT 4,
  p_mood text DEFAULT 'for_you'::text,
  p_format text DEFAULT NULL::text,
  p_source text DEFAULT 'played'::text
)
RETURNS TABLE(course_id uuid, course_name text, course_country text, content_count integer, recent_post_ids uuid[])
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_mood text := COALESCE(NULLIF(p_mood, ''), 'for_you');
  v_format text := NULLIF(p_format, '');
  v_source text := COALESCE(NULLIF(p_source, ''), 'played');
BEGIN
  IF v_mood IN ('follows', 'trending', 'tour_week') THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH source_courses AS (
    SELECT uca.course_id, MAX(uca.played_at) AS ordering_ts
    FROM public.user_course_activity uca
    WHERE v_source = 'played'
      AND uca.user_id = p_user_id
      AND uca.has_played = true
      AND uca.course_id IS NOT NULL
    GROUP BY uca.course_id
    UNION ALL
    SELECT cs.course_id, MAX(cs.created_at) AS ordering_ts
    FROM public.course_shortlists cs
    WHERE v_source = 'want_to_play'
      AND cs.user_id = p_user_id
      AND cs.list_key = 'want_to_play'
      AND cs.course_id IS NOT NULL
    GROUP BY cs.course_id
  ),
  primary_media AS (
    SELECT
      pm.post_id,
      pm.derived_format,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.derived_format IN ('clip', 'video')
      AND pm.processing_status = 'complete'
  ),
  course_posts AS (
    SELECT
      p.course_id,
      p.id AS post_id,
      p.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY p.course_id
        ORDER BY p.created_at DESC
      ) AS post_rn
    FROM public.posts p
    JOIN primary_media pm ON pm.post_id = p.id AND pm.rn = 1
    JOIN source_courses sc ON sc.course_id = p.course_id
    WHERE p.created_at > now() - interval '30 days'
      AND p.status = 'published'
      AND (v_format IS NULL OR pm.derived_format = v_format)
  ),
  agg AS (
    SELECT
      cp.course_id,
      COUNT(*)::int AS total,
      array_agg(cp.post_id ORDER BY cp.created_at DESC) FILTER (WHERE cp.post_rn <= p_limit_per_course) AS post_ids
    FROM course_posts cp
    GROUP BY cp.course_id
    HAVING COUNT(*) >= 2
  )
  SELECT
    gc.id, gc.name, gc.country, a.total, a.post_ids
  FROM agg a
  JOIN public.golf_courses gc ON gc.id = a.course_id
  JOIN source_courses sc ON sc.course_id = a.course_id
  GROUP BY gc.id, gc.name, gc.country, a.total, a.post_ids
  ORDER BY a.total DESC, MAX(sc.ordering_ts) DESC NULLS LAST
  LIMIT 10;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_user_course_anchored_content(uuid, int, text, text, text) TO anon, authenticated;
