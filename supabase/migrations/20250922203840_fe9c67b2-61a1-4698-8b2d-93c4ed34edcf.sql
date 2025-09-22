-- Create swing_phase_results table for storing phase analysis data
CREATE TABLE public.swing_phase_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'queued', 'running', 'done', 'error')),
  used_frame_index INTEGER,
  metrics JSONB DEFAULT '{}',
  tips JSONB DEFAULT '[]',
  confidence NUMERIC(3,2) DEFAULT 0,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one result per session per phase
  UNIQUE(session_id, phase)
);

-- Enable Row Level Security
ALTER TABLE public.swing_phase_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (assuming sessions are user-owned)
CREATE POLICY "Users can view their own phase results" 
ON public.swing_phase_results 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM swing_sessions ss 
    WHERE ss.id = swing_phase_results.session_id 
    AND ss.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own phase results" 
ON public.swing_phase_results 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM swing_sessions ss 
    WHERE ss.id = swing_phase_results.session_id 
    AND ss.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own phase results" 
ON public.swing_phase_results 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM swing_sessions ss 
    WHERE ss.id = swing_phase_results.session_id 
    AND ss.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_swing_phase_results_updated_at
BEFORE UPDATE ON public.swing_phase_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_swing_phase_results_session_id ON public.swing_phase_results(session_id);
CREATE INDEX idx_swing_phase_results_phase ON public.swing_phase_results(phase);
CREATE INDEX idx_swing_phase_results_status ON public.swing_phase_results(status);