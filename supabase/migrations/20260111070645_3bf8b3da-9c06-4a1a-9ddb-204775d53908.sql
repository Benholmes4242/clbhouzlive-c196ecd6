-- Phase 1.1: Create college_logo_sources mapping table
CREATE TABLE IF NOT EXISTS public.college_logo_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'sportslogos',
  source_page_url text,
  suggested_url text,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.college_logo_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Anyone can read college logo sources"
ON public.college_logo_sources
FOR SELECT
USING (true);

-- Phase 1.2: Seed from college_media
INSERT INTO public.college_logo_sources (normalized_name, source_page_url)
SELECT normalized_name, ''
FROM public.college_media
ON CONFLICT (normalized_name) DO NOTHING;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_college_logo_sources_status ON public.college_logo_sources(status);
CREATE INDEX IF NOT EXISTS idx_college_logo_sources_normalized_name ON public.college_logo_sources(normalized_name);