-- Enable trigram extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add normalized course name for better searching
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS course_name_normalized text GENERATED ALWAYS AS (
  lower(trim(regexp_replace(course_name, '\s+', ' ', 'g')))
) STORED;

-- Create index for faster course name searches
CREATE INDEX IF NOT EXISTS idx_games_course_name_normalized ON public.games USING gin(course_name_normalized gin_trgm_ops);