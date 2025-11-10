-- Phase 2.5: Echo History Enhancements

-- ============================================
-- A) Bulk Actions - RPC functions
-- ============================================

-- Star/unstar multiple threads
CREATE OR REPLACE FUNCTION echo_threads_set_star(ids uuid[], starred boolean)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE echo_threads 
  SET is_starred = starred 
  WHERE id = ANY(ids) AND user_id = auth.uid();
$$;

-- Delete multiple threads
CREATE OR REPLACE FUNCTION echo_threads_delete_many(ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM echo_threads 
  WHERE id = ANY(ids) AND user_id = auth.uid();
$$;

-- ============================================
-- B) Sort Modes - Update history search RPC
-- ============================================

-- Enhanced echo_history_search with sort modes
CREATE OR REPLACE FUNCTION echo_history_search(
  q text DEFAULT NULL,
  filter_has_response boolean DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  mode text DEFAULT NULL,
  filter_starred boolean DEFAULT NULL,
  sort_mode text DEFAULT 'default',
  max_results int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  subtitle text,
  has_response boolean,
  is_starred boolean,
  last_activity_at timestamptz,
  message_count int,
  relative_date text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH thread_data AS (
    SELECT 
      t.id,
      t.title,
      t.is_starred,
      t.updated_at as last_activity_at,
      (SELECT COUNT(*) FROM echo_messages WHERE thread_id = t.id) as msg_count,
      (SELECT COUNT(*) > 0 FROM echo_messages WHERE thread_id = t.id AND role = 'assistant') as has_resp,
      (SELECT content FROM echo_messages WHERE thread_id = t.id AND role = 'assistant' ORDER BY created_at LIMIT 1) as first_response,
      -- Calculate ts_rank for relevance sorting
      CASE 
        WHEN q IS NOT NULL THEN 
          ts_rank(to_tsvector('english', t.title || ' ' || COALESCE((SELECT string_agg(content, ' ') FROM echo_messages WHERE thread_id = t.id), '')), plainto_tsquery('english', q))
        ELSE 0
      END as relevance_rank
    FROM echo_threads t
    WHERE t.user_id = auth.uid()
      AND (q IS NULL OR to_tsvector('english', t.title || ' ' || COALESCE((SELECT string_agg(content, ' ') FROM echo_messages WHERE thread_id = t.id), '')) @@ plainto_tsquery('english', q))
      AND (filter_has_response IS NULL OR (SELECT COUNT(*) > 0 FROM echo_messages WHERE thread_id = t.id AND role = 'assistant') = filter_has_response)
      AND (date_from IS NULL OR t.updated_at >= date_from)
      AND (date_to IS NULL OR t.updated_at <= date_to)
      AND (filter_starred IS NULL OR t.is_starred = filter_starred)
  )
  SELECT 
    td.id,
    td.title,
    COALESCE(SUBSTRING(td.first_response FROM 1 FOR 120), 'No response yet') as subtitle,
    td.has_resp as has_response,
    td.is_starred,
    td.last_activity_at,
    td.msg_count::int as message_count,
    CASE
      WHEN td.last_activity_at > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(EPOCH FROM (NOW() - td.last_activity_at))::int / 60 || 'm'
      WHEN td.last_activity_at > NOW() - INTERVAL '1 day' THEN
        EXTRACT(EPOCH FROM (NOW() - td.last_activity_at))::int / 3600 || 'h'
      WHEN td.last_activity_at > NOW() - INTERVAL '7 days' THEN
        EXTRACT(EPOCH FROM (NOW() - td.last_activity_at))::int / 86400 || 'd'
      WHEN td.last_activity_at > NOW() - INTERVAL '30 days' THEN
        EXTRACT(EPOCH FROM (NOW() - td.last_activity_at))::int / 604800 || 'w'
      ELSE
        EXTRACT(EPOCH FROM (NOW() - td.last_activity_at))::int / 2592000 || 'mo'
    END as relative_date
  FROM thread_data td
  ORDER BY
    CASE 
      WHEN sort_mode = 'starred' THEN td.is_starred::int
      ELSE 0
    END DESC,
    CASE 
      WHEN sort_mode = 'relevance' AND q IS NOT NULL THEN td.relevance_rank
      ELSE 0
    END DESC,
    td.last_activity_at DESC
  LIMIT max_results;
END;
$$;

-- ============================================
-- D) Share Conversations - Schema & Functions
-- ============================================

-- Share links table
CREATE TABLE IF NOT EXISTS echo_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES echo_threads(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_echo_shares_thread_id ON echo_shares(thread_id);
CREATE INDEX IF NOT EXISTS idx_echo_shares_token ON echo_shares(token);

-- Enable RLS
ALTER TABLE echo_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for echo_shares
CREATE POLICY "Users can create shares for their own threads"
  ON echo_shares FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM echo_threads WHERE id = thread_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own shares"
  ON echo_shares FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can revoke their own shares"
  ON echo_shares FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow anonymous access to resolve shares
CREATE POLICY "Anyone can resolve valid shares"
  ON echo_shares FOR SELECT
  USING (revoked_at IS NULL AND (expires_at IS NULL OR now() < expires_at));

-- Create share (returns token)
CREATE OR REPLACE FUNCTION echo_share_create(p_thread_id uuid, p_ttl_seconds int DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_expires timestamptz := CASE 
    WHEN p_ttl_seconds IS NULL THEN NULL 
    ELSE now() + (p_ttl_seconds || ' seconds')::interval 
  END;
BEGIN
  -- Verify user owns the thread
  IF NOT EXISTS (SELECT 1 FROM echo_threads WHERE id = p_thread_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Thread not found or access denied';
  END IF;
  
  INSERT INTO echo_shares(thread_id, token, expires_at, created_by)
  VALUES (p_thread_id, v_token, v_expires, auth.uid());
  
  RETURN v_token;
END;
$$;

-- Revoke share
CREATE OR REPLACE FUNCTION echo_share_revoke(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE echo_shares 
  SET revoked_at = now() 
  WHERE token = p_token 
    AND created_by = auth.uid() 
    AND revoked_at IS NULL;
$$;

-- Resolve share (public access)
CREATE OR REPLACE FUNCTION echo_share_resolve(p_token text)
RETURNS TABLE(thread_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT thread_id 
  FROM echo_shares
  WHERE token = p_token 
    AND revoked_at IS NULL 
    AND (expires_at IS NULL OR now() < expires_at);
$$;

-- Get share info for thread owner
CREATE OR REPLACE FUNCTION echo_share_get_by_thread(p_thread_id uuid)
RETURNS TABLE(
  id uuid,
  token text,
  created_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, token, created_at, expires_at, revoked_at
  FROM echo_shares
  WHERE thread_id = p_thread_id 
    AND created_by = auth.uid()
    AND revoked_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Get shared thread messages (public access for valid tokens)
CREATE OR REPLACE FUNCTION echo_share_get_thread(p_token text)
RETURNS TABLE(
  thread_id uuid,
  title text,
  created_at timestamptz,
  messages jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  -- Resolve token
  SELECT echo_share_resolve.thread_id INTO v_thread_id
  FROM echo_share_resolve(p_token);
  
  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share link';
  END IF;
  
  -- Return thread with messages
  RETURN QUERY
  SELECT 
    t.id as thread_id,
    t.title,
    t.created_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'created_at', m.created_at
        ) ORDER BY m.created_at
      )
      FROM echo_messages m
      WHERE m.thread_id = t.id
    ) as messages
  FROM echo_threads t
  WHERE t.id = v_thread_id;
END;
$$;