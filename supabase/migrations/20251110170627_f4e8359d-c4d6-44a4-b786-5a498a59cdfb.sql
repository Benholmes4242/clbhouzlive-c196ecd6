-- Echo History Enriched View
-- Provides optimized fields for the Echo history UI

-- 1) Helper view: first user and assistant message timestamps per thread
CREATE OR REPLACE VIEW echo_first_msgs AS
SELECT
  em.thread_id,
  MIN(em.created_at) FILTER (WHERE em.role = 'user') AS first_user_at,
  MIN(em.created_at) FILTER (WHERE em.role = 'assistant') AS first_assistant_at
FROM echo_messages em
GROUP BY em.thread_id;

-- 2) Main enriched history view
CREATE OR REPLACE VIEW echo_history_enriched AS
WITH firsts AS (
  SELECT
    f.thread_id,
    f.first_user_at,
    f.first_assistant_at,
    -- Pull actual content for first messages
    (SELECT em1.content
       FROM echo_messages em1
      WHERE em1.thread_id = f.thread_id
        AND em1.role = 'user'
      ORDER BY em1.created_at ASC
      LIMIT 1) AS first_user_question,
    (SELECT em2.content
       FROM echo_messages em2
      WHERE em2.thread_id = f.thread_id
        AND em2.role = 'assistant'
      ORDER BY em2.created_at ASC
      LIMIT 1) AS first_assistant_answer
  FROM echo_first_msgs f
),
counts AS (
  SELECT
    thread_id,
    COUNT(*) AS message_count,
    MAX(created_at) AS last_activity_at
  FROM echo_messages
  GROUP BY thread_id
)
SELECT
  t.id AS thread_id,
  t.user_id,
  COALESCE(c.last_activity_at, t.created_at) AS last_activity_at,
  c.message_count,
  f.first_user_question,
  f.first_assistant_answer,
  (f.first_assistant_answer IS NOT NULL) AS has_response,
  -- Safe 90-char snippet from first assistant reply
  CASE
    WHEN f.first_assistant_answer IS NULL THEN NULL
    ELSE LEFT(REGEXP_REPLACE(f.first_assistant_answer, '\s+', ' ', 'g'), 90)
  END AS preview_snippet
FROM echo_threads t
LEFT JOIN counts c ON c.thread_id = t.id
LEFT JOIN firsts f ON f.thread_id = t.id
ORDER BY last_activity_at DESC;

-- 3) RPC function for server-side relative date formatting
CREATE OR REPLACE FUNCTION echo_history_list(limit_rows INT DEFAULT 50)
RETURNS TABLE (
  thread_id UUID,
  user_id UUID,
  last_activity_at TIMESTAMPTZ,
  relative_date TEXT,
  message_count INT,
  first_user_question TEXT,
  preview_snippet TEXT,
  has_response BOOLEAN
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    e.thread_id,
    e.user_id,
    e.last_activity_at,
    CASE
      WHEN e.last_activity_at::DATE = NOW()::DATE THEN 'Today'
      WHEN e.last_activity_at::DATE = (NOW()::DATE - 1) THEN 'Yesterday'
      ELSE TO_CHAR(e.last_activity_at, 'Mon DD, YYYY')
    END AS relative_date,
    e.message_count::INT,
    e.first_user_question,
    e.preview_snippet,
    e.has_response
  FROM echo_history_enriched e
  WHERE e.user_id = auth.uid()
  ORDER BY e.last_activity_at DESC
  LIMIT limit_rows;
$$;

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS ix_echo_messages_thread_created
  ON echo_messages(thread_id, created_at);

CREATE INDEX IF NOT EXISTS ix_echo_messages_role_thread_created
  ON echo_messages(role, thread_id, created_at);

CREATE INDEX IF NOT EXISTS ix_echo_threads_created
  ON echo_threads(created_at);

-- 5) Grant permissions (views inherit RLS from base tables)
GRANT SELECT ON echo_first_msgs TO authenticated;
GRANT SELECT ON echo_history_enriched TO authenticated;

-- RPC function can be called by authenticated users
GRANT EXECUTE ON FUNCTION echo_history_list TO authenticated;