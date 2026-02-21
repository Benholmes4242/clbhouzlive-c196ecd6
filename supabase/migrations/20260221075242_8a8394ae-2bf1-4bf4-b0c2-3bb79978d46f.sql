
CREATE OR REPLACE FUNCTION public.refresh_college_season_stats(target_season_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
BEGIN
  IF target_season_id IS NOT NULL THEN
    v_season_id := target_season_id;
  ELSE
    SELECT id INTO v_season_id
    FROM sr_seasons
    WHERE tour_name = 'pga'
    ORDER BY year DESC
    LIMIT 1;
  END IF;

  IF v_season_id IS NULL THEN
    RAISE NOTICE 'No season found';
    RETURN;
  END IF;

  DELETE FROM college_season_stats WHERE season_id = v_season_id;

  INSERT INTO college_season_stats (
    normalized_name, season_id, player_count,
    wins_total, top10_total, top25_total, cuts_total, earnings_total, events_total,
    avg_driving_distance, avg_driving_accuracy, avg_gir, avg_putting,
    avg_scrambling, avg_sand_saves, avg_sg_total, avg_scoring
  )
  SELECT
    cm.normalized_name,
    v_season_id,
    COUNT(DISTINCT ps.player_id),
    COALESCE(SUM((ps.raw_data->'statistics'->>'first_place')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_10')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_25')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'cuts_made')::int), 0),
    COALESCE(SUM(ps.earnings), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'events_played')::int), 0),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'drives'->>'avg_distance') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'drives'->>'avg_distance')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'drives'->>'drive_accuracy') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'drives'->>'drive_accuracy')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'greens_in_regulation'->>'pct') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'greens_in_regulation'->>'pct')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'putting'->>'avg_putts') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'putting'->>'avg_putts')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'scrambling'->>'pct') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'scrambling'->>'pct')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'sand_saves'->>'pct') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'sand_saves'->>'pct')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->'strokes_gained'->>'total') IS NOT NULL
         THEN (ps.raw_data->'statistics'->'strokes_gained'->>'total')::numeric END),
    AVG(CASE WHEN (ps.raw_data->'statistics'->>'scoring_average') IS NOT NULL
         THEN (ps.raw_data->'statistics'->>'scoring_average')::numeric END)
  FROM sr_player_statistics ps
  JOIN sr_players sp ON sp.id = ps.player_id
  JOIN college_media cm ON cm.normalized_name = sp.college_normalized
  WHERE ps.season_id = v_season_id
    AND sp.college_normalized IS NOT NULL
  GROUP BY cm.normalized_name;

  RAISE NOTICE 'Refreshed college_season_stats for season %', v_season_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_college_season_stats_auto()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
BEGIN
  SELECT ps.season_id INTO v_season_id
  FROM sr_player_statistics ps
  JOIN sr_seasons s ON s.id = ps.season_id
  WHERE s.tour_name = 'pga'
    AND ps.earnings > 0
  ORDER BY s.year DESC
  LIMIT 1;

  IF v_season_id IS NULL THEN
    RAISE NOTICE 'refresh_college_season_stats_auto: no season with stats found';
    RETURN;
  END IF;

  PERFORM refresh_college_season_stats(v_season_id);
  RAISE NOTICE 'Auto-refresh targeted season %', v_season_id;
END;
$$;
