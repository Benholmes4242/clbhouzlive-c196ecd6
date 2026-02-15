
-- Create a wrapper that auto-detects the active season
CREATE OR REPLACE FUNCTION public.refresh_college_season_stats_auto()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_season_id UUID;
  result INTEGER;
BEGIN
  SELECT DISTINCT season_id INTO target_season_id 
  FROM public.college_season_stats 
  LIMIT 1;
  
  IF target_season_id IS NULL THEN
    SELECT id INTO target_season_id 
    FROM public.sr_seasons 
    ORDER BY year DESC 
    LIMIT 1;
  END IF;
  
  IF target_season_id IS NULL THEN
    RAISE NOTICE 'No season found, skipping college stats refresh';
    RETURN 0;
  END IF;
  
  result := public.refresh_college_season_stats(target_season_id);
  RAISE NOTICE 'Refreshed college season stats: % rows for season %', result, target_season_id;
  RETURN result;
END $$;
