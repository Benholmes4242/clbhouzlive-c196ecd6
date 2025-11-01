-- =============================
-- Phase 4: Performance Indexes
-- Discovery + Fuzzy Search
-- =============================

-- 1) Composite index for game discovery queries
CREATE INDEX IF NOT EXISTS games_discovery_idx
ON public.games (status, visibility, expires_at, lat, lng);

-- 2) Index for time-based filtering
CREATE INDEX IF NOT EXISTS games_start_time_idx
ON public.games (start_time) WHERE status = 'active';

-- 3) Trigram index for fuzzy course search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS games_course_name_trgm
ON public.games USING GIN (course_name_normalized gin_trgm_ops);

-- 4) Index for slots-based sorting
CREATE INDEX IF NOT EXISTS games_slots_open_idx
ON public.games (slots_open DESC) WHERE status = 'active';