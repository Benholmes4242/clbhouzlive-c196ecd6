-- Create an immutable wrapper function for date truncation (needed for index)
CREATE OR REPLACE FUNCTION public.immutable_date_trunc_minute(ts timestamptz)
RETURNS timestamptz AS $$
  SELECT DATE_TRUNC('minute', ts AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;