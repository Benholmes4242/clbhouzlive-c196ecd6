-- Drop existing rate limits table (wrong schema)
DROP TABLE IF EXISTS echo_rate_limits CASCADE;

-- FIX 7: Rate limit persistence table with correct schema
CREATE TABLE echo_rate_limits (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, window_start, window_type)
);

ALTER TABLE echo_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_echo_rate_limits_window ON echo_rate_limits (window_start);

-- FIX 7: Atomic increment RPC for rate limits
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_user_id UUID,
  p_window_type TEXT,
  p_window_start TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  INSERT INTO echo_rate_limits (user_id, window_type, window_start, request_count)
  VALUES (p_user_id, p_window_type, p_window_start, 1)
  ON CONFLICT (user_id, window_start, window_type)
  DO UPDATE SET request_count = echo_rate_limits.request_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX 8: Response caching table
CREATE TABLE IF NOT EXISTS echo_response_cache (
  query_hash TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 1
);

ALTER TABLE echo_response_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_echo_cache_created ON echo_response_cache (created_at);

-- FIX 9: Data cleanup function (can be called manually or via cron)
CREATE OR REPLACE FUNCTION cleanup_echo_data() RETURNS void AS $$
BEGIN
  -- Delete messages from old unpinned conversations (90 days)
  DELETE FROM echo_conversation_messages 
  WHERE conversation_id IN (
    SELECT id FROM echo_conversations 
    WHERE pinned = false 
    AND last_message_at < NOW() - INTERVAL '90 days'
  );
  
  -- Delete old unpinned conversations (90 days)
  DELETE FROM echo_conversations 
  WHERE pinned = false 
  AND last_message_at < NOW() - INTERVAL '90 days';
  
  -- Clean up rate limit records older than 2 days
  DELETE FROM echo_rate_limits 
  WHERE window_start < NOW() - INTERVAL '2 days';
  
  -- Clean up response cache older than 7 days
  DELETE FROM echo_response_cache 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;