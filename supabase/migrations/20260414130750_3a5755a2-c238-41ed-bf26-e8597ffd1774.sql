-- Add new fields to business_accounts for Edit Wizard upgrade
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS social_links jsonb;

-- Add comments for clarity
COMMENT ON COLUMN public.business_accounts.founded_year IS 'Year the business was established, e.g. 1900';
COMMENT ON COLUMN public.business_accounts.booking_url IS 'Direct link to tee-sheet or booking system (BRS Golf, ClubV1, etc.)';
COMMENT ON COLUMN public.business_accounts.opening_hours IS 'JSON object with days as keys: { "Mon": { "open": "08:00", "close": "18:00", "closed": false }, ... }';
COMMENT ON COLUMN public.business_accounts.social_links IS 'JSON object: { "instagram": "@handle", "twitter": "@handle", "facebook": "url", "youtube": "url" }';