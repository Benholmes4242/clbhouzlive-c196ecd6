-- Add address fields to business_accounts
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS address_label text,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS postcode text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS mapbox_place_id text,
ADD COLUMN IF NOT EXISTS location_precision text CHECK (location_precision IN ('address', 'poi', 'postcode', 'city', 'region', 'country', 'pin')),
ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Add index for location precision queries
CREATE INDEX IF NOT EXISTS idx_business_accounts_location_precision ON public.business_accounts(location_precision);

-- Add comment for documentation
COMMENT ON COLUMN public.business_accounts.location_precision IS 'Precision level: address (best), poi, postcode, city, region, country, pin (user-dropped)';