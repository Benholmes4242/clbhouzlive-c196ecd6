ALTER TABLE sr_tournaments
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN sr_tournaments.timezone IS 'IANA timezone for tournament venue. Used by tournament-live-sync for time-of-day gating. Populated by schedule sync from venue data.';