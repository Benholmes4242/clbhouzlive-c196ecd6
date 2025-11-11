-- Make echo_history_search resilient to either column name
CREATE OR REPLACE FUNCTION public.echo_history_search(
  q               text DEFAULT NULL,
  filter_has_response boolean DEFAULT NULL,
  date_from       timestamptz DEFAULT NULL,
  date_to         timestamptz DEFAULT NULL,
  mode            text DEFAULT NULL,
  filter_starred  boolean DEFAULT NULL,
  filter_tag      text DEFAULT NULL,
  sort_mode       text DEFAULT 'default',
  max_results     int  DEFAULT 50
) RETURNS TABLE(
  thread_id        uuid,
  first_user_question text,
  preview_snippet  text,
  has_response     boolean,
  is_starred       boolean,
  last_activity_at timestamptz,
  message_count    int,
  relative_date    text,
  tags             text[]
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH thread_tags AS (
    SELECT tt.thread_id, array_agg(t.name) AS tag_names
    FROM echo_thread_tags tt
    JOIN echo_tags t ON t.id = tt.tag_id
    GROUP BY tt.thread_id
  )
  SELECT
    et.id AS thread_id,
    COALESCE(et.first_user_question, et.title) AS first_user_question,
    COALESCE(
      (SELECT LEFT(em2.content, 220)
         FROM echo_messages em2
        WHERE em2.thread_id = et.id AND em2.role IN ('assistant','model')
        ORDER BY em2.created_at ASC LIMIT 1),
      (SELECT LEFT(em3.content, 220)
         FROM echo_messages em3
        WHERE em3.thread_id = et.id AND em3.role = 'user'
        ORDER BY em3.created_at ASC OFFSET 1 LIMIT 1)
    ) AS preview_snippet,
    EXISTS (
      SELECT 1 FROM echo_messages em
      WHERE em.thread_id = et.id AND em.role IN ('assistant','model')
    ) AS has_response,
    COALESCE(et.is_starred, false) AS is_starred,
    COALESCE(et.last_activity_at, et.created_at) AS last_activity_at,
    (SELECT COUNT(*) FROM echo_messages em WHERE em.thread_id = et.id)::int AS message_count,
    CASE
      WHEN COALESCE(et.last_activity_at, et.created_at) > NOW() - INTERVAL '1 hour'  THEN 'Just now'
      WHEN COALESCE(et.last_activity_at, et.created_at) > NOW() - INTERVAL '1 day'   THEN 'Today'
      WHEN COALESCE(et.last_activity_at, et.created_at) > NOW() - INTERVAL '7 days'  THEN 'This week'
      WHEN COALESCE(et.last_activity_at, et.created_at) > NOW() - INTERVAL '30 days' THEN 'This month'
      ELSE 'Older'
    END AS relative_date,
    COALESCE(tt.tag_names, ARRAY[]::text[]) AS tags
  FROM echo_threads et
  LEFT JOIN thread_tags tt ON tt.thread_id = et.id
  WHERE et.user_id = auth.uid()
    AND (
      q IS NULL OR
      COALESCE(et.first_user_question, et.title) ILIKE '%' || q || '%'
    )
    AND (filter_has_response IS NULL OR filter_has_response = EXISTS (
      SELECT 1 FROM echo_messages em WHERE em.thread_id = et.id AND em.role IN ('assistant','model')
    ))
    AND (date_from IS NULL OR COALESCE(et.last_activity_at, et.created_at) >= date_from)
    AND (date_to   IS NULL OR COALESCE(et.last_activity_at, et.created_at) <= date_to)
    AND (filter_starred IS NULL OR COALESCE(et.is_starred,false) = filter_starred)
    AND (
      filter_tag IS NULL OR EXISTS (
        SELECT 1 FROM echo_thread_tags tt2
        JOIN echo_tags t2 ON t2.id = tt2.tag_id
        WHERE tt2.thread_id = et.id AND LOWER(t2.name) = LOWER(filter_tag)
      )
    )
  ORDER BY
    CASE WHEN sort_mode = 'starred' THEN COALESCE(et.is_starred,false) END DESC NULLS LAST,
    COALESCE(et.last_activity_at, et.created_at) DESC
  LIMIT COALESCE(max_results, 50);
END;
$$;

GRANT EXECUTE ON FUNCTION public.echo_history_search(
  text, boolean, timestamptz, timestamptz, text, boolean, text, text, int
) TO authenticated;