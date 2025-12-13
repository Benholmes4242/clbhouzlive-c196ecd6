-- Fix: Add 'business_verification_revoked' to notifications type constraint
-- and harden the revoke RPC to not fail if notification insert fails

-- 1) Drop existing constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2) Recreate with revoked type included
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'like', 'comment', 'follow', 'mention',
  'friend_request', 'friend_accepted',
  'game_invite', 'game_update',
  'achievement',
  'business_verification_submitted',
  'business_verification_requested',
  'business_verification_approved',
  'business_verification_rejected',
  'business_verification_revoked',
  'personal_verification_submitted',
  'personal_verification_requested',
  'personal_verification_approved',
  'personal_verification_rejected'
));

-- 3) Update the revoke function to use correct type and handle notification errors gracefully
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

  -- Send notification to business owner (wrapped in exception handler)
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      bm.user_profile_id,
      'business_verification_revoked',
      'Business verification removed',
      'Your business verification has been removed.',
      jsonb_build_object(
        'business_id', p_business_id, 
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