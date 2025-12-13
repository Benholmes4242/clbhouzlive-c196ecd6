-- ============================================
-- PHASE A: Business Team / Invites
-- ============================================

-- business_invites table for team invitations
CREATE TABLE IF NOT EXISTS public.business_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'analyst', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days')
);

CREATE INDEX IF NOT EXISTS idx_business_invites_business ON public.business_invites (business_id, status);
CREATE INDEX IF NOT EXISTS idx_business_invites_email ON public.business_invites (invitee_email);
CREATE INDEX IF NOT EXISTS idx_business_invites_token ON public.business_invites (token);

-- RLS for business_invites
ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Owners/Admins can view invites for their business
CREATE POLICY "biz_invites_select" ON public.business_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_invites.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
    OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Owners/Admins can create invites
CREATE POLICY "biz_invites_insert" ON public.business_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_invites.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
  );

-- Owners can update/revoke invites
CREATE POLICY "biz_invites_update" ON public.business_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_invites.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- PHASE B: Business Activity Log
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_business ON public.business_activity_log (business_id, created_at DESC);

-- RLS for activity log
ALTER TABLE public.business_activity_log ENABLE ROW LEVEL SECURITY;

-- Business owners/admins can read logs
CREATE POLICY "biz_activity_select" ON public.business_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_activity_log.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role IN ('owner', 'admin')
    )
  );

-- System/triggers insert logs (security definer functions)
CREATE POLICY "biz_activity_insert_system" ON public.business_activity_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PHASE C: Tier 2 Domain Verification
-- ============================================

-- Add domain verification columns to business_verification_requests
ALTER TABLE public.business_verification_requests
  ADD COLUMN IF NOT EXISTS requires_domain_check BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS domain_confirmed_at TIMESTAMPTZ;

-- Domain verifications table for code storage
CREATE TABLE IF NOT EXISTS public.business_domain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.business_verification_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_domain_verif_request ON public.business_domain_verifications (request_id, status);

-- RLS for domain verifications
ALTER TABLE public.business_domain_verifications ENABLE ROW LEVEL SECURITY;

-- Business owners can view their domain verifications
CREATE POLICY "domain_verif_select_owner" ON public.business_domain_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_domain_verifications.business_id
        AND bm.user_profile_id = auth.uid()
        AND bm.role = 'owner'
    )
  );

-- Admins can view all domain verifications
CREATE POLICY "domain_verif_select_admin" ON public.business_domain_verifications
  FOR SELECT USING (public.is_admin());

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_domain_verifications;

-- ============================================
-- RPCs for Team Management
-- ============================================

