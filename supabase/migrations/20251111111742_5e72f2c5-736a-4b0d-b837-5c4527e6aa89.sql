-- Drop exact function signatures that exist
DROP FUNCTION IF EXISTS echo_history_search(q text, filter_has_response boolean, date_from timestamptz, date_to timestamptz, mode text, filter_starred boolean, sort_mode text, max_results int, filter_tag text);
DROP FUNCTION IF EXISTS echo_history_search(q text, filter_has_response boolean, date_from timestamptz, date_to timestamptz, mode text, filter_starred boolean, filter_tag text, sort_mode text, max_results int);

-- Add index for tag name filtering (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_echo_tags_name_lower ON echo_tags (lower(name));

-- Create improved echo_history_search with fallback to second user message
CREATE FUNCTION echo_history_search(
  q text DEFAULT NULL,
  filter_has_response boolean DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  mode text DEFAULT NULL,
  filter_starred boolean DEFAULT NULL,
  filter_tag text DEFAULT NULL,
  sort_mode text DEFAULT 'default',
  max_results int DEFAULT 50
)
RETURNS TABLE(
  thread_id uuid,
  first_user_question text,
  preview_snippet text,
  has_response boolean,
  is_starred boolean,
  last_activity_at timestamptz,
  message_count int,
  relative_date text,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.id as thread_id,
    et.title as first_user_question,
    COALESCE(
      (SELECT LEFT(em2.content, 220) 
       FROM echo_messages em2 
       WHERE em2.thread_id = et.id 
         AND em2.role IN ('assistant', 'model')
       ORDER BY em2.created_at ASC 
       LIMIT 1),
      (SELECT LEFT(em3.content, 220) 
       FROM echo_messages em3 
       WHERE em3.thread_id = et.id 
         AND em3.role = 'user' 
       ORDER BY em3.created_at ASC 
       OFFSET 1 
       LIMIT 1)
    ) as preview_snippet,
    EXISTS(
      SELECT 1 FROM echo_messages em 
      WHERE em.thread_id = et.id 
        AND em.role IN ('assistant', 'model')
    ) as has_response,
    COALESCE(et.is_starred, false) as is_starred,
    et.last_activity_at,
    (SELECT COUNT(*) FROM echo_messages em WHERE em.thread_id = et.id)::int as message_count,
    CASE
      WHEN et.last_activity_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
      WHEN et.last_activity_at > NOW() - INTERVAL '1 day' THEN 'Today'
      WHEN et.last_activity_at > NOW() - INTERVAL '7 days' THEN 'This week'
      WHEN et.last_activity_at > NOW() - INTERVAL '30 days' THEN 'This month'
      ELSE 'Older'
    END as relative_date,
    COALESCE(
      (SELECT array_agg(t.name)
       FROM echo_thread_tags ett
       JOIN echo_tags t ON t.id = ett.tag_id
       WHERE ett.thread_id = et.id),
      '{}'::text[]
    ) as tags
  FROM echo_threads et
  WHERE et.user_id = auth.uid()
    AND (q IS NULL OR et.title ILIKE '%' || q || '%')
    AND (filter_has_response IS NULL OR 
         (filter_has_response = true AND EXISTS(
           SELECT 1 FROM echo_messages em 
           WHERE em.thread_id = et.id AND em.role IN ('assistant','model')
         )) OR
         (filter_has_response = false AND NOT EXISTS(
           SELECT 1 FROM echo_messages em 
           WHERE em.thread_id = et.id AND em.role IN ('assistant','model')
         )))
    AND (date_from IS NULL OR et.last_activity_at >= date_from)
    AND (date_to IS NULL OR et.last_activity_at <= date_to)
    AND (filter_starred IS NULL OR et.is_starred = filter_starred)
    AND (filter_tag IS NULL OR EXISTS(
      SELECT 1 FROM echo_thread_tags ett
      JOIN echo_tags t ON t.id = ett.tag_id
      WHERE ett.thread_id = et.id AND LOWER(t.name) = LOWER(filter_tag)
    ))
  ORDER BY
    CASE WHEN sort_mode = 'starred' THEN et.is_starred END DESC NULLS LAST,
    et.last_activity_at DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION echo_history_search TO authenticated;