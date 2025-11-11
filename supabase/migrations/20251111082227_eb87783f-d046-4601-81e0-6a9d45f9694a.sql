-- Create echo_events table for analytics tracking
CREATE TABLE IF NOT EXISTS echo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  props JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS echo_events_user_id_idx ON echo_events (user_id);
CREATE INDEX IF NOT EXISTS echo_events_name_idx ON echo_events (name);
CREATE INDEX IF NOT EXISTS echo_events_created_at_idx ON echo_events (created_at DESC);
CREATE INDEX IF NOT EXISTS echo_events_name_time_idx ON echo_events (name, created_at DESC);

-- Enable RLS
ALTER TABLE echo_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert their own events" ON echo_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all events" ON echo_events
  FOR SELECT
  USING (public.is_admin());