-- Fix notifications insert column name mismatch in revoke_business_verification
-- Change notifications(body) -> notifications(message)

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

  -- Send notification to business owner (FIXED: body -> message)
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    bm.user_profile_id,
    'business_verification',
    'Business verification removed',
    'Your business verification has been removed.',
    jsonb_build_object(
      'business_id', p_business_id, 
      'action', 'revoked',
      'reason', p_reason
    )
  FROM business_members bm
  WHERE bm.business_id = p_business_id AND bm.role = 'owner';
END;
$$;

-- Ensure authenticated users can execute
GRANT EXECUTE ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean) TO authenticated;