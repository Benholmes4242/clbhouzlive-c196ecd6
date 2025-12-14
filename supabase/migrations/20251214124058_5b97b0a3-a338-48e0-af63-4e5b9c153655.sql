-- Fix: reinvite_golfer_verification_request must delete old reviews to reset approval state
-- This ensures buttons are not disabled due to stale review rows

CREATE OR REPLACE FUNCTION public.reinvite_golfer_verification_request(
  p_request_id uuid, 
  p_admin_id uuid, 
  p_note text DEFAULT NULL::text, 
  p_invite_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request RECORD;
  v_user_id uuid;
  v_notification_id uuid;
  v_result jsonb;
BEGIN
  -- Get current request
  SELECT * INTO v_request FROM golfer_verification_requests WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Request not found');
  END IF;
  
  v_user_id := v_request.user_id;
  
  -- Check if already verified
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = v_user_id AND is_verified_golfer = true) THEN
    RETURN jsonb_build_object('status', 'already_verified', 'message', 'User is already verified');
  END IF;
  
  -- Only allow re-invite for declined, rejected, or removed statuses
  IF v_request.status NOT IN ('declined', 'rejected', 'removed') THEN
    RETURN jsonb_build_object('status', 'already_active', 'message', 'User already has an active invite or pending request');
  END IF;
  
  -- DELETE OLD REVIEWS - Critical fix for re-invite
  -- This ensures the approval counter and hasAlreadyReviewed check are reset
  DELETE FROM golfer_verification_reviews WHERE request_id = p_request_id;
  
  -- Reset the request to invited status with all lifecycle fields cleared
  UPDATE golfer_verification_requests
  SET
    status = 'invited',
    invited_by = p_admin_id,
    invite_reason = COALESCE(p_invite_reason, p_note, v_request.invite_reason),
    accepted_at = NULL,
    declined_at = NULL,
    requested_at = NULL,
    reviewed_at = NULL,
    admin_note = NULL,
    note = NULL,
    evidence_url = NULL,
    approval_count = 0,
    updated_at = now(),
    created_at = now()  -- Reset created_at so it appears as fresh
  WHERE id = p_request_id;
  
  -- Create notification for the user
  INSERT INTO notifications (
    id,
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    'golfer_verification_invite',
    'You''re invited to get verified',
    'Clbhouz would like to verify your account',
    jsonb_build_object(
      'request_id', p_request_id,
      'status', 'invited',
      'entity_type', 'person',
      'reason', COALESCE(p_invite_reason, p_note),
      'entity_name', (SELECT display_name FROM user_profiles WHERE id = v_user_id),
      'entity_avatar_url', (SELECT profile_photo_url FROM user_profiles WHERE id = v_user_id)
    ),
    false,
    now()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN jsonb_build_object(
    'status', 'reinvited',
    'request_id', p_request_id,
    'notification_id', v_notification_id
  );
END;
$function$;

-- Also fix the current broken state for Benjamin by deleting stale reviews
DELETE FROM golfer_verification_reviews 
WHERE request_id = '76f00667-1036-407b-bdd3-3fbcf1ec101d';

-- Reset approval_count to 0 for this request
UPDATE golfer_verification_requests 
SET approval_count = 0 
WHERE id = '76f00667-1036-407b-bdd3-3fbcf1ec101d';