-- 1) Update notifications type constraint to include all existing + new types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'like', 'comment', 'follow', 'mention', 'friend_request', 'friend_accept',
    'game_invite', 'game_request', 'game_reminder', 'game_update', 'game_message',
    'achievement', 'badge', 'challenge', 'milestone',
    'business_verification_submitted', 'business_verification_approved', 
    'business_verification_rejected', 'business_verification_removed',
    'business_verification_revoked',
    'business_verification_more_proof_requested', 'business_verification_domain_check_requested',
    'golfer_verification_invite', 'golfer_verification_approved', 
    'golfer_verification_rejected', 'golfer_verification_removed',
    'business_invite', 'business_member_added', 'business_member_removed',
    'system', 'announcement', 'welcome'
  )
);

-- 2) Update verification_audit_log action constraint
ALTER TABLE public.verification_audit_log DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;
ALTER TABLE public.verification_audit_log ADD CONSTRAINT verification_audit_log_action_check CHECK (
  action IN (
    'submitted', 'approved', 'rejected', 'removed', 'revoked',
    'domain_check_requested', 'more_proof_requested', 'cooldown_bypassed',
    'golfer_invited', 'golfer_accepted', 'golfer_declined', 'golfer_approved', 
    'golfer_rejected', 'golfer_removed', 'golfer_test_reset',
    'golfer_verification_bypassed_second_approval'
  )
);

-- 3) Create RPC: remove_golfer_verification
CREATE OR REPLACE FUNCTION public.remove_golfer_verification(
  p_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  -- Admin check
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = v_admin AND role IN ('full', 'limited')
  ) THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  -- Remove verified flag
  UPDATE public.user_profiles
  SET is_verified_golfer = false,
      golfer_verified_at = NULL,
      golfer_verified_by = NULL
  WHERE id = p_user_id;

  -- Mark latest request as removed
  UPDATE public.golfer_verification_requests
  SET status = 'removed',
      reviewed_at = now()
  WHERE user_id = p_user_id AND status = 'approved';

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_user_id,
    'golfer_verification_removed',
    'Verification updated',
    'Your verified golfer status has been removed.',
    jsonb_build_object('removed_by', v_admin)
  );

  -- Audit log
  INSERT INTO public.verification_audit_log (actor_id, target_user_id, action, note)
  VALUES (v_admin, p_user_id, 'golfer_removed', p_note);
END;
$$;

-- 4) Create RPC: reset_golfer_verification_test_user (for Benjamin Holmes only)
CREATE OR REPLACE FUNCTION public.reset_golfer_verification_test_user(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid := auth.uid();
  -- Benjamin Holmes's user_id
  v_test_user uuid := '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';
BEGIN
  -- Admin check
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = v_admin AND role IN ('full', 'limited')
  ) THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  -- Only allow reset for test user
  IF p_user_id <> v_test_user THEN
    RAISE EXCEPTION 'Forbidden - test reset only allowed for specific test user';
  END IF;

  -- Remove verified flag
  UPDATE public.user_profiles
  SET is_verified_golfer = false,
      golfer_verified_at = NULL,
      golfer_verified_by = NULL
  WHERE id = p_user_id;

  -- Delete reviews for this user's requests
  DELETE FROM public.golfer_verification_reviews
  WHERE request_id IN (
    SELECT id FROM public.golfer_verification_requests WHERE user_id = p_user_id
  );

  -- Delete requests
  DELETE FROM public.golfer_verification_requests
  WHERE user_id = p_user_id;

  -- Delete invites
  DELETE FROM public.golfer_verification_invites
  WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO public.verification_audit_log (actor_id, target_user_id, action, note)
  VALUES (v_admin, p_user_id, 'golfer_test_reset', 'Reset for infinite testing');
END;
$$;