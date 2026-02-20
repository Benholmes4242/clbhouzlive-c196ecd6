-- Fix refresh_college_season_stats_auto() to target the latest season that actually has player stats
-- (Option B: track only the current/latest season instead of LIMIT 1 from existing college_season_stats)
CREATE OR REPLACE FUNCTION public.refresh_college_season_stats_auto()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_season_id UUID;
  result INTEGER;
BEGIN
  -- Get the latest season that actually has player statistics data
  -- This ensures we always track the most current season with real data
  SELECT ps.season_id INTO target_season_id
  FROM public.sr_player_statistics ps
  INNER JOIN public.sr_seasons s ON s.id = ps.season_id
  WHERE s.year = (SELECT MAX(s2.year) FROM public.sr_seasons s2 
                  INNER JOIN public.sr_player_statistics ps2 ON ps2.season_id = s2.id)
  GROUP BY ps.season_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  IF target_season_id IS NULL THEN
    RAISE NOTICE 'No season with player statistics found, skipping college stats refresh';
    RETURN 0;
  END IF;
  
  result := public.refresh_college_season_stats(target_season_id);
  RAISE NOTICE 'Refreshed college season stats: % rows for season %', result, target_season_id;
  RETURN result;
END;
$$;