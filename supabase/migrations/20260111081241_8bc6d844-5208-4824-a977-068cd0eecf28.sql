-- Add FK from college_logo_sources.normalized_name → college_media.normalized_name
ALTER TABLE public.college_logo_sources
ADD CONSTRAINT college_logo_sources_normalized_name_fkey
FOREIGN KEY (normalized_name)
REFERENCES public.college_media(normalized_name)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';