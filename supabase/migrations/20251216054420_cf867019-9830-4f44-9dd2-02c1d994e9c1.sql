-- Add lat/lng columns to business_accounts for map/directions functionality
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;

-- Add comment for documentation
COMMENT ON COLUMN public.business_accounts.lat IS 'Latitude coordinate from Mapbox for location';
COMMENT ON COLUMN public.business_accounts.lng IS 'Longitude coordinate from Mapbox for location';