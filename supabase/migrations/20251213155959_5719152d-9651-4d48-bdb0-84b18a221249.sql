-- Update notification copy for all business verification events

-- 1) Verification Submitted - "Request received"
CREATE OR REPLACE FUNCTION public.notify_verification_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business_name text;
  _business_logo text;
BEGIN
  SELECT name, logo_url INTO _business_name, _business_logo
  FROM public.business_accounts
  WHERE id = new.business_id;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    data
  ) VALUES (
    new.requested_by,
    'business_verification_submitted',
    'Request received',
    'Your verification request is being reviewed by our team.',
    'business_verification_request',
    new.id,
    jsonb_build_object(
      'business_id', new.business_id, 
      'status', 'pending',
      'entity_name', _business_name,
      'entity_avatar_url', _business_logo
    )
  );

  RETURN new;
END;
$$;

-- 2) Verification Approved/Rejected status change
CREATE OR REPLACE FUNCTION public.notify_verification_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title text;
  _body text;
  _type text;
  _business_name text;
  _business_logo text;
BEGIN
  IF old.status = new.status THEN
    RETURN new;
  END IF;

  SELECT name, logo_url INTO _business_name, _business_logo
  FROM public.business_accounts
  WHERE id = new.business_id;

  IF new.status = 'approved' THEN
    _title := 'You''re verified';
    _body  := 'Your business profile has been successfully verified.';
    _type  := 'business_verification_approved';
  ELSIF new.status = 'rejected' THEN
    _title := 'Verification not approved';
    _body  := coalesce(new.admin_note, 'We couldn''t verify your business at this time. You can update details and request again.');
    _type  := 'business_verification_rejected';
  ELSE
    RETURN new;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    data
  ) VALUES (
    new.requested_by,
    _type,
    _title,
    _body,
    'business_verification_request',
    new.id,
    jsonb_build_object(
      'business_id', new.business_id, 
      'status', new.status, 
      'admin_note', new.admin_note,
      'entity_name', _business_name,
      'entity_avatar_url', _business_logo
    )
  );

  RETURN new;
END;
$$;

-- 3) Verification Removed - "Verification status changed"
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
  v_business_name text;
  v_business_logo_url text;
BEGIN
  -- Get business details including name and logo
  SELECT 
    is_system_account,
    name,
    logo_url
  INTO 
    v_is_system_account,
    v_business_name,
    v_business_logo_url
  FROM business_accounts WHERE id = p_business_id;

  -- Unverify the business
  UPDATE business_accounts
  SET 
    is_verified = false,
    verified_at = NULL,
    verified_by = NULL,
    last_verification_action = 'revoked',
    verification_cooldown_until = CASE 
      WHEN v_is_system_account OR p_bypass_cooldown THEN NULL
      ELSE now() + interval '7 days'
    END
  WHERE id = p_business_id;

  -- Update any approved requests to revoked
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

  -- Send notification to business owner with updated copy
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      bm.user_profile_id,
      'business_verification_revoked',
      'Verification status changed',
      'Your business verification has been removed.',
      jsonb_build_object(
        'business_id', p_business_id, 
        'business_name', v_business_name,
        'business_logo_url', v_business_logo_url,
        'action', 'revoked',
        'reason', p_reason
      )
    FROM business_members bm
    WHERE bm.business_id = p_business_id AND bm.role = 'owner';
  EXCEPTION WHEN OTHERS THEN
    -- Swallow notification errors - revoke should still succeed
    RAISE NOTICE 'Notification insert failed: %', SQLERRM;
  END;
END;
$$;

-- Ensure authenticated users can execute
GRANT EXECUTE ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean) TO authenticated;