-- Null out all Sportradar headshot URLs from sr_players
-- These contained embedded API keys and are replaced by R2 CDN headshots
UPDATE sr_players 
SET photo_url = NULL 
WHERE photo_url LIKE '%sportradar%';

-- Drop sr_media_assets table — Sportradar media system fully decommissioned
DROP TABLE IF EXISTS public.sr_media_assets CASCADE;