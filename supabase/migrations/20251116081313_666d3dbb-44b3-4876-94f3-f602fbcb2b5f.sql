-- Phase 2: Robustness & Safety Updates

-- Ticket 7: Add staleness constant and cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_open_to_play()
RETURNS void AS $$
BEGIN
  UPDATE public.user_nearby_status
  SET open_to_play_active = false
  WHERE open_to_play_active = true
    AND open_to_play_expires_at IS NOT NULL
    AND open_to_play_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ticket 8: User blocking system
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_blocks
CREATE POLICY "users_can_manage_their_blocks"
ON public.user_blocks
FOR ALL
USING (auth.uid() = blocker_id)
WITH CHECK (auth.uid() = blocker_id);

-- Ticket 7 & 8: Update nearby_golfers RPC with staleness rule and blocking
CREATE OR REPLACE FUNCTION public.nearby_golfers(
  me UUID,
  my_lat DOUBLE PRECISION,
  my_lng DOUBLE PRECISION,
  max_km DOUBLE PRECISION DEFAULT 10,
  only_open BOOLEAN DEFAULT false,
  visibility_filter TEXT DEFAULT 'everyone',
  limit_rows INT DEFAULT 30,
  offset_rows INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  username TEXT,
  profile_photo_url TEXT,
  eg_handicap_index NUMERIC,
  home_club TEXT,
  distance_m DOUBLE PRECISION,
  open_to_play BOOLEAN,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) 
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me_point AS (
    SELECT ST_SetSRID(ST_MakePoint(my_lng, my_lat), 4326)::GEOGRAPHY AS g
  )
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.profile_photo_url,
    p.eg_handicap_index,
    p.home_club,
    ST_Distance(n.location, (SELECT g FROM me_point)) AS distance_m,
    n.open_to_play,
    ST_Y(n.location::geometry) AS latitude,
    ST_X(n.location::geometry) AS longitude
  FROM public.user_nearby_status n
  JOIN public.user_profiles p ON p.id = n.user_id
  WHERE
    n.location IS NOT NULL
    -- Staleness rule: ignore locations older than 5 minutes
    AND n.last_location_update IS NOT NULL
    AND n.last_location_update > (now() - interval '5 minutes')
    -- Visibility filter
    AND (
      visibility_filter = 'all'
      OR (visibility_filter = 'everyone' AND COALESCE(n.visibility_mode, 'everyone') = 'everyone')
      OR (
        visibility_filter = 'friends'
        AND EXISTS (
          SELECT 1 FROM public.user_follows f
          WHERE (f.follower_id = me AND f.following_id = n.user_id)
             OR (f.follower_id = n.user_id AND f.following_id = me)
        )
      )
    )
    -- Open to play filter
    AND (NOT only_open OR n.open_to_play = true)
    -- Geo radius
    AND ST_DWithin(n.location, (SELECT g FROM me_point), max_km * 1000)
    -- Exclude self
    AND n.user_id <> COALESCE(me, '00000000-0000-0000-0000-000000000000'::UUID)
    -- Blocking: exclude users you've blocked and users who've blocked you
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE
        (b.blocker_id = me AND b.blocked_id = n.user_id)
        OR
        (b.blocker_id = n.user_id AND b.blocked_id = me)
    )
  ORDER BY distance_m ASC
  LIMIT limit_rows OFFSET offset_rows;
$$;