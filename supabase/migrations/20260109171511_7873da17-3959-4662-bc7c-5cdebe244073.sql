-- Fix backfill: map state to correct rsvp_status
UPDATE public.game_participants
SET rsvp_status = 'going', rsvp_updated_at = now()
WHERE state = 'accepted' AND rsvp_status = 'invited';

UPDATE public.game_participants
SET rsvp_status = 'invited'
WHERE state = 'invited' AND rsvp_status IS DISTINCT FROM 'invited';

-- Add unique constraint to prevent duplicate participant rows
ALTER TABLE public.game_participants
ADD CONSTRAINT game_participants_game_user_unique UNIQUE (game_id, user_id);