-- Complete Echo History search setup
-- Adds required columns and full-text search capabilities

-- 1. Add missing columns to echo_threads
ALTER TABLE echo_threads
  ADD COLUMN IF NOT EXISTS first_user_question TEXT,
  ADD COLUMN IF NOT EXISTS has_response BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS assistant_text_concat TEXT;

-- 2. Populate first_user_question from first user message
UPDATE echo_threads t
SET first_user_question = (
  SELECT content
  FROM echo_messages m
  WHERE m.thread_id = t.id
    AND m.role = 'user'
  ORDER BY m.created_at ASC
  LIMIT 1
);

-- 3. Populate has_response flag
UPDATE echo_threads t
SET has_response = EXISTS (
  SELECT 1
  FROM echo_messages m
  WHERE m.thread_id = t.id
    AND m.role = 'assistant'
);

-- 4. Populate message_count
UPDATE echo_threads t
SET message_count = (
  SELECT COUNT(*)::INT
  FROM echo_messages m
  WHERE m.thread_id = t.id
);

-- 5. Populate last_activity_at from latest message
UPDATE echo_threads t
SET last_activity_at = COALESCE(
  (
    SELECT MAX(created_at)
    FROM echo_messages m
    WHERE m.thread_id = t.id
  ),
  t.created_at
);

-- 6. Populate assistant_text_concat from assistant messages
UPDATE echo_threads t
SET assistant_text_concat = (
  SELECT string_agg(m.content, ' ' ORDER BY m.created_at)
  FROM echo_messages m
  WHERE m.thread_id = t.id
    AND m.role = 'assistant'
);

-- 7. Add tsvector column for full-text search
ALTER TABLE echo_threads
  ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(first_user_question, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(assistant_text_concat, '')), 'B')
  ) STORED;

-- 8. Create GIN index for fast text search
CREATE INDEX IF NOT EXISTS echo_threads_tsv_gin 
  ON echo_threads USING GIN (tsv);

-- 9. Create index for sorting by last_activity_at
CREATE INDEX IF NOT EXISTS echo_threads_last_activity_idx 
  ON echo_threads (user_id, last_activity_at DESC);

-- 10. Create trigger to update thread metadata when messages change
CREATE OR REPLACE FUNCTION update_echo_thread_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
  v_first_user_question TEXT;
  v_has_response BOOLEAN;
  v_message_count INT;
  v_last_activity TIMESTAMPTZ;
  v_assistant_text TEXT;
BEGIN
  -- Determine which thread to update
  IF TG_OP = 'DELETE' THEN
    v_thread_id := OLD.thread_id;
  ELSE
    v_thread_id := NEW.thread_id;
  END IF;

  -- Get first user question
  SELECT content INTO v_first_user_question
  FROM echo_messages
  WHERE thread_id = v_thread_id
    AND role = 'user'
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Check if has response
  v_has_response := EXISTS (
    SELECT 1
    FROM echo_messages
    WHERE thread_id = v_thread_id
      AND role = 'assistant'
  );
  
  -- Get message count
  SELECT COUNT(*)::INT INTO v_message_count
  FROM echo_messages
  WHERE thread_id = v_thread_id;
  
  -- Get last activity
  SELECT COALESCE(MAX(created_at), (SELECT created_at FROM echo_threads WHERE id = v_thread_id))
  INTO v_last_activity
  FROM echo_messages
  WHERE thread_id = v_thread_id;
  
  -- Get concatenated assistant text
  SELECT string_agg(content, ' ' ORDER BY created_at) INTO v_assistant_text
  FROM echo_messages
  WHERE thread_id = v_thread_id
    AND role = 'assistant';
  
  -- Update thread
  UPDATE echo_threads
  SET 
    first_user_question = v_first_user_question,
    has_response = v_has_response,
    message_count = v_message_count,
    last_activity_at = v_last_activity,
    assistant_text_concat = v_assistant_text,
    updated_at = now()
  WHERE id = v_thread_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS echo_messages_update_search_trigger ON echo_messages;
DROP TRIGGER IF EXISTS echo_messages_update_metadata_trigger ON echo_messages;

-- Create new trigger for message changes
CREATE TRIGGER echo_messages_update_metadata_trigger
  AFTER INSERT OR UPDATE OR DELETE ON echo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_echo_thread_metadata();

-- 11. Create search RPC function
CREATE OR REPLACE FUNCTION echo_history_search(
  q TEXT DEFAULT NULL,
  filter_has_response BOOLEAN DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL,
  mode TEXT DEFAULT NULL,
  limit_rows INT DEFAULT 50,
  offset_rows INT DEFAULT 0
)
RETURNS TABLE (
  thread_id UUID,
  first_user_question TEXT,
  preview_snippet TEXT,
  has_response BOOLEAN,
  last_activity_at TIMESTAMPTZ,
  message_count INT,
  relative_date TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_threads AS (
    SELECT 
      t.id,
      COALESCE(t.first_user_question, '(No title)') as user_question,
      t.has_response as thread_has_response,
      t.last_activity_at,
      t.message_count,
      -- Rank by text search if query provided
      CASE 
        WHEN q IS NOT NULL THEN ts_rank_cd(t.tsv, plainto_tsquery('simple', q))
        ELSE 0
      END as search_rank
    FROM echo_threads t
    WHERE t.user_id = auth.uid()
      -- Text search filter
      AND (q IS NULL OR t.tsv @@ plainto_tsquery('simple', q))
      -- Response filter
      AND (filter_has_response IS NULL OR t.has_response = filter_has_response)
      -- Date range filter
      AND (date_from IS NULL OR t.last_activity_at >= date_from)
      AND (date_to IS NULL OR t.last_activity_at <= date_to)
      -- Mode filter (check last assistant message metadata)
      AND (
        mode IS NULL OR
        EXISTS (
          SELECT 1 FROM echo_messages m
          WHERE m.thread_id = t.id 
            AND m.role = 'assistant'
            AND m.metadata->>'modeUsed' = mode
          ORDER BY m.created_at DESC
          LIMIT 1
        )
      )
  )
  SELECT 
    rt.id,
    rt.user_question,
    -- Get preview snippet from first assistant message
    COALESCE(
      LEFT(
        (
          SELECT content 
          FROM echo_messages 
          WHERE thread_id = rt.id AND role = 'assistant'
          ORDER BY created_at ASC 
          LIMIT 1
        ),
        120
      ),
      CASE 
        WHEN rt.thread_has_response THEN '(Loading...)'
        ELSE '(No response yet)'
      END
    ) as preview,
    rt.thread_has_response,
    rt.last_activity_at,
    rt.message_count,
    -- Relative date formatting
    CASE
      WHEN rt.last_activity_at::date = CURRENT_DATE THEN 'Today'
      WHEN rt.last_activity_at::date = CURRENT_DATE - 1 THEN 'Yesterday'
      WHEN rt.last_activity_at > CURRENT_TIMESTAMP - interval '7 days' 
        THEN trim(to_char(rt.last_activity_at, 'Day'))
      WHEN rt.last_activity_at > CURRENT_TIMESTAMP - interval '1 year'
        THEN to_char(rt.last_activity_at, 'Mon DD')
      ELSE to_char(rt.last_activity_at, 'Mon DD, YYYY')
    END as rel_date
  FROM ranked_threads rt
  ORDER BY 
    -- If searching, rank by relevance first
    CASE WHEN q IS NOT NULL THEN rt.search_rank ELSE 0 END DESC,
    rt.last_activity_at DESC
  LIMIT limit_rows
  OFFSET offset_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION echo_history_search TO authenticated;