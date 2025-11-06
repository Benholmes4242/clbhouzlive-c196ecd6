-- Create table for tracking gate access attempts
CREATE TABLE IF NOT EXISTS site_gate_attempts (
  ip TEXT PRIMARY KEY,
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ
);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_site_gate_attempts_last_failed 
ON site_gate_attempts(last_failed_at);

-- Optional: Add cleanup function (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_gate_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM site_gate_attempts
  WHERE last_failed_at < NOW() - INTERVAL '24 hours';
END;
$$;