-- Accept invite RPC
CREATE OR REPLACE FUNCTION public.accept_business_invite(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_membership_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get invite
  SELECT * INTO v_invite
  FROM public.business_invites
  WHERE token = p_token AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found or already used');
  END IF;

  -- Check expiry
  IF v_invite.expires_at < now() THEN
    UPDATE public.business_invites SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
  END IF;

  -- Check email matches
  IF v_invite.invitee_email != (SELECT email FROM auth.users WHERE id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;

  -- Check not already a member
  IF EXISTS (SELECT 1 FROM public.business_members WHERE business_id = v_invite.business_id AND user_profile_id = v_user_id) THEN
    UPDATE public.business_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this business');
  END IF;

  -- Create membership
  INSERT INTO public.business_members (business_id, user_profile_id, role)
  VALUES (v_invite.business_id, v_user_id, v_invite.role)
  RETURNING id INTO v_membership_id;

  -- Update invite status
  UPDATE public.business_invites SET status = 'accepted' WHERE id = v_invite.id;

  -- Log activity
  INSERT INTO public.business_activity_log (business_id, actor_user_id, type, metadata)
  VALUES (v_invite.business_id, v_user_id, 'team_invite_accepted', jsonb_build_object(
    'invite_id', v_invite.id,
    'role', v_invite.role,
    'invited_by', v_invite.invited_by
  ));

  RETURN jsonb_build_object('success', true, 'membership_id', v_membership_id);
END;
$$;

-- Remove team member RPC (owner only)
CREATE OR REPLACE FUNCTION public.remove_business_member(p_business_id UUID, p_member_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get actor's role
  SELECT role INTO v_actor_role
  FROM public.business_members
  WHERE business_id = p_business_id AND user_profile_id = auth.uid();

  IF v_actor_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owners can remove members');
  END IF;

  -- Get target's role
  SELECT role INTO v_target_role
  FROM public.business_members
  WHERE business_id = p_business_id AND user_profile_id = p_member_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  -- Cannot remove last owner
  IF v_target_role = 'owner' THEN
    IF (SELECT COUNT(*) FROM public.business_members WHERE business_id = p_business_id AND role = 'owner') <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the last owner');
    END IF;
  END IF;

  -- Remove member
  DELETE FROM public.business_members
  WHERE business_id = p_business_id AND user_profile_id = p_member_user_id;

  -- Log activity
  INSERT INTO public.business_activity_log (business_id, actor_user_id, type, metadata)
  VALUES (p_business_id, auth.uid(), 'team_member_removed', jsonb_build_object(
    'removed_user_id', p_member_user_id,
    'removed_role', v_target_role
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update member role RPC (owner only)
CREATE OR REPLACE FUNCTION public.update_business_member_role(p_business_id UUID, p_member_user_id UUID, p_new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role TEXT;
  v_old_role TEXT;
BEGIN
  -- Validate role
  IF p_new_role NOT IN ('owner', 'admin', 'editor', 'analyst', 'member') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Get actor's role
  SELECT role INTO v_actor_role
  FROM public.business_members
  WHERE business_id = p_business_id AND user_profile_id = auth.uid();

  IF v_actor_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owners can change roles');
  END IF;

  -- Get target's current role
  SELECT role INTO v_old_role
  FROM public.business_members
  WHERE business_id = p_business_id AND user_profile_id = p_member_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;

  -- Cannot demote last owner
  IF v_old_role = 'owner' AND p_new_role != 'owner' THEN
    IF (SELECT COUNT(*) FROM public.business_members WHERE business_id = p_business_id AND role = 'owner') <= 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot demote the last owner');
    END IF;
  END IF;

  -- Update role
  UPDATE public.business_members
  SET role = p_new_role
  WHERE business_id = p_business_id AND user_profile_id = p_member_user_id;

  -- Log activity
  INSERT INTO public.business_activity_log (business_id, actor_user_id, type, metadata)
  VALUES (p_business_id, auth.uid(), 'team_role_changed', jsonb_build_object(
    'target_user_id', p_member_user_id,
    'old_role', v_old_role,
    'new_role', p_new_role
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Admin request domain check RPC
CREATE OR REPLACE FUNCTION public.request_domain_verification(p_request_id UUID, p_domain TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE public.business_verification_requests
  SET requires_domain_check = true, domain = p_domain
  WHERE id = p_request_id;

  -- Log activity
  INSERT INTO public.business_activity_log (business_id, actor_user_id, type, metadata)
  SELECT business_id, auth.uid(), 'verification_domain_check_requested', jsonb_build_object(
    'request_id', p_request_id,
    'domain', p_domain
  )
  FROM public.business_verification_requests WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Verify domain code RPC
CREATE OR REPLACE FUNCTION public.verify_domain_code(p_verification_id UUID, p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verif RECORD;
  v_code_hash TEXT;
BEGIN
  -- Get verification record
  SELECT * INTO v_verif
  FROM public.business_domain_verifications
  WHERE id = p_verification_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Verification not found');
  END IF;

  -- Check expiry
  IF v_verif.expires_at < now() THEN
    UPDATE public.business_domain_verifications SET status = 'expired' WHERE id = p_verification_id;
    RETURN jsonb_build_object('success', false, 'error', 'Code has expired');
  END IF;

  -- Check code (simple hash comparison)
  v_code_hash := encode(sha256(p_code::bytea), 'hex');
  IF v_code_hash != v_verif.code_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;

  -- Mark as verified
  UPDATE public.business_domain_verifications
  SET status = 'verified', verified_at = now()
  WHERE id = p_verification_id;

  -- Update verification request
  UPDATE public.business_verification_requests
  SET domain_confirmed = true, domain_confirmed_at = now()
  WHERE id = v_verif.request_id;

  -- Log activity
  INSERT INTO public.business_activity_log (business_id, actor_user_id, type, metadata)
  VALUES (v_verif.business_id, auth.uid(), 'verification_domain_confirmed', jsonb_build_object(
    'request_id', v_verif.request_id,
    'email', v_verif.email
  ));

  RETURN jsonb_build_object('success', true);
END;
$$;