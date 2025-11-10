-- Add starring support to echo_threads
ALTER TABLE echo_threads
ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

-- Create index for starred filtering and sorting
CREATE INDEX IF NOT EXISTS echo_threads_star_idx ON echo_threads (user_id, is_starred, last_activity_at DESC);

-- RPC to toggle star status
CREATE OR REPLACE FUNCTION echo_thread_set_star(p_thread uuid, p_star boolean)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE echo_threads 
  SET is_starred = p_star
  WHERE id = p_thread AND user_id = auth.uid();
$$;

-- RPC to delete thread and its messages
CREATE OR REPLACE FUNCTION echo_thread_delete(p_thread uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM echo_messages WHERE thread_id = p_thread AND user_id = auth.uid();
  DELETE FROM echo_threads WHERE id = p_thread AND user_id = auth.uid();
$$;

-- Update the search RPC to include is_starred
CREATE OR REPLACE FUNCTION echo_history_search(
  q text DEFAULT NULL,
  filter_has_response boolean DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  mode text DEFAULT NULL,
  filter_starred boolean DEFAULT NULL,
  limit_rows int DEFAULT 50,
  offset_rows int DEFAULT 0
) RETURNS TABLE (
  thread_id uuid,
  first_user_question text,
  preview_snippet text,
  has_response boolean,
  is_starred boolean,
  last_activity_at timestamptz,
  message_count int,
  relative_date text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id AS thread_id,
    et.first_user_question,
    COALESCE(substring(et.assistant_text_concat from 1 for 120), '(No response yet)') AS preview_snippet,
    et.has_response,
    et.is_starred,
    et.last_activity_at,
    et.message_count,
    CASE 
      WHEN et.last_activity_at > now() - interval '1 day' THEN 'Today'
      WHEN et.last_activity_at > now() - interval '7 days' THEN 'This week'
      WHEN et.last_activity_at > now() - interval '30 days' THEN 'This month'
      ELSE 'Older'
    END AS relative_date
  FROM echo_threads et
  WHERE et.user_id = auth.uid()
    AND (q IS NULL OR et.tsv @@ websearch_to_tsquery('english', q))
    AND (filter_has_response IS NULL OR et.has_response = filter_has_response)
    AND (date_from IS NULL OR et.last_activity_at >= date_from)
    AND (date_to IS NULL OR et.last_activity_at <= date_to)
    AND (mode IS NULL OR (mode = 'live' AND et.has_response = false) OR (mode = 'static' AND et.has_response = true))
    AND (filter_starred IS NULL OR et.is_starred = filter_starred)
  ORDER BY et.last_activity_at DESC
  LIMIT limit_rows
  OFFSET offset_rows;
END;
$$;