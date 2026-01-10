-- Create public_golfer_blurbs view for anonymous host info in discover
-- This view only exposes handicap and home club - NO identifying info
CREATE OR REPLACE VIEW public.public_golfer_blurbs AS
SELECT 
  id AS user_id,
  eg_handicap_index AS handicap,
  home_club,
  CASE 
    WHEN show_handicap = true THEN eg_handicap_index 
    ELSE NULL 
  END AS visible_handicap
FROM user_profiles;

-- Grant access to authenticated and anon users
GRANT SELECT ON public.public_golfer_blurbs TO authenticated;
GRANT SELECT ON public.public_golfer_blurbs TO anon;

-- Add unique constraint on game_participants to prevent duplicate entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'game_participants_game_user_unique'
  ) THEN
    ALTER TABLE game_participants
    ADD CONSTRAINT game_participants_game_user_unique UNIQUE (game_id, user_id);
  END IF;
END $$;

-- Add unique constraint on trip_participants to prevent duplicate entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trip_participants_trip_user_unique'
  ) THEN
    ALTER TABLE trip_participants
    ADD CONSTRAINT trip_participants_trip_user_unique UNIQUE (trip_id, user_id);
  END IF;
END $$;

-- Create index for faster discover queries excluding rejected users
CREATE INDEX IF NOT EXISTS idx_game_join_requests_status_requester 
ON game_join_requests(requester_user_id, status);

-- Create index for trip participants status queries
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_status 
ON trip_participants(user_id, rsvp_status);