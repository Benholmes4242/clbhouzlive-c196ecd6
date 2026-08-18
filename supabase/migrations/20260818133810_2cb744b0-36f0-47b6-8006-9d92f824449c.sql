-- ═══════════════════════════════════════════════════════════════════════
-- BRIEF_VERIFICATION_PHASE_5B
-- §0 one audit system, §1 revocation surfaced, §3 re-verification, §5 golfers
-- The 23 existing audit rows are NOT touched, migrated or backfilled (§0.5).
-- ═══════════════════════════════════════════════════════════════════════

-- §3 — re-verification needs its own audit actions.
ALTER TABLE public.verification_audit_log DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;
ALTER TABLE public.verification_audit_log ADD CONSTRAINT verification_audit_log_action_check CHECK (action = ANY (ARRAY[
  'submitted','approved','rejected','removed','revoked','needs_more_info',
  'domain_check_requested','more_proof_requested','cooldown_bypassed',
  'golfer_invited','golfer_accepted','golfer_declined','golfer_approved',
  'golfer_rejected','golfer_removed','golfer_test_reset',
  'golfer_verification_bypassed_second_approval',
  -- PHASE 5B §3
  'recheck_passed','recheck_flagged','recheck_prompted'
]));

-- ─── §3 RE-VERIFICATION STATE ────────────────────────────────────────────
ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS verification_recheck_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_recheck_state text
    CHECK (verification_recheck_state IS NULL OR verification_recheck_state IN ('passed','flagged','prompted')),
  ADD COLUMN IF NOT EXISTS verification_recheck_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_recheck_reason text;

-- verified_at drives the cadence: annual (§3.2).
UPDATE public.business_accounts
SET verification_recheck_due_at = verified_at + interval '1 year'
WHERE is_verified = true AND verified_at IS NOT NULL AND verification_recheck_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_accounts_recheck_due
  ON public.business_accounts (verification_recheck_due_at)
  WHERE is_verified = true;

