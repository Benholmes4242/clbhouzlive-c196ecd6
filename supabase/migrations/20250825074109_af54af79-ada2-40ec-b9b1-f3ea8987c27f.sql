-- Create country_flags table to store flag metadata
CREATE TABLE IF NOT EXISTS public.country_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  flag_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.country_flags ENABLE ROW LEVEL SECURITY;

-- Create policies for country flags (public read access)
CREATE POLICY "Country flags are viewable by everyone" 
ON public.country_flags 
FOR SELECT 
USING (true);

-- Only system can manage country flags
CREATE POLICY "System can manage country flags" 
ON public.country_flags 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_country_flags_country_code ON public.country_flags(country_code);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_country_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_country_flags_updated_at
BEFORE UPDATE ON public.country_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_country_flags_updated_at();