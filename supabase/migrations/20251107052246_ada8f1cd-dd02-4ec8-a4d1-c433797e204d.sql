-- Add thread_id column to pro_ai_analyses to link swing analyses to their conversations
ALTER TABLE public.pro_ai_analyses 
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.echo_threads(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pro_ai_analyses_thread_id ON public.pro_ai_analyses(thread_id);

-- Backfill existing records: match session_id to thread_id if they exist
-- This assumes session_id was used as thread_id in some cases
UPDATE public.pro_ai_analyses
SET thread_id = echo_threads.id
FROM public.echo_threads
WHERE pro_ai_analyses.user_id = echo_threads.user_id
  AND pro_ai_analyses.thread_id IS NULL
  AND echo_threads.created_at <= pro_ai_analyses.created_at
  AND echo_threads.created_at >= (pro_ai_analyses.created_at - interval '5 minutes');