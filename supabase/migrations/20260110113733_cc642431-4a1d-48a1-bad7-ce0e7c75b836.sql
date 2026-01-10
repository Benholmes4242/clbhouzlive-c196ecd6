-- Allow null player_id on event_winners for "Champion unlocking soon" pending state
ALTER TABLE public.event_winners ALTER COLUMN player_id DROP NOT NULL;