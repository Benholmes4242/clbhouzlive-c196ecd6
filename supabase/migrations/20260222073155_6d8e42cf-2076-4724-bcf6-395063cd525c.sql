CREATE OR REPLACE FUNCTION populate_tour_ranking_wins()
RETURNS void AS $$
BEGIN
  UPDATE tour_season_rankings tsr
  SET wins = sub.win_count,
      updated_at = now()::text
  FROM (
    SELECT
      lb.player_id,
      CASE s.tour_name
        WHEN 'EURO' THEN 'euro'
        WHEN 'LPGA' THEN 'lpga'
        WHEN 'PGAD' THEN 'pgad'
        WHEN 'LIV' THEN 'liv'
        ELSE lower(s.tour_name)
      END AS tour_code,
      s.year AS season_year,
      COUNT(*) AS win_count
    FROM sr_leaderboards lb
    JOIN sr_tournaments t ON lb.tournament_id = t.id
    JOIN sr_seasons s ON t.season_id = s.id
    WHERE lb.position = 1
      AND s.tour_name IN ('EURO', 'LPGA', 'PGAD', 'LIV')
    GROUP BY lb.player_id, s.tour_name, s.year
  ) sub
  WHERE tsr.player_id = sub.player_id
    AND tsr.tour_code = sub.tour_code
    AND tsr.season_year = sub.season_year;
END;
$$ LANGUAGE plpgsql;