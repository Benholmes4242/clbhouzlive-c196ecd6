
-- Player ratings table
CREATE TABLE IF NOT EXISTS player_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES sr_players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 100),
  tier text NOT NULL CHECK (tier IN ('elite', 'world_class', 'tour_proven', 'competitive', 'developing')),
  previous_rating integer,
  rating_delta integer DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}',
  scouting_report text,
  events_minimum_met boolean DEFAULT false,
  computed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, season_id)
);

CREATE INDEX idx_player_ratings_player ON player_ratings(player_id);
CREATE INDEX idx_player_ratings_rating ON player_ratings(rating DESC);
CREATE INDEX idx_player_ratings_tier ON player_ratings(tier);
CREATE INDEX idx_player_ratings_season ON player_ratings(season_id);

ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON player_ratings
  FOR SELECT USING (true);

-- Compute function
CREATE OR REPLACE FUNCTION compute_player_ratings()
RETURNS void AS $$
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

    -- SG Total percentile (higher is better)
    SELECT (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'strokes_gained_total')::numeric, 0) < rec.sg_total))::numeric / v_player_count * 100
    INTO v_sg_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- World Ranking percentile (lower rank = better)
    SELECT (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'world_rank')::integer, 999) > rec.world_ranking))::numeric / v_player_count * 100
    INTO v_ranking_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- Results: win rate + top10 rate
    v_results_pct := LEAST(100, (
      CASE WHEN rec.events_played > 0 THEN
        (COALESCE(rec.wins, 0)::numeric / rec.events_played * 100 * 1.5) +
        (COALESCE(rec.top_10s, 0)::numeric / rec.events_played * 100)
      ELSE 0 END
    ));

    -- Ball Striking: avg of GIR + driving accuracy percentiles
    SELECT (
      (COUNT(*) FILTER (WHERE greens_in_reg < rec.greens_in_reg))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE driving_accuracy < rec.driving_accuracy))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_ball_striking_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- Short Game: avg of scrambling + sand saves percentiles
    SELECT (
      (COUNT(*) FILTER (WHERE COALESCE((raw_data->'statistics'->>'scrambling_pct')::numeric, 0) < rec.scrambling_pct))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE sand_saves < rec.sand_saves))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_short_game_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3;

    -- Power: driving distance percentile
    SELECT (COUNT(*) FILTER (WHERE driving_distance < rec.driving_distance))::numeric / v_player_count * 100
    INTO v_power_pct
    FROM sr_player_statistics WHERE season_id = v_season_id AND events_played >= 3 AND driving_distance IS NOT NULL;

    -- Coalesce nulls to 50
    v_scoring_pct := COALESCE(v_scoring_pct, 50);
    v_sg_pct := COALESCE(v_sg_pct, 50);
    v_ranking_pct := COALESCE(v_ranking_pct, 50);
    v_results_pct := COALESCE(v_results_pct, 50);
    v_ball_striking_pct := COALESCE(v_ball_striking_pct, 50);
    v_short_game_pct := COALESCE(v_short_game_pct, 50);
    v_power_pct := COALESCE(v_power_pct, 50);

    -- Weighted total (max 100)
    v_total_rating := LEAST(100, GREATEST(1, ROUND(
      (v_scoring_pct / 100.0 * 25) +
      (v_sg_pct / 100.0 * 20) +
      (v_ranking_pct / 100.0 * 15) +
      (v_results_pct / 100.0 * 15) +
      (v_ball_striking_pct / 100.0 * 10) +
      (v_short_game_pct / 100.0 * 10) +
      (v_power_pct / 100.0 * 5)
    )));

    v_tier := CASE
      WHEN v_total_rating >= 90 THEN 'elite'
      WHEN v_total_rating >= 80 THEN 'world_class'
      WHEN v_total_rating >= 70 THEN 'tour_proven'
      WHEN v_total_rating >= 60 THEN 'competitive'
      ELSE 'developing'
    END;

    v_breakdown := jsonb_build_object(
      'scoring', ROUND(v_scoring_pct / 100.0 * 25, 1),
      'sg_total', ROUND(v_sg_pct / 100.0 * 20, 1),
      'world_ranking', ROUND(v_ranking_pct / 100.0 * 15, 1),
      'results', ROUND(v_results_pct / 100.0 * 15, 1),
      'ball_striking', ROUND(v_ball_striking_pct / 100.0 * 10, 1),
      'short_game', ROUND(v_short_game_pct / 100.0 * 10, 1),
      'power', ROUND(v_power_pct / 100.0 * 5, 1),
      'scoring_percentile', ROUND(v_scoring_pct),
      'sg_percentile', ROUND(v_sg_pct),
      'ranking_percentile', ROUND(v_ranking_pct),
      'results_percentile', ROUND(v_results_pct),
      'ball_striking_percentile', ROUND(v_ball_striking_pct),
      'short_game_percentile', ROUND(v_short_game_pct),
      'power_percentile', ROUND(v_power_pct)
    );

    SELECT rating INTO v_prev_rating
    FROM player_ratings
    WHERE player_id = rec.player_id AND season_id = v_season_id;

    INSERT INTO player_ratings (player_id, season_id, rating, tier, previous_rating, rating_delta, breakdown, events_minimum_met, computed_at)
    VALUES (
      rec.player_id,
      v_season_id,
      v_total_rating,
      v_tier,
      v_prev_rating,
      CASE WHEN v_prev_rating IS NOT NULL THEN v_total_rating - v_prev_rating ELSE 0 END,
      v_breakdown,
      true,
      now()
    )
    ON CONFLICT (player_id, season_id) DO UPDATE SET
      previous_rating = player_ratings.rating,
      rating = EXCLUDED.rating,
      tier = EXCLUDED.tier,
      rating_delta = EXCLUDED.rating - player_ratings.rating,
      breakdown = EXCLUDED.breakdown,
      events_minimum_met = true,
      computed_at = now(),
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql;
