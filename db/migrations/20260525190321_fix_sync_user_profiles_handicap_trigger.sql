-- ============================================================================
-- Fix sync_user_profiles_handicap_from_snapshot trigger function
-- ============================================================================
--
-- Background:
-- The original trigger function was overwritten at some point between
-- 2026-05-18 06:00 BST and 2026-05-19 20:11 BST (likely via direct dashboard
-- SQL) with a body that referenced NEW.friend_passport_id — a field that
-- does not exist on whs_handicap_snapshots. The broken trigger silently
-- failed every snapshot INSERT for ~7 days, blocking user_profiles.eg_handicap_index
-- from staying in sync with the latest handicap snapshot.
--
-- This migration restores the correct body. It joins the snapshot's
-- connection_id to whs_connections.id (the actual relationship), then
-- updates user_profiles via wc.user_id.
--
-- The trigger fires AFTER INSERT on whs_handicap_snapshots and is the
-- canonical mechanism for keeping user_profiles.eg_handicap_index fresh
-- without relying on app-level writes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_user_profiles_handicap_from_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE user_profiles up
  SET
    eg_handicap_index = NEW.handicap_index,
    updated_at = now()
  FROM whs_connections wc
  WHERE wc.id = NEW.connection_id
    AND up.id = wc.user_id;
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists and is bound to the function.
-- DROP/CREATE is idempotent — safe to re-run.
DROP TRIGGER IF EXISTS trg_sync_user_profiles_handicap_from_snapshot
  ON public.whs_handicap_snapshots;

CREATE TRIGGER trg_sync_user_profiles_handicap_from_snapshot
  AFTER INSERT ON public.whs_handicap_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_profiles_handicap_from_snapshot();

COMMENT ON FUNCTION public.sync_user_profiles_handicap_from_snapshot() IS
  'Trigger function: on whs_handicap_snapshots INSERT, syncs the new handicap_index '
  'to user_profiles.eg_handicap_index for the owning user. Joins via '
  'whs_connections.id = NEW.connection_id, then wc.user_id = user_profiles.id. '
  'Restored 2026-05-25 after broken version (referencing non-existent '
  'NEW.friend_passport_id) was discovered to have been silently failing '
  'INSERTs since 2026-05-18. See migration ' || '20260525000000' || '.';