-- §3.3 — a failed re-check FLAGS. It never revokes.
CREATE OR REPLACE FUNCTION public.flag_verification_recheck(
  p_business_id uuid,
  p_state text,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_actor uuid := auth.uid();
BEGIN
  IF p_state NOT IN ('passed','flagged','prompted') THEN
    RAISE EXCEPTION 'Invalid recheck state: %', p_state;
  END IF;

  UPDATE public.business_accounts
  SET verification_recheck_state = p_state,
      verification_recheck_at = now(),
      verification_recheck_reason = p_reason,
      -- A pass rolls the clock forward a year; a flag or prompt waits on a human.
      verification_recheck_due_at = CASE WHEN p_state = 'passed' THEN now() + interval '1 year'
                                         ELSE verification_recheck_due_at END
  WHERE id = p_business_id;

  INSERT INTO public.verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('business', p_business_id, 'recheck_' || p_state, v_actor, p_reason,
          jsonb_build_object('automated', v_actor IS NULL));
END; $$;

REVOKE ALL ON FUNCTION public.flag_verification_recheck(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.flag_verification_recheck(uuid, text, text) TO service_role;

-- ─── §1 REVOCATION, GATED AND STATED ────────────────────────────────────
-- Same single overload, with p_note appended (defaulted, so 4-arg calls still
-- resolve). CORRECTION: the pre-5B body was SECURITY DEFINER with NO admin
-- check — any authenticated caller could unverify any business.
DROP FUNCTION IF EXISTS public.revoke_business_verification(uuid, uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.revoke_business_verification(
  p_business_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT NULL,
  p_bypass_cooldown boolean DEFAULT false,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_admin uuid := COALESCE(p_admin_id, auth.uid());
  v_is_system_account boolean;
  v_business_name text;
  v_business_logo_url text;
  v_bypass boolean;
BEGIN
  -- §1.3 — an admin, or the service role acting on an admin's behalf.
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  SELECT is_system_account, name, logo_url
    INTO v_is_system_account, v_business_name, v_business_logo_url
  FROM business_accounts WHERE id = p_business_id;

  IF v_business_name IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  -- §1.3 — the bypass is for system accounts only.
  v_bypass := v_is_system_account AND p_bypass_cooldown;

  UPDATE business_accounts
  SET is_verified = false,
      verified_at = NULL,
      verified_by = NULL,
      last_verification_action = 'revoked',
      verification_cooldown_until = CASE WHEN v_is_system_account OR v_bypass
                                         THEN NULL ELSE now() + interval '7 days' END,
      verification_recheck_due_at = NULL,
      verification_recheck_state = NULL,
      verification_recheck_at = NULL,
      verification_recheck_reason = NULL
  WHERE id = p_business_id;

  UPDATE business_verification_requests
  SET status = 'revoked',
      reviewed_at = now(),
      reviewed_by = v_admin,
      review_reason = COALESCE(p_reason, review_reason),
      admin_note = COALESCE(p_note, admin_note)
  WHERE business_id = p_business_id AND status = 'approved';

  -- §0.4 — the log is the history.
  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('business', p_business_id, 'revoked', v_admin,
          COALESCE(p_note, p_reason, 'Business verification removed by admin.'),
          jsonb_build_object(
            'review_reason', p_reason,
            'admin_reason', p_reason,
            'admin_note', p_note,
            'business_name', v_business_name,
            'cooldown_bypassed', v_is_system_account OR v_bypass,
            'is_system_account', v_is_system_account,
            'admin_override', p_bypass_cooldown));

  -- §1.5 — the revoked business MUST be told. Owners and admins, not owners alone.
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, recipient_actor_id, data, entity_type, entity_id)
    SELECT bm.user_profile_id, 'business_verification_revoked', 'Verification removed',
           'The verified badge for ' || v_business_name || ' has been removed.',
           bm.user_profile_id,
           jsonb_build_object('business_id', p_business_id, 'business_name', v_business_name,
                              'business_logo_url', v_business_logo_url, 'action', 'revoked',
                              'reason', p_reason, 'note', p_note),
           'business', p_business_id
    FROM business_members bm
    WHERE bm.business_id = p_business_id AND bm.role IN ('owner','admin')
      AND bm.user_profile_id IS NOT NULL
    ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Notification insert failed: %', SQLERRM; END;
END; $$;

REVOKE ALL ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean, text) TO authenticated, service_role;

-- ─── §5 THE GOLFER PATH ─────────────────────────────────────────────────
ALTER TABLE public.golfer_verification_requests
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_reason text;

-- §5.3 — one shape: status, who decided, an audit row, a notification.
CREATE OR REPLACE FUNCTION public.decide_golfer_verification(
  p_request_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL,
  p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_user_id uuid;
  v_status text;
BEGIN
  IF v_admin IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision: % (needs_more_info does not apply to an invite-only flow)', p_decision;
  END IF;
  IF p_decision = 'rejected' AND (p_reason IS NULL OR p_reason = '') THEN
    RAISE EXCEPTION 'A reason is required to decline';
  END IF;

  SELECT user_id, status INTO v_user_id, v_status
  FROM public.golfer_verification_requests WHERE id = p_request_id;

  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_status IN ('approved','rejected','removed') THEN
    RAISE EXCEPTION 'This request is already decided (%)', v_status;
  END IF;

  UPDATE public.golfer_verification_requests
  SET status = p_decision,
      reviewed_at = now(),
      reviewed_by = v_admin,
      review_reason = p_reason,
      admin_note = COALESCE(p_note, admin_note)
  WHERE id = p_request_id;

  IF p_decision = 'approved' THEN
    UPDATE public.user_profiles
    SET is_verified_golfer = true,
        golfer_verified_at = now(),
        golfer_verified_by = v_admin
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    CASE WHEN p_decision = 'approved' THEN 'golfer_verification_approved' ELSE 'golfer_verification_rejected' END,
    CASE WHEN p_decision = 'approved' THEN 'You are verified' ELSE 'Verification not granted' END,
    CASE WHEN p_decision = 'approved'
         THEN 'Your verified badge is now live across Clbhouz.'
         ELSE 'Your verification was not granted this time.' END,
    jsonb_build_object('decision', p_decision, 'reason', p_reason, 'decided_by', v_admin)
  );

  INSERT INTO public.verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('person', v_user_id,
          CASE WHEN p_decision = 'approved' THEN 'golfer_approved' ELSE 'golfer_rejected' END,
          v_admin, COALESCE(p_note, p_reason),
          jsonb_build_object('request_id', p_request_id, 'review_reason', p_reason, 'admin_note', p_note));
END; $$;

REVOKE ALL ON FUNCTION public.decide_golfer_verification(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_golfer_verification(uuid, text, text, text) TO authenticated, service_role;

-- §5.4 — removal already exists; it just needs a structured reason carried
-- through to the log. Same single overload, p_reason appended and defaulted.
DROP FUNCTION IF EXISTS public.remove_golfer_verification(uuid, text);

CREATE OR REPLACE FUNCTION public.remove_golfer_verification(
  p_user_id uuid,
  p_note text DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden - Admin required';
  END IF;

  UPDATE public.user_profiles
  SET is_verified_golfer = false, golfer_verified_at = NULL, golfer_verified_by = NULL
  WHERE id = p_user_id;

  UPDATE public.golfer_verification_requests
  SET status = 'removed', reviewed_at = now(), reviewed_by = v_admin, review_reason = p_reason
  WHERE user_id = p_user_id AND status = 'approved';

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, 'golfer_verification_removed', 'Verification removed',
          'Your verified badge has been removed.',
          jsonb_build_object('removed_by', v_admin, 'reason', p_reason));

  INSERT INTO public.verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('person', p_user_id, 'golfer_removed', v_admin, COALESCE(p_note, p_reason),
          jsonb_build_object('review_reason', p_reason, 'admin_note', p_note));
END; $$;

REVOKE ALL ON FUNCTION public.remove_golfer_verification(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_golfer_verification(uuid, text, text) TO authenticated, service_role;