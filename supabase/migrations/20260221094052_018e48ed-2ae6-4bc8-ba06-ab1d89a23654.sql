
-- Enable unaccent extension if not already enabled
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create player matching RPC function
CREATE OR REPLACE FUNCTION match_tour_rankings_players()
RETURNS void AS $$
BEGIN
  -- Exact match: UPPER(LASTNAME, Firstname)
  UPDATE tour_season_rankings tsr
  SET player_id = sp.id
  FROM sr_players sp
  WHERE tsr.player_id IS NULL
    AND UPPER(tsr.player_name) = UPPER(sp.last_name || ', ' || sp.first_name);

  -- Fuzzy match: scraped last name + first name against sr_players with EURO tour code
  UPDATE tour_season_rankings tsr
  SET player_id = matched.id
  FROM (
    SELECT DISTINCT ON (tsr2.player_name) tsr2.player_name, sp.id
    FROM tour_season_rankings tsr2
    JOIN sr_players sp ON (
      sp.last_name ILIKE TRIM(SPLIT_PART(tsr2.player_name, ',', 1)) || '%'
      AND sp.first_name ILIKE TRIM(SPLIT_PART(tsr2.player_name, ',', 2)) || '%'
      AND 'EURO' = ANY(sp.tour_codes)
    )
    WHERE tsr2.player_id IS NULL
    ORDER BY tsr2.player_name, sp.last_name
  ) matched
  WHERE tsr.player_name = matched.player_name AND tsr.player_id IS NULL;

  -- Accent-stripped match
  UPDATE tour_season_rankings tsr
  SET player_id = sp.id
  FROM sr_players sp
  WHERE tsr.player_id IS NULL
    AND UPPER(unaccent(tsr.player_name)) = UPPER(unaccent(sp.last_name || ', ' || sp.first_name));

  -- Also apply manual_player_id overrides
  UPDATE tour_season_rankings
  SET player_id = manual_player_id
  WHERE manual_player_id IS NOT NULL AND player_id IS NULL;
END;
$$ LANGUAGE plpgsql;
