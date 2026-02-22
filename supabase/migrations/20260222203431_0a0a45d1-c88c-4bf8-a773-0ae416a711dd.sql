CREATE OR REPLACE FUNCTION compute_player_ratings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_season_2026_id uuid;
  v_season_2025_id uuid;
  v_player_count integer;
  v_2026_weight numeric;
  v_2025_weight numeric;
  rec RECORD;
  v_scoring_pct numeric;
  v_sg_pct numeric;
  v_ranking_pct numeric;
  v_results_pct numeric;
  v_ball_striking_pct numeric;
  v_short_game_pct numeric;
  v_power_pct numeric;
  v_base_rating numeric;
  v_form_modifier numeric;
  v_form_scoring numeric;
  v_form_sg numeric;
  v_form_results numeric;
  v_total_rating integer;
  v_tier text;
  v_breakdown jsonb;
  v_prev_rating integer;
BEGIN
  SELECT id INTO v_season_2026_id
  FROM sr_seasons WHERE tour_name = 'pga' AND year = 2026 LIMIT 1;

  SELECT id INTO v_season_2025_id
  FROM sr_seasons WHERE tour_name = 'pga' AND year = 2025 LIMIT 1;

  IF v_season_2025_id IS NULL AND v_season_2026_id IS NULL THEN
    RAISE NOTICE 'No seasons found';
    RETURN;
  END IF;

  SELECT LEAST(0.7, GREATEST(0.3,
    AVG(ps.events_played)::numeric / 30.0
  )) INTO v_2026_weight
  FROM sr_player_statistics ps
  WHERE ps.season_id = v_season_2026_id AND ps.events_played >= 2;

  v_2026_weight := COALESCE(v_2026_weight, 0.3);
  v_2025_weight := 1.0 - v_2026_weight;

  RAISE NOTICE 'Weights: 2026=%, 2025=%', ROUND(v_2026_weight, 2), ROUND(v_2025_weight, 2);

  CREATE TEMP TABLE blended_stats ON COMMIT DROP AS
  SELECT
    COALESCE(s26.player_id, s25.player_id) AS player_id,
    CASE
      WHEN s26.scoring_average IS NOT NULL AND s25.scoring_average IS NOT NULL
        THEN s26.scoring_average * v_2026_weight + s25.scoring_average * v_2025_weight
      WHEN s26.scoring_average IS NOT NULL THEN s26.scoring_average
      ELSE s25.scoring_average
    END AS scoring_avg,
    CASE
      WHEN COALESCE((s26.raw_data->'statistics'->>'strokes_gained_total')::numeric, NULL) IS NOT NULL
        AND COALESCE((s25.raw_data->'statistics'->>'strokes_gained_total')::numeric, NULL) IS NOT NULL
        THEN (s26.raw_data->'statistics'->>'strokes_gained_total')::numeric * v_2026_weight
           + (s25.raw_data->'statistics'->>'strokes_gained_total')::numeric * v_2025_weight
      WHEN (s26.raw_data->'statistics'->>'strokes_gained_total')::numeric IS NOT NULL
        THEN (s26.raw_data->'statistics'->>'strokes_gained_total')::numeric
      ELSE (s25.raw_data->'statistics'->>'strokes_gained_total')::numeric
    END AS sg_total,
    CASE
      WHEN s26.driving_distance IS NOT NULL AND s25.driving_distance IS NOT NULL
        THEN s26.driving_distance * v_2026_weight + s25.driving_distance * v_2025_weight
      WHEN s26.driving_distance IS NOT NULL THEN s26.driving_distance
      ELSE s25.driving_distance
    END AS drive_dist,
    CASE
      WHEN s26.driving_accuracy IS NOT NULL AND s25.driving_accuracy IS NOT NULL
        THEN s26.driving_accuracy * v_2026_weight + s25.driving_accuracy * v_2025_weight
      WHEN s26.driving_accuracy IS NOT NULL THEN s26.driving_accuracy
      ELSE s25.driving_accuracy
    END AS drive_acc,
    CASE
      WHEN s26.greens_in_reg IS NOT NULL AND s25.greens_in_reg IS NOT NULL
        THEN s26.greens_in_reg * v_2026_weight + s25.greens_in_reg * v_2025_weight
      WHEN s26.greens_in_reg IS NOT NULL THEN s26.greens_in_reg
      ELSE s25.greens_in_reg
    END AS gir_pct,
    CASE
      WHEN (s26.raw_data->'statistics'->>'scrambling_pct')::numeric IS NOT NULL
        AND (s25.raw_data->'statistics'->>'scrambling_pct')::numeric IS NOT NULL
        THEN (s26.raw_data->'statistics'->>'scrambling_pct')::numeric * v_2026_weight
           + (s25.raw_data->'statistics'->>'scrambling_pct')::numeric * v_2025_weight
      WHEN (s26.raw_data->'statistics'->>'scrambling_pct')::numeric IS NOT NULL
        THEN (s26.raw_data->'statistics'->>'scrambling_pct')::numeric
      ELSE (s25.raw_data->'statistics'->>'scrambling_pct')::numeric
    END AS scrambling_pct,
    CASE
      WHEN s26.sand_saves IS NOT NULL AND s25.sand_saves IS NOT NULL
        THEN s26.sand_saves * v_2026_weight + s25.sand_saves * v_2025_weight
      WHEN s26.sand_saves IS NOT NULL THEN s26.sand_saves
      ELSE s25.sand_saves
    END AS sand_saves_pct,
    CASE
      WHEN s26.putting_average IS NOT NULL AND s25.putting_average IS NOT NULL
        THEN s26.putting_average * v_2026_weight + s25.putting_average * v_2025_weight
      WHEN s26.putting_average IS NOT NULL THEN s26.putting_average
      ELSE s25.putting_average
    END AS putting_avg,
    COALESCE(s26.wins, 0) + COALESCE(s25.wins, 0) AS total_wins,
    COALESCE(s26.top_10s, 0) + COALESCE(s25.top_10s, 0) AS total_top_10s,
    COALESCE(s26.events_played, 0) + COALESCE(s25.events_played, 0) AS total_events,
    COALESCE(
      (s26.raw_data->'statistics'->>'world_rank')::integer,
      (s25.raw_data->'statistics'->>'world_rank')::integer,
      999
    ) AS world_ranking,
    (s26.player_id IS NOT NULL) AS has_2026,
    (s25.player_id IS NOT NULL) AS has_2025,
    COALESCE(s26.events_played, 0) AS events_2026,
    COALESCE(s25.events_played, 0) AS events_2025
  FROM sr_player_statistics s25
  FULL OUTER JOIN sr_player_statistics s26
    ON s25.player_id = s26.player_id AND s26.season_id = v_season_2026_id
  WHERE s25.season_id = v_season_2025_id
    AND (COALESCE(s25.events_played, 0) + COALESCE(s26.events_played, 0)) >= 3;

  SELECT COUNT(*) INTO v_player_count FROM blended_stats;
  RAISE NOTICE 'Eligible players with blended data: %', v_player_count;

  IF v_player_count = 0 THEN RETURN; END IF;

  FOR rec IN SELECT * FROM blended_stats
  LOOP
    SELECT (COUNT(*) FILTER (WHERE scoring_avg > rec.scoring_avg))::numeric
           / NULLIF(v_player_count, 0) * 100
    INTO v_scoring_pct
    FROM blended_stats WHERE scoring_avg IS NOT NULL;

    SELECT (COUNT(*) FILTER (WHERE sg_total < rec.sg_total))::numeric
           / NULLIF(v_player_count, 0) * 100
    INTO v_sg_pct
    FROM blended_stats WHERE sg_total IS NOT NULL;

    SELECT (COUNT(*) FILTER (WHERE world_ranking > rec.world_ranking))::numeric
           / NULLIF(v_player_count, 0) * 100
    INTO v_ranking_pct
    FROM blended_stats;

    v_results_pct := CASE WHEN rec.total_events > 0 THEN
      LEAST(100,
        (rec.total_wins::numeric / rec.total_events * 100 * 1.5) +
        (rec.total_top_10s::numeric / rec.total_events * 100)
      )
    ELSE 0 END;

    SELECT (
      (COUNT(*) FILTER (WHERE gir_pct < rec.gir_pct))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE drive_acc < rec.drive_acc))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_ball_striking_pct
    FROM blended_stats WHERE gir_pct IS NOT NULL;

    SELECT (
      (COUNT(*) FILTER (WHERE scrambling_pct < rec.scrambling_pct))::numeric / NULLIF(v_player_count, 0) * 100 +
      (COUNT(*) FILTER (WHERE sand_saves_pct < rec.sand_saves_pct))::numeric / NULLIF(v_player_count, 0) * 100
    ) / 2
    INTO v_short_game_pct
    FROM blended_stats WHERE scrambling_pct IS NOT NULL;

    SELECT (COUNT(*) FILTER (WHERE drive_dist < rec.drive_dist))::numeric
           / NULLIF(v_player_count, 0) * 100
    INTO v_power_pct
    FROM blended_stats WHERE drive_dist IS NOT NULL;

    v_scoring_pct := COALESCE(v_scoring_pct, 50);
    v_sg_pct := COALESCE(v_sg_pct, 50);
    v_ranking_pct := COALESCE(v_ranking_pct, 50);
    v_results_pct := COALESCE(v_results_pct, 50);
    v_ball_striking_pct := COALESCE(v_ball_striking_pct, 50);
    v_short_game_pct := COALESCE(v_short_game_pct, 50);
    v_power_pct := COALESCE(v_power_pct, 50);

    v_base_rating := CASE
      WHEN rec.world_ranking <= 1 THEN 95
      WHEN rec.world_ranking <= 5 THEN 95 - (rec.world_ranking - 1) * 2
      WHEN rec.world_ranking <= 10 THEN 87 - (rec.world_ranking - 5) * 1.4
      WHEN rec.world_ranking <= 25 THEN 80 - (rec.world_ranking - 10) * 0.67
      WHEN rec.world_ranking <= 50 THEN 70 - (rec.world_ranking - 25) * 0.4
      WHEN rec.world_ranking <= 100 THEN 60 - (rec.world_ranking - 50) * 0.3
      WHEN rec.world_ranking <= 200 THEN 45 - (rec.world_ranking - 100) * 0.1
      ELSE GREATEST(30, 35 - (rec.world_ranking - 200) * 0.02)
    END;

    v_form_scoring := (v_scoring_pct - 50) / 50.0 * 3;
    v_form_sg := (v_sg_pct - 50) / 50.0 * 3;
    v_form_results := (v_results_pct - 50) / 50.0 * 2;
    v_form_modifier := GREATEST(-8, LEAST(8,
      ROUND(v_form_scoring + v_form_sg + v_form_results)
    ));

    v_total_rating := LEAST(99, GREATEST(1, ROUND(v_base_rating + v_form_modifier)));

    v_tier := CASE
      WHEN v_total_rating >= 90 THEN 'elite'
      WHEN v_total_rating >= 78 THEN 'world_class'
      WHEN v_total_rating >= 65 THEN 'tour_proven'
      WHEN v_total_rating >= 50 THEN 'competitive'
      ELSE 'developing'
    END;

    v_breakdown := jsonb_build_object(
      'base_rating', ROUND(v_base_rating),
      'form_modifier', v_form_modifier,
      'form_scoring', ROUND(v_form_scoring, 1),
      'form_sg', ROUND(v_form_sg, 1),
      'form_results', ROUND(v_form_results, 1),
      'world_ranking', rec.world_ranking,
      'scoring_percentile', ROUND(v_scoring_pct),
      'sg_percentile', ROUND(v_sg_pct),
      'ranking_percentile', ROUND(v_ranking_pct),
      'results_percentile', ROUND(v_results_pct),
      'ball_striking_percentile', ROUND(v_ball_striking_pct),
      'short_game_percentile', ROUND(v_short_game_pct),
      'power_percentile', ROUND(v_power_pct),
      'total_events', rec.total_events,
      'events_2025', rec.events_2025,
      'events_2026', rec.events_2026,
      'weight_2025', ROUND(v_2025_weight, 2),
      'weight_2026', ROUND(v_2026_weight, 2)
    );

    SELECT rating INTO v_prev_rating
    FROM player_ratings
    WHERE player_id = rec.player_id AND season_id = COALESCE(v_season_2026_id, v_season_2025_id);

    INSERT INTO player_ratings (player_id, season_id, rating, tier, previous_rating, rating_delta, breakdown, events_minimum_met, computed_at)
    VALUES (
      rec.player_id,
      COALESCE(v_season_2026_id, v_season_2025_id),
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

  DROP TABLE IF EXISTS blended_stats;
END;
$$;