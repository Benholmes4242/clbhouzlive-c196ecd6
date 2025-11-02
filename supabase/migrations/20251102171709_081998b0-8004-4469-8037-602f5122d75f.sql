-- Drop any existing unique index that prevents multiple active games per host
DROP INDEX IF EXISTS public.one_active_game_per_host;

-- Verify no other constraints exist
-- This is a safety check migration to ensure multiple active games are allowed