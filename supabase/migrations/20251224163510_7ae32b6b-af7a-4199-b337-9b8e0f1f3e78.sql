-- Add provider column to snapshots if not present
ALTER TABLE public.tourhub_leaderboard_snapshots
ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'espn';

-- Add missing columns to event mappings if table exists
ALTER TABLE public.tourhub_event_mappings
ADD COLUMN IF NOT EXISTS matched_by text DEFAULT 'manual';

ALTER TABLE public.tourhub_event_mappings
ADD COLUMN IF NOT EXISTS slashgolf_tourn_id text;

ALTER TABLE public.tourhub_event_mappings
ADD COLUMN IF NOT EXISTS livegolf_event_id text;

-- Create enrichment table for SlashGolf earnings/points data
CREATE TABLE IF NOT EXISTS public.tourhub_event_enrichment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour text NOT NULL,
  espn_event_id text NOT NULL,
  year int NOT NULL,
  provider text NOT NULL DEFAULT 'slashgolf',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tourhub_event_enrichment_unique UNIQUE (tour, year, espn_event_id, provider)
);

-- Enable RLS on enrichment
ALTER TABLE public.tourhub_event_enrichment ENABLE ROW LEVEL SECURITY;

-- Public read access for enrichment
DROP POLICY IF EXISTS "public can read tourhub_event_enrichment" ON public.tourhub_event_enrichment;
CREATE POLICY "public can read tourhub_event_enrichment"
ON public.tourhub_event_enrichment FOR SELECT
USING (true);

-- Service role can write to enrichment
DROP POLICY IF EXISTS "service role can manage tourhub_event_enrichment" ON public.tourhub_event_enrichment;
CREATE POLICY "service role can manage tourhub_event_enrichment"
ON public.tourhub_event_enrichment FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');