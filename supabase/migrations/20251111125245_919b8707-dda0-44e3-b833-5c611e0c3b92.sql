-- Update echo_history_search to include legacy conversations table
CREATE OR REPLACE FUNCTION echo_history_search(
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
  WITH new_threads AS (
    -- New echo_threads table
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
  ),
  legacy_convs AS (
    -- Legacy conversations table (chat type only)
    SELECT
      c.id as thread_id,
      c.title as first_user_question,
      CASE
        WHEN jsonb_array_length(COALESCE(c.messages, '[]'::jsonb)) > 1 THEN
          LEFT(COALESCE(c.messages->1->>'content', ''), 220)
        ELSE ''
      END as preview_snippet,
      (SELECT jsonb_array_length(COALESCE(c.messages, '[]'::jsonb)) > 1) as has_response,
      false as is_starred, -- legacy conversations don't have starred flag
      c.updated_at as last_activity_at,
      (SELECT jsonb_array_length(COALESCE(c.messages, '[]'::jsonb)))::int as message_count,
      CASE
        WHEN c.updated_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
        WHEN c.updated_at > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN c.updated_at > NOW() - INTERVAL '7 days' THEN 'This week'
        WHEN c.updated_at > NOW() - INTERVAL '30 days' THEN 'This month'
        ELSE 'Older'
      END as relative_date,
      '{}'::text[] as tags -- legacy conversations don't have tags
    FROM conversations c
    WHERE c.user_id = auth.uid()
      AND c.conversation_type = 'chat'
      AND (q IS NULL OR c.title ILIKE '%' || q || '%')
      AND (filter_has_response IS NULL OR 
           (filter_has_response = true AND jsonb_array_length(COALESCE(c.messages, '[]'::jsonb)) > 1) OR
           (filter_has_response = false AND jsonb_array_length(COALESCE(c.messages, '[]'::jsonb)) <= 1))
      AND (date_from IS NULL OR c.updated_at >= date_from)
      AND (date_to IS NULL OR c.updated_at <= date_to)
      AND (filter_starred IS NULL OR filter_starred = false) -- legacy can't be starred, so exclude if starred filter is true
      AND (filter_tag IS NULL) -- legacy don't have tags, so exclude if tag filter is set
  ),
  combined AS (
    SELECT * FROM new_threads
    UNION ALL
    SELECT * FROM legacy_convs
  )
  SELECT * FROM combined
  ORDER BY
    CASE WHEN sort_mode = 'starred' THEN is_starred END DESC NULLS LAST,
    last_activity_at DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION echo_history_search TO authenticated;