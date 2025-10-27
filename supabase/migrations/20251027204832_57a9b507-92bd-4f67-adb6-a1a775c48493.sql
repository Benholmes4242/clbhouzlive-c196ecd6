-- Update game_beacons table to match the new specification

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_beacons' AND column_name = 'start_time') THEN
    ALTER TABLE game_beacons ADD COLUMN start_time TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_beacons' AND column_name = 'players_needed') THEN
    ALTER TABLE game_beacons ADD COLUMN players_needed INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_beacons' AND column_name = 'status') THEN
    ALTER TABLE game_beacons ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'game_beacons' AND column_name = 'updated_at') THEN
    ALTER TABLE game_beacons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Update existing data to match new game_type format
UPDATE game_beacons SET game_type = '9_holes' WHERE game_type = '9';
UPDATE game_beacons SET game_type = '18_holes' WHERE game_type = '18';
UPDATE game_beacons SET game_type = 'casual_golf' WHERE game_type IN ('range', 'casual');
UPDATE game_beacons SET game_type = 'practice' WHERE game_type NOT IN ('9_holes', '18_holes', 'casual_golf', 'practice');

-- Update RLS policies to allow hosts to update their own beacons
DROP POLICY IF EXISTS "users can update their own beacons" ON game_beacons;

CREATE POLICY "users can update their own beacons"
ON game_beacons
FOR UPDATE
USING (host_user_id = auth.uid())
WITH CHECK (host_user_id = auth.uid());

-- Add regular index for efficient queries
CREATE INDEX IF NOT EXISTS idx_game_beacons_status_expires 
ON game_beacons(status, expires_at);

-- Add constraint to validate status values
ALTER TABLE game_beacons DROP CONSTRAINT IF EXISTS game_beacons_status_check;
ALTER TABLE game_beacons ADD CONSTRAINT game_beacons_status_check 
CHECK (status IN ('active', 'canceled', 'expired'));

-- Add constraint to validate game_type values
ALTER TABLE game_beacons DROP CONSTRAINT IF EXISTS game_beacons_game_type_check;
ALTER TABLE game_beacons ADD CONSTRAINT game_beacons_game_type_check 
CHECK (game_type IN ('9_holes', '18_holes', 'casual_golf', 'practice'));

-- Add constraint to validate players_needed values
ALTER TABLE game_beacons DROP CONSTRAINT IF EXISTS game_beacons_players_needed_check;
ALTER TABLE game_beacons ADD CONSTRAINT game_beacons_players_needed_check 
CHECK (players_needed >= 1 AND players_needed <= 3);