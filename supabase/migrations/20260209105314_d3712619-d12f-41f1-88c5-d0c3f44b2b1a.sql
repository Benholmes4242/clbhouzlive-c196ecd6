-- Add display_title column for custom job titles (P0)
-- This allows team members to set professional titles like "Head Professional", "Director of Golf"
-- instead of showing system roles publicly

ALTER TABLE public.business_team_members 
ADD COLUMN display_title TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.business_team_members.display_title IS 'Custom professional title for public display (e.g., Head Professional, Director of Golf). Falls back to system role label if null.';