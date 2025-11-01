
-- ============================================================
-- Phase 1: Game Discovery Foundation - Indexes & Security
-- ============================================================

-- 1. Recreate user_can_see_game() function (keeping existing parameter names for RLS compatibility)
CREATE OR REPLACE FUNCTION public.user_can_see_game(
  _game_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = _game_id
    AND (
      -- Host can always see their own game
      g.host_user_id = _user_id
      OR
      -- User is a participant (invited or accepted)
      EXISTS (
        SELECT 1 FROM public.game_participants gp
        WHERE gp.game_id = g.id
        AND gp.user_id = _user_id
        AND gp.state IN ('invited', 'accepted')
      )
      OR
      -- Game is public, active, and not expired
      (
        g.visibility = 'public'
        AND g.status = 'active'
        AND g.expires_at > now()
      )
    )
  );
$$;

COMMENT ON FUNCTION public.user_can_see_game IS 
  'Security definer function to check if a user can see a game. Returns true if: user is host, user is participant, or game is public/active/not-expired.';

-- 2. Add performance indexes for game discovery queries

-- Composite index for active public games sorted by time
CREATE INDEX IF NOT EXISTS idx_games_active_visibility_time
  ON public.games (visibility, status, expires_at DESC, start_time ASC)
  WHERE status = 'active' AND visibility = 'public';

COMMENT ON INDEX idx_games_active_visibility_time IS 
  'Optimizes queries for active public games sorted by expiry and start time';

-- Index for course-specific game searches
CREATE INDEX IF NOT EXISTS idx_games_course_time
  ON public.games (course_id, start_time ASC)
  WHERE status = 'active' AND course_id IS NOT NULL;

COMMENT ON INDEX idx_games_course_time IS 
  'Optimizes queries for games at a specific course, sorted by start time';

-- Spatial index for proximity-based searches (bounding box queries)
CREATE INDEX IF NOT EXISTS idx_games_lat_lng
  ON public.games (lat, lng)
  WHERE status = 'active' AND visibility = 'public' AND lat IS NOT NULL AND lng IS NOT NULL;

COMMENT ON INDEX idx_games_lat_lng IS 
  'Optimizes proximity-based queries for active public games with geo coordinates';

-- Enable pg_trgm extension for fuzzy course name searches (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN index for fuzzy course name searches
CREATE INDEX IF NOT EXISTS idx_games_course_name_trgm
  ON public.games USING gin (course_name_normalized gin_trgm_ops)
  WHERE course_name_normalized IS NOT NULL;

COMMENT ON INDEX idx_games_course_name_trgm IS 
  'Enables fast fuzzy text search on normalized course names using trigram matching';

-- Index for pagination cursors (start_time, id)
CREATE INDEX IF NOT EXISTS idx_games_pagination
  ON public.games (start_time ASC, id ASC)
  WHERE status = 'active';

COMMENT ON INDEX idx_games_pagination IS 
  'Supports cursor-based pagination for stable game ordering';

-- Index for host's games lookup
CREATE INDEX IF NOT EXISTS idx_games_host_status
  ON public.games (host_user_id, status, expires_at DESC)
  WHERE status IN ('active', 'at_capacity');

COMMENT ON INDEX idx_games_host_status IS 
  'Optimizes queries for a user''s hosted games';
