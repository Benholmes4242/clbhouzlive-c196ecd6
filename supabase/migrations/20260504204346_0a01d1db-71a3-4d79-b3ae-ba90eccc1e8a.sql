
-- Phase 1: Echo Insights schema
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Bridge table
CREATE TABLE IF NOT EXISTS public.whs_to_golf_course_map (
  whs_course_id uuid PRIMARY KEY REFERENCES public.whs_courses(id) ON DELETE CASCADE,
  golf_course_id uuid REFERENCES public.golf_courses(id) ON DELETE SET NULL,
  match_confidence numeric(4,3) NOT NULL DEFAULT 0.0,
  match_method text NOT NULL DEFAULT 'unmatched',
  matched_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  notes text NULL
);

CREATE INDEX IF NOT EXISTS idx_whs_to_golf_course_map_golf_course
  ON public.whs_to_golf_course_map(golf_course_id)
  WHERE golf_course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whs_to_golf_course_map_method
  ON public.whs_to_golf_course_map(match_method);

COMMENT ON TABLE public.whs_to_golf_course_map IS
  'Maps England Golf WHS courses to Clbhouz golf_courses. golf_course_id is NULL when no match exists. match_method tracks how the match was made. reviewed_at distinguishes machine matches from human-confirmed.';

ALTER TABLE public.whs_to_golf_course_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read course mappings" ON public.whs_to_golf_course_map;
CREATE POLICY "Anyone authenticated can read course mappings"
  ON public.whs_to_golf_course_map
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Recommendation history ledger
CREATE TABLE IF NOT EXISTS public.whs_ai_recommendation_history (
  connection_id uuid NOT NULL REFERENCES public.whs_connections(id) ON DELETE CASCADE,
  date_key text NOT NULL,
  recommended_ids uuid[] NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (connection_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_whs_ai_recommendation_history_recent
  ON public.whs_ai_recommendation_history(connection_id, date_key DESC);

COMMENT ON TABLE public.whs_ai_recommendation_history IS
  'Per-connection per-day record of recommended golf_course IDs. Used for the 7-day no-duplicate window in Echo Insights. date_key is yyyy-MM-dd in UTC.';

ALTER TABLE public.whs_ai_recommendation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own recommendation history" ON public.whs_ai_recommendation_history;
CREATE POLICY "Users can read their own recommendation history"
  ON public.whs_ai_recommendation_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whs_connections c
      WHERE c.id = whs_ai_recommendation_history.connection_id
      AND c.user_id = auth.uid()
    )
  );

-- Trigram match RPC
CREATE OR REPLACE FUNCTION public.find_best_trigram_match(
  input_name text,
  country_filter text DEFAULT NULL
)
RETURNS TABLE(id uuid, name text, similarity real)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gc.id,
    gc.name,
    similarity(gc.name, input_name) AS similarity
  FROM public.golf_courses gc
  WHERE (country_filter IS NULL OR gc.country = country_filter)
  ORDER BY similarity DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_best_trigram_match(text, text) TO authenticated, service_role;

-- Add date_key for daily cache
ALTER TABLE public.whs_ai_insights
ADD COLUMN IF NOT EXISTS date_key text NULL;

CREATE INDEX IF NOT EXISTS idx_whs_ai_insights_connection_date
  ON public.whs_ai_insights(connection_id, date_key);
