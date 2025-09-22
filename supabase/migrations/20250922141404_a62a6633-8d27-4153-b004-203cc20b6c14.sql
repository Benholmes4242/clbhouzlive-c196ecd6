-- Create swing_visuals table for storing visual analysis data
CREATE TABLE public.swing_visuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  frame_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  overlay JSONB NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.swing_visuals ENABLE ROW LEVEL SECURITY;

-- Create policies for swing_visuals
CREATE POLICY "Users can view their own swing visuals" 
ON public.swing_visuals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.pro_ai_analyses 
  WHERE pro_ai_analyses.id = swing_visuals.analysis_id 
  AND pro_ai_analyses.user_id = auth.uid()
));

CREATE POLICY "Users can create swing visuals for their analyses" 
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
CREATE INDEX idx_swing_visuals_analysis_id ON public.swing_visuals(analysis_id);
CREATE INDEX idx_swing_visuals_frame_index ON public.swing_visuals(frame_index);

-- Create trigger for updated_at
CREATE TRIGGER update_swing_visuals_updated_at
  BEFORE UPDATE ON public.swing_visuals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to prevent duplicate visuals for same frame
ALTER TABLE public.swing_visuals 
ADD CONSTRAINT unique_analysis_frame 
UNIQUE (analysis_id, frame_index);