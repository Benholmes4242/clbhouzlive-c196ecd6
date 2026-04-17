-- Create championship_editorial_daily table for daily AI/template-generated front-page editorial
CREATE TABLE public.championship_editorial_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid NULL REFERENCES public.championship_seasons(id) ON DELETE CASCADE,
  time_filter text NOT NULL CHECK (time_filter IN ('seasonal', 'all_time')),
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  story_type text NOT NULL,
  eyebrow text NOT NULL,
  headline text NOT NULL,
  headline_two text NOT NULL DEFAULT '',
  standfirst text NOT NULL,
  generated_by text NOT NULL DEFAULT 'template' CHECK (generated_by IN ('template', 'ai_claude', 'ai_claude_validated', 'human_edit')),
  snapshot_data jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One editorial per (season, time_filter, date)
CREATE UNIQUE INDEX championship_editorial_daily_unique_seasonal
  ON public.championship_editorial_daily (season_id, time_filter, date)
  WHERE season_id IS NOT NULL;

CREATE UNIQUE INDEX championship_editorial_daily_unique_alltime
  ON public.championship_editorial_daily (time_filter, date)
  WHERE season_id IS NULL;

CREATE INDEX championship_editorial_daily_lookup_idx
  ON public.championship_editorial_daily (time_filter, season_id, date DESC);

-- Enable RLS
ALTER TABLE public.championship_editorial_daily ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read editorial — it's public front-page content
CREATE POLICY "Editorial is publicly readable"
  ON public.championship_editorial_daily
  FOR SELECT
  USING (true);

-- Only service role / edge functions can write (no user-facing INSERT/UPDATE/DELETE policy)
-- Service role bypasses RLS automatically.