CREATE OR REPLACE FUNCTION public.count_shared_rounds_batch(p_user_id uuid, p_target_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH user_conn AS (
    SELECT id FROM whs_connections
    WHERE user_id = p_user_id AND deleted_at IS NULL
    LIMIT 1
  ),
  targets AS (
    SELECT t.user_id, c.id AS connection_id
    FROM unnest(p_target_ids) AS t(user_id)
    JOIN LATERAL (
      SELECT id FROM whs_connections wc
      WHERE wc.user_id = t.user_id AND wc.deleted_at IS NULL
      LIMIT 1
    ) c ON TRUE
  ),
  counts AS (
    SELECT tg.user_id, COUNT(*) AS shared
    FROM whs_scores us
    JOIN targets tg ON TRUE
    JOIN whs_scores rs
      ON rs.connection_id = tg.connection_id
     AND rs.play_date = us.play_date
     AND rs.course_id = us.course_id
     AND rs.adjusted_gross IS NOT NULL
    WHERE us.connection_id = (SELECT id FROM user_conn)
      AND us.adjusted_gross IS NOT NULL
    GROUP BY tg.user_id
  )
  SELECT COALESCE(jsonb_object_agg(user_id::text, shared), '{}'::jsonb) FROM counts;
$function$;

GRANT EXECUTE ON FUNCTION public.count_shared_rounds_batch(uuid, uuid[]) TO authenticated, service_role;