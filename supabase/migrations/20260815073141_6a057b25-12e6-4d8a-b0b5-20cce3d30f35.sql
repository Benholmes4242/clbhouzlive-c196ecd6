ALTER TABLE public.ai_predictions DROP CONSTRAINT IF EXISTS ai_predictions_tournament_id_key;
CREATE INDEX IF NOT EXISTS ai_predictions_tournament_generated_idx
  ON public.ai_predictions (tournament_id, generated_at DESC);