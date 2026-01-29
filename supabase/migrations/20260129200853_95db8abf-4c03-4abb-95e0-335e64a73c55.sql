-- Add last_live_sync column to track when each tournament was last synced
ALTER TABLE sr_tournaments 
ADD COLUMN IF NOT EXISTS last_live_sync TIMESTAMPTZ;

-- Add index for finding live tournaments quickly
CREATE INDEX IF NOT EXISTS idx_sr_tournaments_status 
ON sr_tournaments(status) 
WHERE status = 'inprogress';

-- Add index for last_live_sync for monitoring
CREATE INDEX IF NOT EXISTS idx_sr_tournaments_last_live_sync 
ON sr_tournaments(last_live_sync DESC NULLS LAST);

-- Create a table to track cron job status
CREATE TABLE IF NOT EXISTS sr_cron_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  last_run TIMESTAMPTZ,
  last_status TEXT,
  last_duration_ms INTEGER,
  last_error TEXT,
  tournaments_synced INTEGER,
  records_synced INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial status rows for our cron jobs
INSERT INTO sr_cron_status (job_name, last_status) 
VALUES 
  ('live-tournament-sync', 'pending'),
  ('daily-schedule-sync', 'pending')
ON CONFLICT (job_name) DO NOTHING;

-- Enable RLS on sr_cron_status
ALTER TABLE sr_cron_status ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cron status (for admin UI)
CREATE POLICY "Anyone can read cron status" 
ON sr_cron_status FOR SELECT 
USING (true);