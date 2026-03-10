-- STEP 1: Add post_type column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text;

-- STEP 1b: Add actor_type column to user_profiles (needed for system account)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS actor_type text;

-- STEP 2: Create tournament_result_meta table
CREATE TABLE IF NOT EXISTS tournament_result_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES sr_tournaments(id),
  tournament_name text NOT NULL,
  venue_name text,
  venue_city text,
  venue_country text,
  tour_slug text NOT NULL,
  tour_name text NOT NULL,
  tour_priority integer NOT NULL DEFAULT 500,
  winner_id uuid,
  winner_name text NOT NULL,
  winner_score integer NOT NULL,
  winner_score_display text NOT NULL,
  winner_photo_url text,
  winner_by text,
  stat_eagles integer DEFAULT 0,
  stat_birdies integer DEFAULT 0,
  stat_pars integer DEFAULT 0,
  stat_bogeys integer DEFAULT 0,
  stat_driving_distance numeric,
  stat_fairways_pct numeric,
  stat_gir_pct numeric,
  stat_putts numeric,
  podium_rows jsonb NOT NULL DEFAULT '[]',
  course_image_url text,
  injected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);

-- STEP 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_posts_post_type 
  ON posts(post_type) 
  WHERE post_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_result_meta_post_id 
  ON tournament_result_meta(post_id);

CREATE INDEX IF NOT EXISTS idx_tournament_result_meta_tournament_id 
  ON tournament_result_meta(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_result_meta_injected_at 
  ON tournament_result_meta(injected_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_tournament_result_created 
  ON posts(created_at DESC) 
  WHERE post_type = 'tournament_result';

-- STEP 5: RLS policies for tournament_result_meta
ALTER TABLE tournament_result_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_result_meta_read"
  ON tournament_result_meta
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tournament_result_meta_insert"
  ON tournament_result_meta
  FOR INSERT
  TO service_role
  WITH CHECK (true);