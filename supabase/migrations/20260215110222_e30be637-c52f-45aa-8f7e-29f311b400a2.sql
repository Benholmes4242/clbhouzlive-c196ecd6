
-- Fix: Make the function SECURITY DEFINER so it can write to snapshots/movers tables
-- Also add INSERT policies for the pg_cron context

CREATE OR REPLACE FUNCTION public.refresh_college_weekly_movers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_season_id UUID;
  this_monday DATE;
  last_monday DATE;
BEGIN
  SELECT id INTO current_season_id FROM sr_seasons ORDER BY year DESC LIMIT 1;
  
  IF current_season_id IS NULL THEN
    RAISE NOTICE 'No season found, skipping college movers refresh';
    RETURN;
  END IF;
  
  this_monday := date_trunc('week', CURRENT_DATE)::DATE;
  last_monday := this_monday - INTERVAL '7 days';
  
  -- Snapshot current stats as "this week"
  INSERT INTO public.college_stats_snapshots (
    season_id, normalized_name, week_start, week_end,
    earnings_total, wins_total, cuts_total, top10_total, top25_total, player_count, events_total
  )
  SELECT 
    season_id, normalized_name, this_monday, this_monday + INTERVAL '6 days',
    earnings_total, wins_total, cuts_total, top10_total, top25_total, player_count, events_total
  FROM public.college_season_stats
  WHERE season_id = current_season_id
  ON CONFLICT (season_id, normalized_name, week_start) DO UPDATE SET
    earnings_total = EXCLUDED.earnings_total, wins_total = EXCLUDED.wins_total,
    cuts_total = EXCLUDED.cuts_total, top10_total = EXCLUDED.top10_total,
    top25_total = EXCLUDED.top25_total, player_count = EXCLUDED.player_count,
    events_total = EXCLUDED.events_total;
  
  -- Compute movers
  INSERT INTO public.college_weekly_movers (
    season_id, week_start, normalized_name,
    earnings_delta, wins_delta, cuts_delta, top10_delta,
    earnings_rank_this_week, earnings_rank_last_week, earnings_rank_change
  )
  SELECT 
    curr.season_id, curr.week_start, curr.normalized_name,
    curr.earnings_total - COALESCE(prev.earnings_total, 0),
    curr.wins_total - COALESCE(prev.wins_total, 0),
    curr.cuts_total - COALESCE(prev.cuts_total, 0),
    curr.top10_total - COALESCE(prev.top10_total, 0),
    curr_rank.rn, prev_rank.rn,
    COALESCE(prev_rank.rn, curr_rank.rn) - curr_rank.rn
  FROM public.college_stats_snapshots curr
  LEFT JOIN public.college_stats_snapshots prev 
    ON prev.season_id = curr.season_id 
    AND prev.normalized_name = curr.normalized_name
    AND prev.week_start = last_monday
  LEFT JOIN (
    SELECT normalized_name, ROW_NUMBER() OVER (ORDER BY earnings_total DESC) as rn
    FROM public.college_stats_snapshots
    WHERE season_id = current_season_id AND week_start = this_monday
  ) curr_rank ON curr_rank.normalized_name = curr.normalized_name
  LEFT JOIN (
    SELECT normalized_name, ROW_NUMBER() OVER (ORDER BY earnings_total DESC) as rn
    FROM public.college_stats_snapshots
    WHERE season_id = current_season_id AND week_start = last_monday
  ) prev_rank ON prev_rank.normalized_name = curr.normalized_name
  WHERE curr.season_id = current_season_id AND curr.week_start = this_monday
  ON CONFLICT (season_id, normalized_name, week_start) DO UPDATE SET
    earnings_delta = EXCLUDED.earnings_delta, wins_delta = EXCLUDED.wins_delta,
    cuts_delta = EXCLUDED.cuts_delta, top10_delta = EXCLUDED.top10_delta,
    earnings_rank_this_week = EXCLUDED.earnings_rank_this_week,
    earnings_rank_last_week = EXCLUDED.earnings_rank_last_week,
    earnings_rank_change = EXCLUDED.earnings_rank_change;
    
  RAISE NOTICE 'College weekly movers refreshed for week starting %', this_monday;
END $$;
