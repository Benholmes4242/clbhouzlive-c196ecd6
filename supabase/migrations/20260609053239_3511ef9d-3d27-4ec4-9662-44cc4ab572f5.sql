ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS manual_handicap_index numeric NULL;

COMMENT ON COLUMN public.user_profiles.manual_handicap_index IS
  'User-entered handicap. Used for display only when no active WHS connection exists. WHS (eg_handicap_index via whs_connections) always takes precedence when connected.';