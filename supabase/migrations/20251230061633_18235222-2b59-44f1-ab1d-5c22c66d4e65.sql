-- Create tables for all Sportradar endpoints

-- 1. Players table (base player info)
CREATE TABLE IF NOT EXISTS public.sr_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_id text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  height text,
  weight text,
  birth_date date,
  birth_place text,
  residence text,
  college text,
  turned_pro integer,
  country text,
  country_code text,
  photo_url text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Player profiles (extended bio/history)
CREATE TABLE IF NOT EXISTS public.sr_player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  bio text,
  career_earnings numeric,
  career_wins integer,
  pga_tour_wins integer,
  majors_won integer,
  best_world_ranking integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Player statistics (season stats)
CREATE TABLE IF NOT EXISTS public.sr_player_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  season_id uuid REFERENCES public.sr_seasons(id) ON DELETE CASCADE,
  fedex_points numeric,
  fedex_rank integer,
  events_played integer,
  cuts_made integer,
  wins integer,
  top_10s integer,
  top_25s integer,
  scoring_average numeric,
  driving_distance numeric,
  driving_accuracy numeric,
  greens_in_reg numeric,
  putting_average numeric,
  sand_saves numeric,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, season_id)
);

-- 4. World rankings
CREATE TABLE IF NOT EXISTS public.sr_world_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  points numeric,
  points_lost numeric,
  points_gained numeric,
  events_played integer,
  ranking_date date NOT NULL,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, ranking_date)
);

-- 5. Tournament summaries (extended tournament info)
CREATE TABLE IF NOT EXISTS public.sr_tournament_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  field_size integer,
  cut_score integer,
  weather_conditions text,
  course_conditions text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id)
);

-- 6. Course info
CREATE TABLE IF NOT EXISTS public.sr_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_id text UNIQUE NOT NULL,
  name text NOT NULL,
  city text,
  state text,
  country text,
  country_code text,
  latitude numeric,
  longitude numeric,
  par integer,
  yardage integer,
  holes integer DEFAULT 18,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Course holes (layout info)
CREATE TABLE IF NOT EXISTS public.sr_course_holes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.sr_courses(id) ON DELETE CASCADE,
  hole_number integer NOT NULL,
  par integer,
  yardage integer,
  description text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, hole_number)
);

-- 8. Tournament leaderboards
CREATE TABLE IF NOT EXISTS public.sr_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  position integer,
  position_tied boolean DEFAULT false,
  score integer,
  strokes integer,
  thru integer,
  round_1 integer,
  round_2 integer,
  round_3 integer,
  round_4 integer,
  money numeric,
  points numeric,
  status text,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- 9. Scorecards (hole-by-hole)
CREATE TABLE IF NOT EXISTS public.sr_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  hole_number integer NOT NULL,
  strokes integer,
  par integer,
  score_to_par integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, player_id, round_number, hole_number)
);

-- 10. Tee times
CREATE TABLE IF NOT EXISTS public.sr_tee_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  tee_time timestamptz NOT NULL,
  tee_number integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, round_number, tee_time, tee_number)
);

-- 11. Tee time pairings
CREATE TABLE IF NOT EXISTS public.sr_tee_time_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tee_time_id uuid REFERENCES public.sr_tee_times(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.sr_players(id) ON DELETE CASCADE,
  position integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tee_time_id, player_id)
);

-- 12. Tournament hole statistics
CREATE TABLE IF NOT EXISTS public.sr_hole_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE CASCADE,
  round_number integer,
  hole_number integer NOT NULL,
  par integer,
  yardage integer,
  scoring_average numeric,
  eagles integer DEFAULT 0,
  birdies integer DEFAULT 0,
  pars integer DEFAULT 0,
  bogeys integer DEFAULT 0,
  double_bogeys integer DEFAULT 0,
  other integer DEFAULT 0,
  rank integer,
  raw_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, round_number, hole_number)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sr_players_name ON public.sr_players(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_sr_players_country ON public.sr_players(country_code);
CREATE INDEX IF NOT EXISTS idx_sr_world_rankings_date ON public.sr_world_rankings(ranking_date);
CREATE INDEX IF NOT EXISTS idx_sr_world_rankings_rank ON public.sr_world_rankings(rank);
CREATE INDEX IF NOT EXISTS idx_sr_leaderboards_tournament ON public.sr_leaderboards(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sr_leaderboards_position ON public.sr_leaderboards(position);
CREATE INDEX IF NOT EXISTS idx_sr_scorecards_tournament ON public.sr_scorecards(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sr_tee_times_tournament ON public.sr_tee_times(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sr_hole_statistics_tournament ON public.sr_hole_statistics(tournament_id);
CREATE INDEX IF NOT EXISTS idx_sr_player_statistics_season ON public.sr_player_statistics(season_id);

-- Enable RLS on all tables
ALTER TABLE public.sr_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_world_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_tournament_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_course_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_tee_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_tee_time_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sr_hole_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage sr_players" ON public.sr_players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_player_profiles" ON public.sr_player_profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_player_statistics" ON public.sr_player_statistics FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_world_rankings" ON public.sr_world_rankings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_tournament_summaries" ON public.sr_tournament_summaries FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_courses" ON public.sr_courses FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_course_holes" ON public.sr_course_holes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_leaderboards" ON public.sr_leaderboards FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_scorecards" ON public.sr_scorecards FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_tee_times" ON public.sr_tee_times FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_tee_time_players" ON public.sr_tee_time_players FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage sr_hole_statistics" ON public.sr_hole_statistics FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.sr_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sr_players_updated_at BEFORE UPDATE ON public.sr_players FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();
CREATE TRIGGER sr_player_profiles_updated_at BEFORE UPDATE ON public.sr_player_profiles FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();
CREATE TRIGGER sr_player_statistics_updated_at BEFORE UPDATE ON public.sr_player_statistics FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();
CREATE TRIGGER sr_tournament_summaries_updated_at BEFORE UPDATE ON public.sr_tournament_summaries FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();
CREATE TRIGGER sr_courses_updated_at BEFORE UPDATE ON public.sr_courses FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();
CREATE TRIGGER sr_leaderboards_updated_at BEFORE UPDATE ON public.sr_leaderboards FOR EACH ROW EXECUTE FUNCTION public.sr_set_updated_at();