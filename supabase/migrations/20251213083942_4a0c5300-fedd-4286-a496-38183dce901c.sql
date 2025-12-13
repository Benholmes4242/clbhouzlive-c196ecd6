-- Reset clbhouz business verification for testing
UPDATE business_accounts 
SET is_verified = false, verified_at = NULL, verified_by = NULL
WHERE id = '814a8367-d2af-4d38-8096-43f731a1b509';

-- Delete all verification requests for this business so they can start fresh
DELETE FROM business_verification_requests 
WHERE business_id = '814a8367-d2af-4d38-8096-43f731a1b509';

-- Create RPC function for admins to revoke verification
CREATE OR REPLACE FUNCTION public.revoke_business_verification(
  _business_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id uuid;
  _business_name text;
  _owner_id uuid;
BEGIN
  -- Get current admin user
  _admin_id := auth.uid();
  
  -- Check admin permission
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  -- Get business info
  SELECT name INTO _business_name
  FROM business_accounts
  WHERE id = _business_id;
  
  IF _business_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found');
  END IF;
  
  -- Get business owner for notification
  SELECT user_profile_id INTO _owner_id
  FROM business_members
  WHERE business_id = _business_id AND role = 'owner'
  LIMIT 1;
  
  -- Revoke verification on business
  UPDATE business_accounts
  SET 
    is_verified = false,
    verified_at = NULL,
    verified_by = NULL
  WHERE id = _business_id;
  
  -- Archive/update any existing verification requests
  UPDATE business_verification_requests
  SET 
    status = 'revoked',
    admin_note = COALESCE(_reason, 'Verification revoked by admin'),
    reviewed_at = now(),
    reviewed_by = _admin_id
  WHERE business_id = _business_id AND status = 'approved';
  
  -- Log the action in business_activity_log
  INSERT INTO business_activity_log (business_id, actor_user_id, type, metadata)
  VALUES (
    _business_id,
    _admin_id,
    'verification_revoked',
    jsonb_build_object('reason', _reason, 'revoked_by', _admin_id)
  );
  
  -- Send notification to business owner
  IF _owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, message, data)
    VALUES (
      _owner_id,
      'business_verification_revoked',
      'Your business verification has been removed.',
      jsonb_build_object(
        'business_id', _business_id,
        'entity_type', 'business',
        'entity_id', _business_id,
        'entity_name', _business_name,
        'reason', _reason
      )
    );
  END IF;
  
  RETURN jsonb_build_object('success', true, 'business_name', _business_name);
END;
$$;