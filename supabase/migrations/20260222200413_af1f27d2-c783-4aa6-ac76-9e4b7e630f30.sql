CREATE OR REPLACE FUNCTION compute_player_ratings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_season_id uuid;
  v_player_count integer;
  rec RECORD;
  v_scoring_pct numeric;
  v_sg_pct numeric;
  v_ranking_pct numeric;
  v_results_pct numeric;
  v_ball_striking_pct numeric;
  v_short_game_pct numeric;
  v_power_pct numeric;
  v_total_rating integer;
  v_tier text;
  v_breakdown jsonb;
  v_prev_rating integer;
BEGIN
  SELECT id INTO v_season_id
  FROM sr_seasons
  WHERE tour_name = 'pga' AND year = EXTRACT(YEAR FROM CURRENT_DATE)
  LIMIT 1;

  IF v_season_id IS NULL THEN
    RAISE NOTICE 'No active season found';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_player_count
  FROM sr_player_statistics
  WHERE season_id = v_season_id AND events_played >= 3;

  IF v_player_count = 0 THEN
    RAISE NOTICE 'No eligible players found';
    RETURN;
  END IF;

  FOR rec IN
    SELECT
      ps.player_id,
      ps.scoring_average,
      ps.driving_distance,
      ps.driving_accuracy,
      ps.greens_in_reg,
      ps.putting_average,
      ps.sand_saves,
      ps.events_played,
      ps.wins,
      ps.top_10s,
      ps.cuts_made,
      ps.earnings,
      COALESCE((ps.raw_data->'statistics'->>'strokes_gained_total')::numeric, 0) AS sg_total,
      COALESCE((ps.raw_data->'statistics'->>'scrambling_pct')::numeric, 0) AS scrambling_pct,
      COALESCE((ps.raw_data->'statistics'->>'world_rank')::integer, 999) AS world_ranking
    FROM sr_player_statistics ps
    WHERE ps.season_id = v_season_id
      AND ps.events_played >= 3
  LOOP
    -- Scoring percentile (lower is better)
    SELECT (COUNT(*) FILTER (WHERE scoring_average > rec.scoring_average))::numeric / v_player_count * 100
    INTO v_scoring_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3 AND scoring_average IS NOT NULL;

    -- SG Total percentile
    SELECT (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'strokes_gained_total')::numeric, 0) < rec.sg_total))::numeric / v_player_count * 100
    INTO v_sg_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- World Ranking percentile (lower rank is better)
    SELECT (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'world_rank')::integer, 999) > rec.world_ranking))::numeric / v_player_count * 100
    INTO v_ranking_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- FIX A: Results with sample size dampening
    v_results_pct := LEAST(100, (
      CASE WHEN rec.events_played > 0 THEN
        (COALESCE(rec.wins, 0)::numeric / rec.events_played * 100 * 1.5
          * LEAST(rec.events_played, 10)::numeric / 10) +
        (COALESCE(rec.top_10s, 0)::numeric / rec.events_played * 100
          * LEAST(rec.events_played, 10)::numeric / 10)
      ELSE 0 END
    ));

    -- Ball striking percentile
    SELECT (
      (COUNT(*) FILTER (WHERE greens_in_reg < rec.greens_in_reg))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE driving_accuracy < rec.driving_accuracy))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_ball_striking_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- Short game percentile
    SELECT (
      (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'scrambling_pct')::numeric, 0) < rec.scrambling_pct))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE sand_saves < rec.sand_saves))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_short_game_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- Power percentile
    SELECT (COUNT(*) FILTER (WHERE driving_distance < rec.driving_distance))::numeric / v_player_count * 100
    INTO v_power_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3 AND driving_distance IS NOT NULL;

    -- Null coalesce
    v_scoring_pct := COALESCE(v_scoring_pct, 50);
    v_sg_pct := COALESCE(v_sg_pct, 50);
    v_ranking_pct := COALESCE(v_ranking_pct, 50);
    v_results_pct := COALESCE(v_results_pct, 50);
    v_ball_striking_pct := COALESCE(v_ball_striking_pct, 50);
    v_short_game_pct := COALESCE(v_short_game_pct, 50);
    v_power_pct := COALESCE(v_power_pct, 50);

    -- FIX B: New weights (22/18/20/12/10/10/8), cap at 99
    v_total_rating := LEAST(99, GREATEST(1, ROUND(
      (v_scoring_pct / 100.0 * 22) +
      (v_sg_pct / 100.0 * 18) +
      (v_ranking_pct / 100.0 * 20) +
      (v_results_pct / 100.0 * 12) +
      (v_ball_striking_pct / 100.0 * 10) +
      (v_short_game_pct / 100.0 * 10) +
      (v_power_pct / 100.0 * 8)
    )));

    v_tier := CASE
      WHEN v_total_rating >= 90 THEN 'elite'
      WHEN v_total_rating >= 80 THEN 'world_class'
      WHEN v_total_rating >= 70 THEN 'tour_proven'
      WHEN v_total_rating >= 60 THEN 'competitive'
      ELSE 'developing'
    END;

    -- Breakdown with new max weights
    v_breakdown := jsonb_build_object(
      'scoring', ROUND(v_scoring_pct / 100.0 * 22, 1),
      'sg_total', ROUND(v_sg_pct / 100.0 * 18, 1),
      'world_ranking', ROUND(v_ranking_pct / 100.0 * 20, 1),
      'results', ROUND(v_results_pct / 100.0 * 12, 1),
      'ball_striking', ROUND(v_ball_striking_pct / 100.0 * 10, 1),
      'short_game', ROUND(v_short_game_pct / 100.0 * 10, 1),
      'power', ROUND(v_power_pct / 100.0 * 8, 1),
      'scoring_percentile', ROUND(v_scoring_pct, 1),
      'sg_percentile', ROUND(v_sg_pct, 1),
      'ranking_percentile', ROUND(v_ranking_pct, 1),
      'results_percentile', ROUND(v_results_pct, 1),
      'ball_striking_percentile', ROUND(v_ball_striking_pct, 1),
      'short_game_percentile', ROUND(v_short_game_pct, 1),
      'power_percentile', ROUND(v_power_pct, 1)
    );

    -- Get previous rating
    SELECT rating INTO v_prev_rating
    FROM player_ratings
    WHERE player_id = rec.player_id
    ORDER BY computed_at DESC
    LIMIT 1;

    -- Upsert
    INSERT INTO player_ratings (player_id, rating, tier, previous_rating, rating_delta, breakdown, events_minimum_met)
    VALUES (
      rec.player_id,
      v_total_rating,
      v_tier,
      v_prev_rating,
      v_total_rating - COALESCE(v_prev_rating, v_total_rating),
      v_breakdown,
      true
    )
    ON CONFLICT (player_id) DO UPDATE SET
      rating = EXCLUDED.rating,
      tier = EXCLUDED.tier,
      previous_rating = EXCLUDED.previous_rating,
      rating_delta = EXCLUDED.rating_delta,
      breakdown = EXCLUDED.breakdown,
      events_minimum_met = EXCLUDED.events_minimum_met,
      computed_at = NOW();

  END LOOP;
END;
$$;