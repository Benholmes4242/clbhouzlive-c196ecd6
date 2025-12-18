-- Backfill existing business_members (owner/admin) into business_team_members
INSERT INTO public.business_team_members (business_id, user_profile_id, role, created_by)
SELECT
  bm.business_id,
  bm.user_profile_id,
  CASE
    WHEN bm.role = 'owner' THEN 'owner'::public.business_team_role
    WHEN bm.role = 'admin' THEN 'admin'::public.business_team_role
    ELSE 'staff'::public.business_team_role
  END,
  bm.user_profile_id
FROM public.business_members bm
LEFT JOIN public.business_team_members btm
  ON btm.business_id = bm.business_id
 AND btm.user_profile_id = bm.user_profile_id
WHERE btm.id IS NULL
  AND bm.role IN ('owner', 'admin');

-- Create trigger function to auto-sync business_members to business_team_members
CREATE OR REPLACE FUNCTION public.sync_business_member_to_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('owner', 'admin') THEN
    INSERT INTO public.business_team_members (business_id, user_profile_id, role, created_by)
    VALUES (
      NEW.business_id,
      NEW.user_profile_id,
      NEW.role::public.business_team_role,
      NEW.user_profile_id
    )
    ON CONFLICT (business_id, user_profile_id)
    DO UPDATE SET role = EXCLUDED.role;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_sync_business_member_to_team ON public.business_members;
CREATE TRIGGER trg_sync_business_member_to_team
AFTER INSERT OR UPDATE OF role
ON public.business_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_business_member_to_team();