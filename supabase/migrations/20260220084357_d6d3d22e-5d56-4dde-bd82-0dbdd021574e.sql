
-- Add 8 category average columns to college_season_stats
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_driving_distance numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_driving_accuracy numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_gir numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_putting numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_scrambling numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_sand_saves numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_sg_total numeric;
ALTER TABLE public.college_season_stats ADD COLUMN IF NOT EXISTS avg_scoring numeric;

-- Drop and recreate the refresh function with updated logic
DROP FUNCTION IF EXISTS public.refresh_college_season_stats(uuid);

CREATE FUNCTION public.refresh_college_season_stats(target_season_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.college_season_stats WHERE season_id = target_season_id;

  INSERT INTO public.college_season_stats (
    normalized_name, season_id, player_count,
    earnings_total, wins_total, cuts_total, top10_total, top25_total, events_total,
    avg_driving_distance, avg_driving_accuracy, avg_gir, avg_putting,
    avg_scrambling, avg_sand_saves, avg_sg_total, avg_scoring
  )
  SELECT
    p.college_normalized,
    ps.season_id,
    COUNT(DISTINCT p.id),
    COALESCE(SUM((ps.raw_data->'statistics'->>'earnings')::numeric), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'wins')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'cuts_made')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_10')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'top_25')::int), 0),
    COALESCE(SUM((ps.raw_data->'statistics'->>'events_played')::int), 0),
    ROUND(AVG((ps.raw_data->'statistics'->>'drive_avg')::numeric), 1),
    ROUND(AVG((ps.raw_data->'statistics'->>'drive_acc')::numeric), 1),
    ROUND(AVG((ps.raw_data->'statistics'->>'gir_pct')::numeric), 1),
    ROUND(AVG((ps.raw_data->'statistics'->>'putt_avg')::numeric), 3),
    ROUND(AVG((ps.raw_data->'statistics'->>'scrambling_pct')::numeric), 1),
    ROUND(AVG((ps.raw_data->'statistics'->>'sand_saves_pct')::numeric), 1),
    ROUND(AVG((ps.raw_data->'statistics'->>'strokes_gained_total')::numeric), 3),
    ROUND(AVG((ps.raw_data->'statistics'->>'scoring_avg')::numeric), 2)
  FROM public.sr_players p
  INNER JOIN public.sr_player_statistics ps ON ps.player_id = p.id
  WHERE ps.season_id = target_season_id
    AND p.college_normalized IS NOT NULL
  GROUP BY p.college_normalized, ps.season_id;
END;
$$;

-- Drop and recreate the auto function
DROP FUNCTION IF EXISTS public.refresh_college_season_stats_auto();

CREATE FUNCTION public.refresh_college_season_stats_auto()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_season_id uuid;
BEGIN
  SELECT ps.season_id INTO target_season_id
  FROM public.sr_player_statistics ps
  INNER JOIN public.sr_seasons s ON s.id = ps.season_id
  WHERE s.year = (SELECT MAX(year) FROM public.sr_seasons)
  GROUP BY ps.season_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF target_season_id IS NULL THEN
    RAISE NOTICE 'No season found with player statistics';
    RETURN;
  END IF;

  RAISE NOTICE 'Auto-refreshing college stats for season %', target_season_id;
  PERFORM public.refresh_college_season_stats(target_season_id);
END;
$$;
