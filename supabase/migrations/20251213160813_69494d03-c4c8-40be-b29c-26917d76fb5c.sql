-- Standardize notification types: add business_verification_removed and business_verification_more_proof_requested

-- 1) Drop existing constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2) Recreate with standardized types (removed instead of revoked, plus more_proof_requested)
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'like', 'comment', 'follow', 'mention',
  'friend_request', 'friend_accepted',
  'game_invite', 'game_update',
  'achievement',
  -- Business verification (standardized)
  'business_verification_submitted',
  'business_verification_approved',
  'business_verification_rejected',
  'business_verification_removed',
  'business_verification_more_proof_requested',
  -- Legacy support
  'business_verification_revoked',
  'business_verification_requested',
  -- Personal verification
  'personal_verification_submitted',
  'personal_verification_requested',
  'personal_verification_approved',
  'personal_verification_rejected'
));

-- 3) Update revoke function to use business_verification_removed (canonical) with correct copy
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
  -- Get business details
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

  -- Log to audit with neutral copy
  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES (
    'business', 
    p_business_id, 
    'revoked', 
    p_admin_id, 
    'Business verification removed by admin.',
    jsonb_build_object(
      'admin_reason', p_reason,
      'cooldown_bypassed', v_is_system_account OR p_bypass_cooldown,
      'is_system_account', v_is_system_account,
      'admin_override', p_bypass_cooldown
    )
  );

  -- Send notification with canonical type and locked copy
  BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      bm.user_profile_id,
      'business_verification_removed',
      'Verification status changed',
      'Your business verification has been removed.',
      jsonb_build_object(
        'business_id', p_business_id, 
        'business_name', v_business_name,
        'business_logo_url', v_business_logo_url,
        'action', 'removed',
        'reason', p_reason
      )
    FROM business_members bm
    WHERE bm.business_id = p_business_id AND bm.role = 'owner';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notification insert failed: %', SQLERRM;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_business_verification(uuid, uuid, text, boolean) TO authenticated;