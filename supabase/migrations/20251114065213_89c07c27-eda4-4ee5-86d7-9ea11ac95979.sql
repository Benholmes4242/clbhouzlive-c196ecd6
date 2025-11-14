-- Add last_opened_at column to echo_threads
ALTER TABLE public.echo_threads 
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster sorting by last_opened_at
CREATE INDEX IF NOT EXISTS idx_echo_threads_last_opened_at 
ON public.echo_threads(last_opened_at DESC NULLS LAST);

-- Create function to update last_opened_at
CREATE OR REPLACE FUNCTION public.echo_thread_update_last_opened(p_thread UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.echo_threads
  SET last_opened_at = now()
  WHERE id = p_thread
    AND user_id = auth.uid();
END;
$$;