-- The federation owns a connected member's handicap, full stop.
-- 1) The snapshot trigger now also clears any manual figure when it writes the
--    federation index, so the two columns can never coexist on one row.
CREATE OR REPLACE FUNCTION public.sync_user_profiles_handicap_from_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles up
  SET
    eg_handicap_index = NEW.handicap_index,
    manual_handicap_index = NULL,
    updated_at = now()
  FROM whs_connections wc
  WHERE wc.id = NEW.connection_id
    AND up.id = wc.user_id;
  RETURN NEW;
END;
$$;

-- 2) manual_handicap_index survives ONLY for members with no connection.
--    Both columns populated on the same row is the failure mode we are
--    eliminating (a stale manual value silently taking precedence in the
--    COALESCE-based read paths), so the database now refuses it outright.
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_single_handicap_source;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_single_handicap_source
  CHECK (eg_handicap_index IS NULL OR manual_handicap_index IS NULL);

COMMENT ON COLUMN public.user_profiles.manual_handicap_index IS
  'User-entered handicap. ONLY for members with no WHS connection. Mutually exclusive with eg_handicap_index (enforced by user_profiles_single_handicap_source). Connected members get their index from the sync, which is the sole writer of eg_handicap_index.';