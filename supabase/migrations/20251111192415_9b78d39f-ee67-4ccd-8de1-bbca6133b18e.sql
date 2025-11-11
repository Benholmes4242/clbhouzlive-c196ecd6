-- Fix echo_history_search RPC to use correct column names
-- Drop existing versions
DROP FUNCTION IF EXISTS echo_history_search(text, boolean, timestamp with time zone, timestamp with time zone, text, boolean, text, text, integer);

-- Recreate with correct column references
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
  WITH combined AS (
    -- New echo_threads
    SELECT
      et.id AS thread_id,
      et.user_id,
      COALESCE(et.first_user_question, 'Untitled') AS first_user_question,
      COALESCE(
        (SELECT em.content FROM echo_messages em WHERE em.thread_id = et.id AND em.role = 'assistant' ORDER BY em.created_at ASC LIMIT 1),
        et.first_user_question,
        'No messages'
      ) AS preview_snippet,
      et.has_response,
      et.is_starred,
      et.last_activity_at,
      et.message_count,
      et.created_at
    FROM echo_threads et
    WHERE et.user_id = auth.uid()

    UNION ALL

    -- Legacy conversations
    SELECT
      c.id AS thread_id,
      c.user_id,
      COALESCE(c.title, 'Untitled') AS first_user_question,
      COALESCE(c.title, 'No messages') AS preview_snippet,
      true AS has_response,
      false AS is_starred,
      c.updated_at AS last_activity_at,
      0 AS message_count,
      c.created_at
    FROM conversations c
    WHERE c.user_id = auth.uid()
      AND c.conversation_type = 'chat'
  ),
  tagged AS (
    SELECT
      c.*,
      COALESCE(
        ARRAY_AGG(DISTINCT etag.name) FILTER (WHERE etag.name IS NOT NULL),
        ARRAY[]::text[]
      ) AS tags
    FROM combined c
    LEFT JOIN echo_thread_tags ett ON ett.thread_id = c.thread_id
    LEFT JOIN echo_tags etag ON etag.id = ett.tag_id
    GROUP BY c.thread_id, c.user_id, c.first_user_question, c.preview_snippet, c.has_response, c.is_starred, c.last_activity_at, c.message_count, c.created_at
  )
  SELECT
    t.thread_id,
    t.first_user_question,
    t.preview_snippet,
    t.has_response,
    t.is_starred,
    t.last_activity_at,
    t.message_count,
    CASE
      WHEN AGE(NOW(), t.created_at) < INTERVAL '1 day' THEN 'Today'
      WHEN AGE(NOW(), t.created_at) < INTERVAL '2 days' THEN 'Yesterday'
      WHEN AGE(NOW(), t.created_at) < INTERVAL '7 days' THEN 'This week'
      WHEN AGE(NOW(), t.created_at) < INTERVAL '30 days' THEN 'This month'
      ELSE 'Older'
    END AS relative_date,
    t.tags
  FROM tagged t
  WHERE
    (q IS NULL OR (
      t.first_user_question ILIKE '%' || q || '%' OR
      t.preview_snippet ILIKE '%' || q || '%'
    ))
    AND (filter_has_response IS NULL OR t.has_response = filter_has_response)
    AND (date_from IS NULL OR t.last_activity_at >= date_from)
    AND (date_to IS NULL OR t.last_activity_at <= date_to)
    AND (filter_starred IS NULL OR t.is_starred = filter_starred)
    AND (filter_tag IS NULL OR filter_tag = ANY(t.tags))
  ORDER BY
    CASE WHEN sort_mode = 'starred' THEN (CASE WHEN t.is_starred THEN 0 ELSE 1 END) ELSE 2 END,
    t.last_activity_at DESC
  LIMIT max_results;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION echo_history_search TO authenticated;