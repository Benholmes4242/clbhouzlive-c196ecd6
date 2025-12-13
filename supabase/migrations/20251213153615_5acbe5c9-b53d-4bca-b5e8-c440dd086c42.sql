-- Fix A: Update revoke_business_verification to include business name and logo in notification data
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

  -- Send notification to business owner with business name and logo
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      bm.user_profile_id,
      'business_verification_revoked',
      v_business_name,
      'Business verification removed',
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