-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_nearby_status' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.user_nearby_status 
    ADD COLUMN location GEOGRAPHY(Point, 4326);
  END IF;
END$$;

-- Create index for location
CREATE INDEX IF NOT EXISTS idx_user_nearby_status_location 
  ON public.user_nearby_status USING gist (location);

-- Migrate existing lat/lng data to geography column
UPDATE public.user_nearby_status
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;

-- Add open_to_play column if needed
ALTER TABLE public.user_nearby_status 
  ADD COLUMN IF NOT EXISTS open_to_play BOOLEAN DEFAULT false;

UPDATE public.user_nearby_status
SET open_to_play = COALESCE(open_to_play_active, false)
WHERE open_to_play = false OR open_to_play IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_nearby_status_visibility 
  ON public.user_nearby_status (COALESCE(visibility_mode, 'everyone'));

CREATE INDEX IF NOT EXISTS idx_user_nearby_status_open_to_play 
  ON public.user_nearby_status (open_to_play);

-- RPC function for fast geo queries
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
  ORDER BY distance_m ASC
  LIMIT limit_rows OFFSET offset_rows;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.nearby_golfers(UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, TEXT, INT, INT) TO anon, authenticated;