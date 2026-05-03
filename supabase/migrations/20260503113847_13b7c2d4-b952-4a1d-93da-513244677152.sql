CREATE TABLE public.whs_ai_insights (
  connection_id uuid PRIMARY KEY REFERENCES public.whs_connections(id) ON DELETE CASCADE,
  scoring_profile text NOT NULL,
  suited_courses jsonb NOT NULL,
  test_courses jsonb NOT NULL,
  generated_from_score_id uuid REFERENCES public.whs_scores(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whs_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own AI insights"
ON public.whs_ai_insights FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whs_connections c
    WHERE c.id = whs_ai_insights.connection_id
      AND c.user_id = auth.uid()
  )
);
