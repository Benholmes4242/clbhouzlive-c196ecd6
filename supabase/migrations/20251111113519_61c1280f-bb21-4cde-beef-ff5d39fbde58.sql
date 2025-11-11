-- Echo Share Links: Public read-only conversation sharing

-- Create share links table
CREATE TABLE IF NOT EXISTS echo_share_links (
  token TEXT PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES echo_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Index for faster thread lookups
CREATE INDEX IF NOT EXISTS idx_echo_share_links_thread ON echo_share_links(thread_id);

-- Enable RLS
ALTER TABLE echo_share_links ENABLE ROW LEVEL SECURITY;

-- Owner can see their own links
CREATE POLICY "owner_can_read_own_share_links"
ON echo_share_links FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Owner can insert their own links
CREATE POLICY "owner_can_manage_share_links"
ON echo_share_links FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Owner can update (revoke) their own links
CREATE POLICY "owner_can_update_share_links"
ON echo_share_links FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RPC: Create share link
CREATE OR REPLACE FUNCTION echo_share_create(p_thread UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_token TEXT;
BEGIN
  -- Must own thread
  IF NOT EXISTS (SELECT 1 FROM echo_threads WHERE id = p_thread AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not found' USING errcode='P0002';
  END IF;

  v_token := encode(gen_random_bytes(18), 'base64url'); -- ~24 chars
  INSERT INTO echo_share_links(token, thread_id, user_id) VALUES (v_token, p_thread, auth.uid());
  RETURN v_token;
END;
$$;

-- RPC: Revoke share link
CREATE OR REPLACE FUNCTION echo_share_revoke(p_token TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE echo_share_links
     SET revoked_at = NOW()
   WHERE token = p_token
     AND user_id = auth.uid();
END;
$$;

-- RPC: Public read (ANON): fetch thread + messages by token, if not revoked
CREATE OR REPLACE FUNCTION echo_share_fetch(p_token TEXT)
RETURNS TABLE(
  thread_id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  tags TEXT[],
  messages JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.id AS thread_id,
    et.title,
    et.created_at,
    COALESCE((
      SELECT array_agg(t.name ORDER BY t.name)
      FROM echo_thread_tags tt
      JOIN echo_tags t ON t.id = tt.tag_id
      WHERE tt.thread_id = et.id
    ), ARRAY[]::TEXT[]) AS tags,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', em.id,
        'role', em.role,
        'content', em.content,
        'created_at', em.created_at
      ) ORDER BY em.created_at ASC)
      FROM echo_messages em
      WHERE em.thread_id = et.id
    ) AS messages
  FROM echo_share_links sl
  JOIN echo_threads et ON et.id = sl.thread_id
  WHERE sl.token = p_token
    AND sl.revoked_at IS NULL;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION echo_share_create(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION echo_share_revoke(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION echo_share_fetch(TEXT) TO anon, authenticated;