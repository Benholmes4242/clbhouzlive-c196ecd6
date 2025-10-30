-- =====================================================
-- MIGRATION: Game System - Phase 1 (Schema Changes)
-- =====================================================

-- 1) Drop old policies
DROP POLICY IF EXISTS "anyone can read active beacons" ON game_beacons;
DROP POLICY IF EXISTS "users can create their own game beacons" ON game_beacons;
DROP POLICY IF EXISTS "users can update their own beacons" ON game_beacons;

-- 2) Handle start_time/tee_time consolidation
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_beacons' AND column_name='start_time')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_beacons' AND column_name='tee_time') THEN
    UPDATE game_beacons SET start_time = COALESCE(start_time, tee_time);
    ALTER TABLE game_beacons DROP COLUMN tee_time;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_beacons' AND column_name='tee_time')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='game_beacons' AND column_name='start_time') THEN
    ALTER TABLE game_beacons RENAME COLUMN tee_time TO start_time;
  END IF;
END $migration$;

-- 3) Drop legacy columns
ALTER TABLE game_beacons DROP COLUMN IF EXISTS is_active;
ALTER TABLE game_beacons DROP COLUMN IF EXISTS participants;
ALTER TABLE game_beacons DROP COLUMN IF EXISTS host_handicap;
ALTER TABLE game_beacons DROP COLUMN IF EXISTS other_player_handicaps;
ALTER TABLE game_beacons DROP COLUMN IF EXISTS game_type;

-- 4) Add new columns
ALTER TABLE game_beacons ADD COLUMN IF NOT EXISTS slots_total smallint NOT NULL DEFAULT 4;
ALTER TABLE game_beacons ADD COLUMN IF NOT EXISTS slots_open smallint NOT NULL DEFAULT 3;
ALTER TABLE game_beacons ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE game_beacons ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES golf_courses(id);

-- 5) Rename table to games
ALTER TABLE game_beacons RENAME TO games;

-- 6) Add constraints (with conditional checks)
DO $constraints$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_slots_total') THEN
    ALTER TABLE games ADD CONSTRAINT chk_slots_total CHECK (slots_total BETWEEN 1 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_slots_open') THEN
    ALTER TABLE games ADD CONSTRAINT chk_slots_open CHECK (slots_open BETWEEN 0 AND slots_total);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_visibility') THEN
    ALTER TABLE games ADD CONSTRAINT chk_visibility CHECK (visibility IN ('public','friends','club'));
  END IF;
END $constraints$;

-- 7) Add indexes
CREATE INDEX IF NOT EXISTS idx_games_status_expires ON games(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_games_geo ON games(lat, lng) WHERE status = 'active';

-- 8) Enhance game_join_requests
ALTER TABLE game_join_requests ADD COLUMN IF NOT EXISTS decided_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS ux_join_req_unique ON game_join_requests(game_id, requester_user_id);

-- Update policies to reference games table
DROP POLICY IF EXISTS "Game hosts can update requests for their games" ON game_join_requests;
DROP POLICY IF EXISTS "Game hosts can view requests for their games" ON game_join_requests;

CREATE POLICY "Game hosts can update requests for their games"
  ON game_join_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM games g WHERE g.id = game_join_requests.game_id AND g.host_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM games g WHERE g.id = game_join_requests.game_id AND g.host_user_id = auth.uid()));

CREATE POLICY "Game hosts can view requests for their games"
  ON game_join_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM games g WHERE g.id = game_join_requests.game_id AND g.host_user_id = auth.uid()));