-- Seed college_media from distinct sr_players.college values
-- Uses a custom normalization function that matches the frontend normalizeCollege()

-- First, create a helper function for normalization
CREATE OR REPLACE FUNCTION public.normalize_college_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF name IS NULL OR name = '' THEN
    RETURN '';
  END IF;
  
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(name, 'university of\s*', '', 'gi'),
            '\s*university$', '', 'gi'
          ),
          '\s*college$', '', 'gi'
        ),
        '\s*state\s*university$', ' state', 'gi'
      ),
      '[^a-z0-9]', '', 'gi'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Insert distinct colleges from sr_players with normalized names
-- Using ON CONFLICT to handle duplicates (different spellings normalizing to same key)
INSERT INTO public.college_media (college_name, normalized_name, short_name, country, source)
SELECT DISTINCT ON (public.normalize_college_name(college))
  college as college_name,
  public.normalize_college_name(college) as normalized_name,
  -- Extract a reasonable short_name (just the first significant word or the full name if short)
  CASE 
    WHEN LENGTH(college) <= 15 THEN college
    WHEN college ILIKE 'university of %' THEN SUBSTRING(college FROM 'university of (.+)')
    WHEN college ILIKE '% university' THEN SUBSTRING(college FROM '(.+) university')
    WHEN college ILIKE '% state' THEN college
    ELSE college
  END as short_name,
  'United States' as country,
  'sr_players_seed' as source
FROM sr_players
WHERE college IS NOT NULL 
  AND college != ''
  AND public.normalize_college_name(college) != ''
ORDER BY public.normalize_college_name(college), college
ON CONFLICT (normalized_name) DO NOTHING;