-- =============================================
-- SHARED RLS HELPER FUNCTIONS
-- =============================================

-- is_admin: Check if current user is platform admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = auth.uid()
  );
$$;

-- can_manage_business: Owner OR Admin of business
CREATE OR REPLACE FUNCTION public.can_manage_business(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = _business_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
  );
$$;

-- is_business_owner: Owner only
CREATE OR REPLACE FUNCTION public.is_business_owner(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = _business_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role = 'owner'
  );
$$;

-- =============================================
-- RLS FOR business_members
-- =============================================

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Owners/Admins can see team
CREATE POLICY bm_select_team
ON public.business_members
FOR SELECT
TO authenticated
USING (
  public.can_manage_business(business_id)
);

-- INSERT: Owners can add members
CREATE POLICY bm_insert_owner
ON public.business_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_business_owner(business_id)
);

-- UPDATE: Owners can manage roles
CREATE POLICY bm_update_owner
ON public.business_members
FOR UPDATE
TO authenticated
USING (
  public.is_business_owner(business_id)
)
WITH CHECK (
  public.is_business_owner(business_id)
);

-- DELETE: Owner only
CREATE POLICY bm_delete_owner
ON public.business_members
FOR DELETE
TO authenticated
USING (
  public.is_business_owner(business_id)
);

-- Safety trigger: Prevent removing last owner
CREATE OR REPLACE FUNCTION public.prevent_invalid_owner_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    IF (
      SELECT count(*) FROM public.business_members
      WHERE business_id = OLD.business_id
        AND role = 'owner'
    ) <= 1 THEN
      RAISE EXCEPTION 'Business must have at least one owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_invalid_owner_change
BEFORE UPDATE ON public.business_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_invalid_owner_change();

-- =============================================
-- RLS FOR business_invites
-- =============================================

ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- SELECT: Owners/Admins see invites
CREATE POLICY bi_select_business
ON public.business_invites
FOR SELECT
TO authenticated
USING (
  public.can_manage_business(business_id)
);

-- INSERT: Owner/Admin can invite
CREATE POLICY bi_insert_owner_admin
ON public.business_invites
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_business(business_id)
  AND invited_by = auth.uid()
);

-- UPDATE: Inviter or manager can update (accept/revoke)
CREATE POLICY bi_update_accept
ON public.business_invites
FOR UPDATE
TO authenticated
USING (
  invited_by = auth.uid()
  OR public.can_manage_business(business_id)
);

-- DELETE: Owner/Admin revoke
CREATE POLICY bi_delete_owner_admin
ON public.business_invites
FOR DELETE
TO authenticated
USING (
  public.can_manage_business(business_id)
);

-- =============================================
-- RLS FOR business_activity_log (append-only)
-- =============================================

ALTER TABLE public.business_activity_log ENABLE ROW LEVEL SECURITY;

-- SELECT: Owners/Admins can read
CREATE POLICY bal_select
ON public.business_activity_log
FOR SELECT
TO authenticated
USING (
  public.can_manage_business(business_id)
);

-- INSERT: Admin or system only
CREATE POLICY bal_insert_admin
ON public.business_activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR public.can_manage_business(business_id)
);

-- No UPDATE or DELETE policies (immutable audit trail)

-- =============================================
-- RLS FOR business_domain_verifications
-- =============================================

ALTER TABLE public.business_domain_verifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner/Admin can see domain status
CREATE POLICY bdv_select
ON public.business_domain_verifications
FOR SELECT
TO authenticated
USING (
  public.can_manage_business(business_id)
);

-- INSERT: Owner only (when admin requests)
CREATE POLICY bdv_insert_owner
ON public.business_domain_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_business_owner(business_id)
);

-- UPDATE: Owner submits code, Admin finalises
CREATE POLICY bdv_update_owner_or_admin
ON public.business_domain_verifications
FOR update
TO authenticated
USING (
  public.is_business_owner(business_id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_business_owner(business_id)
  OR public.is_admin()
);

-- DELETE: Admin only
CREATE POLICY bdv_delete_admin
ON public.business_domain_verifications
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);