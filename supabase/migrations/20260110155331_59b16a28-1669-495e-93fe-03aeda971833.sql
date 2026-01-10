-- Phase 2A: Add request_message columns to participant tables

-- Games: Add request_message columns
ALTER TABLE public.game_participants
ADD COLUMN IF NOT EXISTS request_message text NULL,
ADD COLUMN IF NOT EXISTS request_message_updated_at timestamptz NULL;

-- Trips: Add request_message columns
ALTER TABLE public.trip_participants
ADD COLUMN IF NOT EXISTS request_message text NULL,
ADD COLUMN IF NOT EXISTS request_message_updated_at timestamptz NULL;

-- Add index for host inbox performance on games (partial index for requested status)
CREATE INDEX IF NOT EXISTS idx_game_participants_host_inbox 
ON public.game_participants (game_id, rsvp_status, created_at DESC)
WHERE rsvp_status = 'requested';

-- Add index for host inbox performance on trips (partial index for requested status)
CREATE INDEX IF NOT EXISTS idx_trip_participants_host_inbox 
ON public.trip_participants (trip_id, rsvp_status, created_at DESC)
WHERE rsvp_status = 'requested';

-- Add comment for documentation
COMMENT ON COLUMN public.game_participants.request_message IS 'Optional message from requester to host (max 240 chars)';
COMMENT ON COLUMN public.trip_participants.request_message IS 'Optional message from requester to host (max 240 chars)';