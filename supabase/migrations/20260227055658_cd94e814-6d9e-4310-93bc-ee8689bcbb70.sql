
-- Backfill tour_codes for LPGA players who currently have empty arrays
-- Target: all sr_players who appear in LPGA tournament leaderboards but have empty tour_codes
UPDATE sr_players
SET tour_codes = ARRAY['LPGA']
WHERE (tour_codes = '{}' OR tour_codes IS NULL)
  AND id IN (
    SELECT DISTINCT sl.player_id
    FROM sr_leaderboards sl
    JOIN sr_tournaments st ON sl.tournament_id = st.id
    JOIN sr_seasons ss ON st.season_id = ss.id
    WHERE LOWER(ss.tour_name) IN ('lpga', 'lpga tour')
  );
