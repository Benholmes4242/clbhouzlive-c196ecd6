-- Create rate limiting table for Echo AI
CREATE TABLE IF NOT EXISTS public.echo_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.echo_rate_limits ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX idx_echo_rate_limits_user_created ON public.echo_rate_limits (user_id, created_at DESC);

-- Auto-cleanup old records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.echo_rate_limits WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS policy: Only service role can access (edge function uses service role)
CREATE POLICY "Service role only" ON public.echo_rate_limits FOR ALL USING (false);