
-- RPC 1: echo_get_user_context
CREATE OR REPLACE FUNCTION echo_get_user_context(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'display_name', up.display_name,
    'first_name',   split_part(coalesce(up.display_name, ''), ' ', 1),
    'handicap',     up.eg_handicap_index,
    'home_club',    up.home_club,
    'city',         up.city,
    'country',      up.country
  )
  FROM user_profiles up
  WHERE up.id = p_user_id
  LIMIT 1;
$$;

-- RPC 2: echo_get_tournament_context
CREATE OR REPLACE FUNCTION echo_get_tournament_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tournament record;
  v_prediction record;
  v_dna record;
  v_result jsonb;
BEGIN
  SELECT
    t.id,
    t.name,
    t.start_date,
    t.end_date,
    t.status,
    t.venue_name,
    t.venue_course_name,
    t.venue_city,
    t.venue_country,
    t.venue_par,
    t.venue_yardage,
    t.purse,
    t.defending_champion,
    t.venue_id
  INTO v_tournament
  FROM sr_tournaments t
  WHERE t.status IN ('scheduled', 'inprogress', 'live')
    AND t.start_date >= (current_date - interval '3 days')
  ORDER BY t.start_date ASC
  LIMIT 1;

  IF v_tournament IS NULL THEN
    RETURN jsonb_build_object('available', false);
  END IF;

  SELECT
    p.predictions,
    p.consensus_data,
    p.course_analysis,
    p.dark_horses,
    p.generated_at,
    p.model_version
  INTO v_prediction
  FROM ai_predictions p
  WHERE p.tournament_id = v_tournament.id
  ORDER BY p.generated_at DESC
  LIMIT 1;

  SELECT
    d.course_type,
    d.scoring_difficulty,
    d.driving_distance_importance,
    d.driving_accuracy_importance,
    d.sg_putting_importance,
    d.sg_approach_importance,
    d.sg_off_tee_importance,
    d.sg_around_green_importance,
    d.scrambling_importance,
    d.wind_exposure_factor,
    d.rough_severity_factor,
    d.avg_winning_score,
    d.tournaments_analyzed
  INTO v_dna
  FROM course_dna_profiles d
  WHERE d.venue_id = v_tournament.venue_id
  LIMIT 1;

  v_result := jsonb_build_object(
    'available',          true,
    'tournament', jsonb_build_object(
      'name',             v_tournament.name,
      'status',           v_tournament.status,
      'start_date',       v_tournament.start_date,
      'end_date',         v_tournament.end_date,
      'venue',            coalesce(v_tournament.venue_course_name, v_tournament.venue_name),
      'location',         concat_ws(', ', v_tournament.venue_city, v_tournament.venue_country),
      'par',              v_tournament.venue_par,
      'yardage',          v_tournament.venue_yardage,
      'purse',            v_tournament.purse,
      'defending_champion', v_tournament.defending_champion
    ),
    'predictions',        coalesce(v_prediction.predictions, 'null'::jsonb),
    'consensus_data',     coalesce(v_prediction.consensus_data, 'null'::jsonb),
    'dark_horses',        coalesce(v_prediction.dark_horses, 'null'::jsonb),
    'course_analysis',    coalesce(v_prediction.course_analysis, 'null'::jsonb),
    'course_dna',         to_jsonb(v_dna),
    'prediction_generated_at', v_prediction.generated_at
  );

  RETURN v_result;
END;
$$;

