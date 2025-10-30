-- Add optional partial index for active game threads (performance optimization)
CREATE INDEX IF NOT EXISTS idx_gt_active 
ON game_threads(expires_at)
WHERE is_closed = false;