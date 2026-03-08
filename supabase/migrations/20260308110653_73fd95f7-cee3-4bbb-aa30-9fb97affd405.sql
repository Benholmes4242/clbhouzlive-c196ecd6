-- Accuracy tracking table — auto-scored when tournaments close
CREATE TABLE IF NOT EXISTS ai_prediction_accuracy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES sr_tournaments(id) ON DELETE CASCADE,
  prediction_id uuid REFERENCES ai_predictions(id) ON DELETE SET NULL,
  tournament_name text,
  tour_code text,
  season_year int,
  pick_results jsonb NOT NULL DEFAULT '[]',
  picks_in_top_5 int DEFAULT 0,
  picks_in_top_10 int DEFAULT 0,
  picks_in_top_20 int DEFAULT 0,
  picks_made_cut int DEFAULT 0,
  picks_missed_cut int DEFAULT 0,
  best_pick_position int,
  best_pick_player_id uuid,
  best_pick_player_name text,
  average_pick_position float,
  accuracy_grade text,
  average_fit_score_predicted float,
  average_fit_score_actual float,
  model_version text,
  prompt_version text,
  claude_picks jsonb,
  gpt_picks jsonb,
  gemini_picks jsonb,
  consensus_method text,
  scored_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id)
);

CREATE INDEX IF NOT EXISTS idx_accuracy_scored_at ON ai_prediction_accuracy(scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_tour ON ai_prediction_accuracy(tour_code, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_grade ON ai_prediction_accuracy(accuracy_grade);

ALTER TABLE ai_prediction_accuracy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON ai_prediction_accuracy FOR SELECT USING (true);
CREATE POLICY "Service role insert/update" ON ai_prediction_accuracy FOR ALL USING (auth.role() = 'service_role');

-- Course DNA Profiles table
CREATE TABLE IF NOT EXISTS course_dna_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  venue_id uuid REFERENCES sr_courses(id) ON DELETE SET NULL,
  driving_distance_importance float DEFAULT 50,
  driving_accuracy_importance float DEFAULT 50,
  gir_importance float DEFAULT 50,
  scrambling_importance float DEFAULT 50,
  putting_importance float DEFAULT 50,
  sg_off_tee_importance float DEFAULT 50,
  sg_approach_importance float DEFAULT 50,
  sg_around_green_importance float DEFAULT 50,
  sg_putting_importance float DEFAULT 50,
  course_type text,
  avg_winning_score float,
  avg_cut_line float,
  scoring_difficulty float,
  wind_exposure_factor float DEFAULT 5,
  green_speed_factor float DEFAULT 5,
  rough_severity_factor float DEFAULT 5,
  par_3_scoring_importance float DEFAULT 50,
  par_4_scoring_importance float DEFAULT 50,
  par_5_scoring_importance float DEFAULT 50,
  tournaments_analyzed int DEFAULT 0,
  years_of_data int DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  historical_winners jsonb,
  stat_correlations jsonb,
  UNIQUE(venue_name)
);

CREATE INDEX IF NOT EXISTS idx_course_dna_venue ON course_dna_profiles(venue_name);

ALTER TABLE course_dna_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read course DNA" ON course_dna_profiles FOR SELECT USING (true);
CREATE POLICY "Service role write course DNA" ON course_dna_profiles FOR ALL USING (auth.role() = 'service_role');