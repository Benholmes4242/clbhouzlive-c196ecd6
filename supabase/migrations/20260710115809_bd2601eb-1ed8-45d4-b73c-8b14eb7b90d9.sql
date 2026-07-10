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
    AND (p.expires_at IS NULL OR p.expires_at > now())
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