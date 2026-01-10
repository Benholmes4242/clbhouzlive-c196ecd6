-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add trigram GIN index on games for fast ILIKE search
CREATE INDEX IF NOT EXISTS idx_games_course_name_search_trgm 
ON public.games USING gin (lower(course_name) gin_trgm_ops);

-- Add btree index on start_time for date range filtering (no partial index due to now() not being immutable)
CREATE INDEX IF NOT EXISTS idx_games_start_time_discover 
ON public.games USING btree (start_time);

-- Add btree index on visibility for filtering
CREATE INDEX IF NOT EXISTS idx_games_visibility_discover 
ON public.games USING btree (visibility, status);

-- Trips indexes for discover_trips_anon view
CREATE INDEX IF NOT EXISTS idx_trips_name_search_trgm 
ON public.trips USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_trips_start_date_discover 
ON public.trips USING btree (start_date);

CREATE INDEX IF NOT EXISTS idx_trips_visibility_discover 
ON public.trips USING btree (visibility, status);