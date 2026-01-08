-- 1) Enums (keeps data clean)
DO $$ BEGIN
  CREATE TYPE leaderboard_scope AS ENUM ('global','gbi','europe','usa','friends','nearby');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE leaderboard_time_range AS ENUM ('all_time','this_year','this_month');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_type AS ENUM (
    'new_personal_best',
    'entered_rank_tier',
    'fast_climber',
    'top_percentile',
    'overtook_rivals'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Milestones table
CREATE TABLE IF NOT EXISTS public.leaderboard_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  milestone_type milestone_type NOT NULL,
  rank_scope leaderboard_scope NOT NULL,
  time_range leaderboard_time_range NOT NULL,

  -- Rank achieved at the moment the milestone fired
  rank_value integer NOT NULL,

  -- Optional context
  rank_delta integer NULL,
  rivals_overtaken integer NULL,
  percentile integer NULL,

  -- Season support
  season_id uuid NULL,
  season_key text NULL,

  -- For dedupe + idempotency
  dedupe_key text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Dedupe constraint: ensures you can safely "upsert" without repeats
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_milestones_dedupe_uq
  ON public.leaderboard_milestones(dedupe_key);

-- 4) Helpful query indexes
CREATE INDEX IF NOT EXISTS leaderboard_milestones_user_time_idx
  ON public.leaderboard_milestones(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS leaderboard_milestones_scope_range_idx
  ON public.leaderboard_milestones(rank_scope, time_range, created_at DESC);

CREATE INDEX IF NOT EXISTS leaderboard_milestones_season_idx
  ON public.leaderboard_milestones(season_key, user_id, created_at DESC);

-- 5) Enable RLS
ALTER TABLE public.leaderboard_milestones ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies
-- Read: users can read their own milestones
CREATE POLICY "Users can read own milestones"
  ON public.leaderboard_milestones
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert: allow user insert with strict checks (for client-side milestone creation)
CREATE POLICY "Users can insert own milestones"
  ON public.leaderboard_milestones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);