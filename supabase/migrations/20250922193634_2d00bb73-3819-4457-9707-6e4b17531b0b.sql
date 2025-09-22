-- Create swing_visuals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.swing_visuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  frame_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  overlay JSONB NOT NULL DEFAULT '{}'::jsonb,
  url TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 800,
  height INTEGER NOT NULL DEFAULT 600,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.swing_visuals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own swing visuals"
ON public.swing_visuals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pro_ai_analyses
  WHERE pro_ai_analyses.id = swing_visuals.analysis_id
  AND pro_ai_analyses.user_id = auth.uid()
));

CREATE POLICY "Users can create their own swing visuals"
ON public.swing_visuals
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pro_ai_analyses
  WHERE pro_ai_analyses.id = swing_visuals.analysis_id
  AND pro_ai_analyses.user_id = auth.uid()
));

CREATE POLICY "Users can update their own swing visuals"
ON public.swing_visuals
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.pro_ai_analyses
  WHERE pro_ai_analyses.id = swing_visuals.analysis_id
  AND pro_ai_analyses.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own swing visuals"
ON public.swing_visuals
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pro_ai_analyses
  WHERE pro_ai_analyses.id = swing_visuals.analysis_id
  AND pro_ai_analyses.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_swing_visuals_analysis_id ON public.swing_visuals(analysis_id);
CREATE INDEX IF NOT EXISTS idx_swing_visuals_frame_index ON public.swing_visuals(analysis_id, frame_index);