-- Add cooldown fields to business_accounts
ALTER TABLE business_accounts 
ADD COLUMN IF NOT EXISTS verification_cooldown_until timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_verification_action text DEFAULT NULL;

-- Create verification audit log table
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('business', 'person')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'revoked')),
  performed_by uuid,
  reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_entity 
ON verification_audit_log(entity_type, entity_id, created_at DESC);

-- Enable RLS
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can view verification audit log"
ON verification_audit_log FOR SELECT
USING (is_admin());

CREATE POLICY "System can insert verification audit log"
ON verification_audit_log FOR INSERT
WITH CHECK (true);

-- Update the revoke_business_verification function with cooldowns and audit log
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
  _cooldown_days int := 7;
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
  
  -- Revoke verification on business with cooldown
  UPDATE business_accounts
  SET 
    is_verified = false,
    verified_at = NULL,
    verified_by = NULL,
    last_verification_action = 'revoked',
    verification_cooldown_until = now() + (_cooldown_days || ' days')::interval
  WHERE id = _business_id;
  
  -- Archive/update any existing verification requests
  UPDATE business_verification_requests
  SET 
    status = 'revoked',
    admin_note = COALESCE(_reason, 'Verification revoked by admin'),
    reviewed_at = now(),
    reviewed_by = _admin_id
  WHERE business_id = _business_id AND status = 'approved';
  
  -- Log the action in verification_audit_log
  INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES (
    'business',
    _business_id,
    'revoked',
    _admin_id,
    _reason,
    jsonb_build_object('business_name', _business_name, 'cooldown_days', _cooldown_days)
  );
  
  -- Log in business_activity_log
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
        'reason', _reason,
        'cooldown_until', now() + (_cooldown_days || ' days')::interval
      )
    );
  END IF;
  
  RETURN jsonb_build_object('success', true, 'business_name', _business_name);
END;
$$;

-- Update submit_business_verification_review to log audit and set cooldown on rejection
CREATE OR REPLACE FUNCTION public.submit_business_verification_review(
  _request_id uuid,
  _decision text,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reviewer_id uuid;
  _request record;
  _new_approval_count int;
  _business_name text;
  _owner_id uuid;
  _rejection_cooldown_days int := 14;
BEGIN
  _reviewer_id := auth.uid();
  
  -- Check admin permission
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  -- Get request details
  SELECT * INTO _request
  FROM business_verification_requests
  WHERE id = _request_id AND status = 'pending';
  
  IF _request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Check if reviewer already reviewed this request
  IF EXISTS (
    SELECT 1 FROM business_verification_reviews
    WHERE request_id = _request_id AND reviewer_id = _reviewer_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already reviewed this request');
  END IF;
  
  -- Get business name
  SELECT name INTO _business_name
  FROM business_accounts
  WHERE id = _request.business_id;
  
  -- Get business owner
  SELECT user_profile_id INTO _owner_id
  FROM business_members
  WHERE business_id = _request.business_id AND role = 'owner'
  LIMIT 1;
  
  -- Insert the review
  INSERT INTO business_verification_reviews (request_id, reviewer_id, decision, note)
  VALUES (_request_id, _reviewer_id, _decision, _note);
  
  -- Handle decision
  IF _decision = 'rejected' THEN
    -- Immediate rejection
    UPDATE business_verification_requests
    SET 
      status = 'rejected',
      admin_note = _note,
      reviewed_at = now(),
      reviewed_by = _reviewer_id
    WHERE id = _request_id;
    
    -- Set cooldown on business
    UPDATE business_accounts
    SET 
      last_verification_action = 'rejected',
      verification_cooldown_until = now() + (_rejection_cooldown_days || ' days')::interval
    WHERE id = _request.business_id;
    
    -- Log to audit
    INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
    VALUES (
      'business',
      _request.business_id,
      'rejected',
      _reviewer_id,
      _note,
      jsonb_build_object('business_name', _business_name, 'cooldown_days', _rejection_cooldown_days)
    );
    
    -- Notify owner
    IF _owner_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, message, data)
      VALUES (
        _owner_id,
        'business_verification_rejected',
        'Your verification request was rejected.',
        jsonb_build_object(
          'business_id', _request.business_id,
          'entity_type', 'business',
          'entity_id', _request.business_id,
          'entity_name', _business_name,
          'reason', _note,
          'cooldown_until', now() + (_rejection_cooldown_days || ' days')::interval
        )
      );
    END IF;
    
    RETURN jsonb_build_object('success', true, 'status', 'rejected');
    
  ELSIF _decision = 'approved' THEN
    -- Increment approval count
    _new_approval_count := _request.approval_count + 1;
    
    UPDATE business_verification_requests
    SET approval_count = _new_approval_count
    WHERE id = _request_id;
    
    -- Check if we have enough approvals
    IF _new_approval_count >= _request.required_approvals THEN
      -- Mark as approved
      UPDATE business_verification_requests
      SET 
        status = 'approved',
        reviewed_at = now(),
        reviewed_by = _reviewer_id
      WHERE id = _request_id;
      
      -- Verify the business
      UPDATE business_accounts
      SET 
        is_verified = true,
        verified_at = now(),
        verified_by = _reviewer_id,
        last_verification_action = 'approved',
        verification_cooldown_until = NULL
      WHERE id = _request.business_id;
      
      -- Log to audit
      INSERT INTO verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
      VALUES (
        'business',
        _request.business_id,
        'approved',
        _reviewer_id,
        NULL,
        jsonb_build_object('business_name', _business_name, 'approval_count', _new_approval_count)
      );
      
      -- Notify owner
      IF _owner_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, data)
        VALUES (
          _owner_id,
          'business_verification_approved',
          'Your business is now verified!',
          jsonb_build_object(
            'business_id', _request.business_id,
            'entity_type', 'business',
            'entity_id', _request.business_id,
            'entity_name', _business_name
          )
        );
      END IF;
      
      RETURN jsonb_build_object('success', true, 'status', 'approved', 'approvals', _new_approval_count, 'required', _request.required_approvals);
    ELSE
      RETURN jsonb_build_object('success', true, 'status', 'pending', 'approvals', _new_approval_count, 'required', _request.required_approvals);
    END IF;
  END IF;
  
  RETURN jsonb_build_object('success', false, 'error', 'Invalid decision');
END;
$$;