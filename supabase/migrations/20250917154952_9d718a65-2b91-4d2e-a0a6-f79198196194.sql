-- Create table for user suggestion dismissals
CREATE TABLE public.user_suggestion_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dismissed_user_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, dismissed_user_id)
);

-- Enable RLS
ALTER TABLE public.user_suggestion_dismissals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own dismissals" 
ON public.user_suggestion_dismissals 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_suggestion_dismissals_user_id ON public.user_suggestion_dismissals(user_id);
CREATE INDEX idx_user_suggestion_dismissals_expires_at ON public.user_suggestion_dismissals(expires_at);

-- Create function to clean up expired dismissals
CREATE OR REPLACE FUNCTION public.cleanup_expired_dismissals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_suggestion_dismissals
  WHERE expires_at < now();
END;
$$;