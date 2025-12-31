-- Create table for AI caption usage tracking (daily quota)
CREATE TABLE public.ai_caption_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_caption_usage_user_date_unique UNIQUE (user_id, usage_date)
);

-- Enable Row Level Security
ALTER TABLE public.ai_caption_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own caption usage"
ON public.ai_caption_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage (via edge function)
CREATE POLICY "Users can insert their own caption usage"
ON public.ai_caption_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage (via edge function)
CREATE POLICY "Users can update their own caption usage"
ON public.ai_caption_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_ai_caption_usage_user_date ON public.ai_caption_usage(user_id, usage_date);

-- Create updated_at trigger
CREATE TRIGGER update_ai_caption_usage_updated_at
BEFORE UPDATE ON public.ai_caption_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();