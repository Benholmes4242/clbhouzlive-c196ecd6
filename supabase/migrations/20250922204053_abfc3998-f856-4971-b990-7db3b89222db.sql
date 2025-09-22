-- Add confidence column to swing_phase_results table
ALTER TABLE public.swing_phase_results 
ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 0;