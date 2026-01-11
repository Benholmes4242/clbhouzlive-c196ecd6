-- Add columns for Perplexity auto-match discovery results
ALTER TABLE public.college_logo_sources
  ADD COLUMN IF NOT EXISTS found_page_url text,
  ADD COLUMN IF NOT EXISTS found_image_url text,
  ADD COLUMN IF NOT EXISTS confidence numeric;

-- Add comment for clarity
COMMENT ON COLUMN public.college_logo_sources.found_page_url IS 'SportsLogos.net page URL discovered by Perplexity';
COMMENT ON COLUMN public.college_logo_sources.found_image_url IS 'Direct logo image URL discovered by Perplexity';
COMMENT ON COLUMN public.college_logo_sources.confidence IS 'Confidence score (0-1) from Perplexity discovery';