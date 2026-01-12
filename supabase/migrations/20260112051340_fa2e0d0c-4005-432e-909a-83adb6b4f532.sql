-- ============================================================
-- Soft-deprecate tourhub_* tables by renaming with _deprecated suffix
-- This allows verification before permanent removal
-- ============================================================

-- 1. Rename tourhub_events to tourhub_events_deprecated
ALTER TABLE IF EXISTS public.tourhub_events 
  RENAME TO tourhub_events_deprecated;

-- 2. Rename tourhub_players to tourhub_players_deprecated  
ALTER TABLE IF EXISTS public.tourhub_players 
  RENAME TO tourhub_players_deprecated;

-- 3. Add comments explaining deprecation
COMMENT ON TABLE public.tourhub_events_deprecated IS 
  'DEPRECATED: Replaced by sr_tournaments. Scheduled for removal after verification. Renamed on 2026-01-12.';

COMMENT ON TABLE public.tourhub_players_deprecated IS 
  'DEPRECATED: Replaced by sr_players + sr_player_statistics. Scheduled for removal after verification. Renamed on 2026-01-12.';

-- Note: tourhub_leaderboard_snapshots is kept as it may serve a different purpose (historical snapshots)