-- RPC 3: echo_get_course_context
CREATE OR REPLACE FUNCTION echo_get_course_context(
  p_query   text    DEFAULT NULL,
  p_country text    DEFAULT NULL,
  p_limit   int     DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_courses jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'name',           gc.name,
      'country',        gc.country,
      'region',         gc.region,
      'course_type',    gc.course_type,
      'global_rank',    gc.global_rank,
      'country_rank',   gc.country_rank,
      'has_hosted_major', gc.has_hosted_major,
      'avg_rating',     round(cra.avg_overall_score::numeric, 2),
      'review_count',   cra.review_count,
      'design_score',   round(cra.avg_design_score::numeric, 2),
      'condition_score', round(cra.avg_condition_score::numeric, 2),
      'facilities_score', round(cra.avg_facilities_score::numeric, 2)
    )
    ORDER BY cra.avg_overall_score DESC NULLS LAST
  )
  INTO v_courses
  FROM golf_courses gc
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = gc.id
  WHERE
    (p_country IS NULL OR lower(gc.country) ILIKE lower('%' || p_country || '%'))
    AND (
      p_query IS NULL
      OR lower(gc.name) ILIKE lower('%' || p_query || '%')
      OR lower(coalesce(gc.region, '')) ILIKE lower('%' || p_query || '%')
      OR lower(gc.country) ILIKE lower('%' || p_query || '%')
    )
    AND cra.review_count > 0
  LIMIT p_limit;

  RETURN jsonb_build_object(
    'available', v_courses IS NOT NULL,
    'courses',   coalesce(v_courses, '[]'::jsonb),
    'query',     p_query,
    'country',   p_country
  );
END;
$$;

-- RPC 4: echo_get_player_context
CREATE OR REPLACE FUNCTION echo_get_player_context(p_player_name text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_player record;
  v_stats  record;
  v_profile record;
BEGIN
  SELECT
    p.id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.country,
    p.turned_pro,
    p.birth_place,
    p.tour_codes
  INTO v_player
  FROM sr_players p
  WHERE
    lower(p.full_name) ILIKE lower('%' || p_player_name || '%')
    OR lower(p.last_name) ILIKE lower('%' || p_player_name || '%')
  ORDER BY
    CASE WHEN lower(p.full_name) = lower(p_player_name) THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_player IS NULL THEN
    RETURN jsonb_build_object('available', false, 'player_name', p_player_name);
  END IF;

  SELECT
    s.scoring_average,
    s.driving_distance,
    s.driving_accuracy,
    s.greens_in_reg,
    s.putting_average,
    s.strokes_gained_putting,
    s.strokes_gained_tee_green,
    s.wins,
    s.top_10s,
    s.cuts_made,
    s.events_played,
    s.earnings,
    s.season_id
  INTO v_stats
  FROM sr_player_statistics s
  WHERE s.player_id = v_player.id
  ORDER BY s.season_id DESC
  LIMIT 1;

  SELECT
    pr.career_wins,
    pr.majors_won,
    pr.pga_tour_wins,
    pr.best_world_ranking,
    pr.career_earnings
  INTO v_profile
  FROM sr_player_profiles pr
  WHERE pr.player_id = v_player.id
  LIMIT 1;

  RETURN jsonb_build_object(
    'available',      true,
    'player', jsonb_build_object(
      'name',         v_player.full_name,
      'country',      v_player.country,
      'turned_pro',   v_player.turned_pro,
      'tours',        v_player.tour_codes
    ),
    'current_season', jsonb_build_object(
      'season',            v_stats.season_id,
      'scoring_average',   v_stats.scoring_average,
      'driving_distance',  v_stats.driving_distance,
      'driving_accuracy',  v_stats.driving_accuracy,
      'greens_in_reg',     v_stats.greens_in_reg,
      'putting_average',   v_stats.putting_average,
      'sg_putting',        v_stats.strokes_gained_putting,
      'sg_tee_to_green',   v_stats.strokes_gained_tee_green,
      'wins',              v_stats.wins,
      'top_10s',           v_stats.top_10s,
      'cuts_made',         v_stats.cuts_made,
      'events_played',     v_stats.events_played,
      'earnings',          v_stats.earnings
    ),
    'career', jsonb_build_object(
      'career_wins',       v_profile.career_wins,
      'majors_won',        v_profile.majors_won,
      'pga_tour_wins',     v_profile.pga_tour_wins,
      'best_world_ranking', v_profile.best_world_ranking,
      'career_earnings',   v_profile.career_earnings
    )
  );
END;
$$;
