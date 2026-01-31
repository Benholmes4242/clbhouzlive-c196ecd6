-- Add columns to track Getty photo metadata
ALTER TABLE sr_players 
ADD COLUMN IF NOT EXISTS photo_asset_id TEXT,
ADD COLUMN IF NOT EXISTS photo_updated_at TIMESTAMPTZ;

-- Create index for faster lookups by sr_id
CREATE INDEX IF NOT EXISTS idx_sr_players_sr_id ON sr_players(sr_id);

-- Add comment for documentation
COMMENT ON COLUMN sr_players.photo_asset_id IS 'Getty Images asset ID from SportRadar API';
COMMENT ON COLUMN sr_players.photo_updated_at IS 'Timestamp when photo was last synced from Getty';