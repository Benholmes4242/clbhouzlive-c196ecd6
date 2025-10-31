-- Add performance indexes for nearby golfers queries
-- These support the visibility + freshness filtering pattern

-- Index for the main nearby query (visibility_mode != 'hidden' + last_location_update >= ...)
CREATE INDEX IF NOT EXISTS idx_user_nearby_status_visibility_time
  ON public.user_nearby_status (visibility_mode, last_location_update DESC)
  WHERE visibility_mode != 'hidden' AND last_location_update IS NOT NULL;

-- Index for open-to-play filtering (checking active status + expiry)
CREATE INDEX IF NOT EXISTS idx_user_nearby_status_open_to_play
  ON public.user_nearby_status (open_to_play_active, open_to_play_expires_at)
  WHERE open_to_play_active = true;

-- Ensure unique constraint on user_id (prevents duplicate rows per user)
ALTER TABLE public.user_nearby_status
  DROP CONSTRAINT IF EXISTS user_nearby_status_user_id_key;

ALTER TABLE public.user_nearby_status
  ADD CONSTRAINT user_nearby_status_user_id_key UNIQUE (user_id);