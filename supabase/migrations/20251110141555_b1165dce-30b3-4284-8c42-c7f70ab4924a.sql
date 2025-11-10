-- Phase 1: Admin Backend Hardening
-- 1. Create audit table for admin role changes
-- 2. Create is_panel_admin() RPC as single source of truth
-- 3. Update RLS policies to use is_panel_admin() for admin surfaces

-- 1. Audit table for admin role changes
CREATE TABLE IF NOT EXISTS public.admin_role_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('grant_limited','grant_full','downgrade','revoke','set_expiry','clear_expiry')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_role_audit_target_idx ON public.admin_role_audit (target_user_id);
CREATE INDEX IF NOT EXISTS admin_role_audit_created_idx ON public.admin_role_audit (created_at DESC);

-- 2. Single-source admin check RPC for policies
-- This replaces is_admin() for panel access - checks admin_memberships only
CREATE OR REPLACE FUNCTION public.is_panel_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_memberships
    WHERE user_id = auth.uid()
      AND role IN ('limited','full')
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- 3. Update RLS policies on admin surfaces to use is_panel_admin()
-- These tables are admin-panel specific and should check admin_memberships

-- admin_invitations policies
DROP POLICY IF EXISTS "Admins can view invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.admin_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.admin_invitations;

CREATE POLICY "Panel admins can view invitations"
  ON public.admin_invitations
  FOR SELECT
  USING (public.is_panel_admin());

CREATE POLICY "Panel admins can create invitations"
  ON public.admin_invitations
  FOR INSERT
  WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins can update invitations"
  ON public.admin_invitations
  FOR UPDATE
  USING (public.is_panel_admin());

-- admin_profiles policies
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON public.admin_profiles;

CREATE POLICY "Panel admins can view all admin profiles"
  ON public.admin_profiles
  FOR SELECT
  USING (public.is_panel_admin());

-- admin_audit_log policies
DROP POLICY IF EXISTS "Admins can view audit log" ON public.admin_audit_log;

CREATE POLICY "Panel admins can view audit log"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.is_panel_admin());

-- logos table policies (admin-managed content)
DROP POLICY IF EXISTS "Admins can view logos" ON public.logos;
DROP POLICY IF EXISTS "Admins can insert logos" ON public.logos;
DROP POLICY IF EXISTS "Admins can update logos" ON public.logos;
DROP POLICY IF EXISTS "Admins can delete logos" ON public.logos;

CREATE POLICY "Panel admins can view logos"
  ON public.logos
  FOR SELECT
  USING (public.is_panel_admin());

CREATE POLICY "Panel admins can insert logos"
  ON public.logos
  FOR INSERT
  WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins can update logos"
  ON public.logos
  FOR UPDATE
  USING (public.is_panel_admin());

CREATE POLICY "Panel admins can delete logos"
  ON public.logos
  FOR DELETE
  USING (public.is_panel_admin());

-- logos storage bucket policies
DROP POLICY IF EXISTS "Admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete logos" ON storage.objects;

CREATE POLICY "Panel admins can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND public.is_panel_admin());

CREATE POLICY "Panel admins can update logos in storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND public.is_panel_admin());

CREATE POLICY "Panel admins can delete logos from storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND public.is_panel_admin());

-- admin_role_audit policies (new table)
CREATE POLICY "Panel admins can view role audit"
  ON public.admin_role_audit
  FOR SELECT
  USING (public.is_panel_admin());

-- Note: user_roles table keeps is_admin() for app-role logic, not panel access
-- Note: user_profiles admin policies keep is_admin() as they may be used for app admin features