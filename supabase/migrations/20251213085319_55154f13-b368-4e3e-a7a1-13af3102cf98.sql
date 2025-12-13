-- Add system account flag to business_accounts
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS is_system_account boolean NOT NULL DEFAULT false;

-- Mark clbhouz as system account (if exists)
UPDATE public.business_accounts
SET is_system_account = true
WHERE LOWER(slug) = 'clbhouz' OR LOWER(name) = 'clbhouz';

-- Update revoke_business_verification to respect system accounts and admin override
CREATE OR REPLACE FUNCTION public.revoke_business_verification(
  p_business_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT NULL,
  p_bypass_cooldown boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_system_account boolean;
BEGIN
  -- Check if system account
  SELECT is_system_account INTO v_is_system_account
  FROM business_accounts WHERE id = p_business_id;

  -- Unverify the business
  UPDATE business_accounts
  SET 
    is_verified = false,
    verified_at = NULL,
    verified_by = NULL,
    last_verification_action = 'revoked',
    -- Only set cooldown if not system account and not bypassing
    verification_cooldown_until = CASE 
      WHEN v_is_system_account OR p_bypass_cooldown THEN NULL
      ELSE now() + interval '7 days'
    END
  WHERE id = p_business_id;

  -- Update any pending requests to revoked
  UPDATE business_verification_requests
  SET status = 'revoked', reviewed_at = now(), reviewed_by = p_admin_id
  WHERE business_id = p_business_id AND status = 'approved';

  -- Log to audit
  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES (
    'business', 
    p_business_id, 
    'revoked', 
    p_admin_id, 
    p_reason,
    jsonb_build_object(
      'cooldown_bypassed', v_is_system_account OR p_bypass_cooldown,
      'is_system_account', v_is_system_account,
      'admin_override', p_bypass_cooldown
    )
  );

  -- Send notification to business owner
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT 
    bm.user_profile_id,
    'business_verification',
    'Business verification removed',
    'Your business verification has been removed.',
    jsonb_build_object('business_id', p_business_id, 'action', 'revoked')
  FROM business_members bm
  WHERE bm.business_id = p_business_id AND bm.role = 'owner';
END;
$$;

-- Update submit_business_verification_review to respect system accounts
CREATE OR REPLACE FUNCTION public.submit_business_verification_review(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_note text DEFAULT NULL,
  p_bypass_cooldown boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_current_approvals integer;
  v_required_approvals integer;
  v_existing_review record;
  v_is_system_account boolean;
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM business_verification_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if system account
  SELECT is_system_account INTO v_is_system_account
  FROM business_accounts WHERE id = v_request.business_id;

  -- Check if reviewer already reviewed
  SELECT * INTO v_existing_review 
  FROM business_verification_reviews 
  WHERE request_id = p_request_id AND reviewer_id = p_reviewer_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  -- Insert review
  INSERT INTO business_verification_reviews (request_id, reviewer_id, decision, note)
  VALUES (p_request_id, p_reviewer_id, p_decision, p_note);

  -- If rejection, reject immediately
  IF p_decision = 'reject' THEN
    UPDATE business_verification_requests
    SET status = 'rejected', reviewed_at = now(), reviewed_by = p_reviewer_id, admin_note = p_note
    WHERE id = p_request_id;

    -- Set cooldown only if not system account and not bypassing
    UPDATE business_accounts
    SET 
      last_verification_action = 'rejected',
      verification_cooldown_until = CASE 
        WHEN v_is_system_account OR p_bypass_cooldown THEN NULL
        ELSE now() + interval '14 days'
      END
    WHERE id = v_request.business_id;

    -- Log to audit
    INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
    VALUES (
      'business', 
      v_request.business_id, 
      'rejected', 
      p_reviewer_id, 
      p_note,
      jsonb_build_object(
        'request_id', p_request_id,
        'cooldown_bypassed', v_is_system_account OR p_bypass_cooldown,
        'is_system_account', v_is_system_account,
        'admin_override', p_bypass_cooldown
      )
    );

    -- Notify owner
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT bm.user_profile_id, 'business_verification', 'Verification not approved',
           'Your business verification request was not approved.',
           jsonb_build_object('business_id', v_request.business_id, 'action', 'rejected')
    FROM business_members bm
    WHERE bm.business_id = v_request.business_id AND bm.role = 'owner';

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;

  -- Count approvals
  SELECT COUNT(*) INTO v_current_approvals
  FROM business_verification_reviews
  WHERE request_id = p_request_id AND decision = 'approve';

  v_required_approvals := v_request.required_approvals;

  -- Check if enough approvals
  IF v_current_approvals >= v_required_approvals THEN
    UPDATE business_verification_requests
    SET status = 'approved', reviewed_at = now(), reviewed_by = p_reviewer_id, approval_count = v_current_approvals
    WHERE id = p_request_id;

    UPDATE business_accounts
    SET is_verified = true, verified_at = now(), verified_by = p_reviewer_id,
        last_verification_action = 'approved', verification_cooldown_until = NULL
    WHERE id = v_request.business_id;

    -- Log to audit
    INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
    VALUES ('business', v_request.business_id, 'approved', p_reviewer_id, p_note,
            jsonb_build_object('request_id', p_request_id, 'approval_count', v_current_approvals));

    -- Notify owner
    INSERT INTO notifications (user_id, type, title, body, data)
    SELECT bm.user_profile_id, 'business_verification', 'Business verified',
           'Your business is now verified on Clbhouz.',
           jsonb_build_object('business_id', v_request.business_id, 'action', 'approved')
    FROM business_members bm
    WHERE bm.business_id = v_request.business_id AND bm.role = 'owner';

    RETURN jsonb_build_object('success', true, 'status', 'approved');
  ELSE
    UPDATE business_verification_requests
    SET approval_count = v_current_approvals
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'status', 'pending', 'approvals', v_current_approvals, 'required', v_required_approvals);
  END IF;
END;
$$;