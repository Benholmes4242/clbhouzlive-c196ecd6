BEGIN;

-- Drop the combined trigger.
DROP TRIGGER IF EXISTS trg_sync_business_member_to_team ON public.business_members;

-- INSERT trigger — fires on every new row.
CREATE TRIGGER trg_sync_business_member_to_team_insert
  AFTER INSERT ON public.business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_member_to_team();

-- UPDATE trigger — fires only when role changes (matches prior semantics).
CREATE TRIGGER trg_sync_business_member_to_team_update
  AFTER UPDATE OF role ON public.business_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_member_to_team();

COMMIT;