-- Add invite_reason column for user-facing reason on golfer verification
ALTER TABLE public.golfer_verification_requests
ADD COLUMN IF NOT EXISTS invite_reason text;

-- Update invite_golfer_to_verification to include reason in notification data
CREATE OR REPLACE FUNCTION public.invite_golfer_to_verification(_user_id uuid, _note text DEFAULT NULL::text, _invite_reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _request_id uuid;
  _existing_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if already has an ACTIVE request (pending, invited, submitted)
  SELECT status INTO _existing_status
  FROM public.golfer_verification_requests 
  WHERE user_id = _user_id
    AND status IN ('pending', 'invited', 'submitted');
  
  IF FOUND THEN
    RAISE EXCEPTION 'User already has an active verification request';
  END IF;

  -- Check if already verified
  SELECT status INTO _existing_status
  FROM public.golfer_verification_requests 
  WHERE user_id = _user_id
    AND status = 'approved';
  
  IF FOUND THEN
    RAISE EXCEPTION 'User is already verified';
  END IF;

  -- Check if there's an existing inactive request (removed, rejected, declined)
  -- If so, update it instead of inserting
  SELECT id INTO _request_id
  FROM public.golfer_verification_requests 
  WHERE user_id = _user_id
    AND status IN ('removed', 'rejected', 'declined');
  
  IF FOUND THEN
    -- Update existing request to invited status (fresh lifecycle)
    UPDATE public.golfer_verification_requests
    SET 
      status = 'invited',
      invited_by = auth.uid(),
      admin_note = _note,
      invite_reason = _invite_reason,
      approval_count = 0,
      reviewed_at = NULL,
      requested_at = NULL,
      accepted_at = NULL,
      declined_at = NULL,
      second_approval_bypassed = false,
      second_approval_bypassed_by = NULL,
      second_approval_bypassed_at = NULL,
      second_approval_bypass_note = NULL,
      updated_at = now()
    WHERE id = _request_id;
  ELSE
    -- Create a new invitation
    INSERT INTO public.golfer_verification_requests (
      user_id,
      invited_by,
      status,
      admin_note,
      invite_reason
    )
    VALUES (_user_id, auth.uid(), 'invited', _note, _invite_reason)
    RETURNING id INTO _request_id;
  END IF;

  -- Create notification for the user with reason in data
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  VALUES (
    _user_id,
    'golfer_verification_invite',
    'Clbhouz would like to verify your account',
    CASE 
      WHEN _invite_reason IS NOT NULL THEN 'Reason: ' || _invite_reason
      ELSE 'We believe your profile may qualify for golfer verification.'
    END,
    jsonb_build_object(
      'request_id', _request_id,
      'status', 'invited',
      'reason', _invite_reason,
      'support_entrypoint', 'golfer_verification_invite'
    )
  );

  RETURN _request_id;
END;
$function$;

-- Update reinvite_golfer_verification_request to include reason and reset all fields
CREATE OR REPLACE FUNCTION public.reinvite_golfer_verification_request(p_request_id uuid, p_admin_id uuid, p_note text DEFAULT NULL::text, p_invite_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request golfer_verification_requests%ROWTYPE;
  v_user_id uuid;
BEGIN
  -- Get the request
  SELECT * INTO v_request
  FROM golfer_verification_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  v_user_id := v_request.user_id;

  -- Allow re-invite if status is declined, rejected, OR removed (revoked)
  IF v_request.status NOT IN ('declined', 'rejected', 'removed') THEN
    -- If already invited or pending, return gracefully
    IF v_request.status IN ('invited', 'pending') THEN
      RETURN jsonb_build_object('status', 'already_active', 'message', 'This golfer already has an active invite or pending request.');
    END IF;
    -- If approved, don't allow re-invite
    IF v_request.status = 'approved' THEN
      RETURN jsonb_build_object('status', 'already_verified', 'message', 'This golfer is already verified.');
    END IF;
    RAISE EXCEPTION 'Cannot re-invite a request with status: %', v_request.status;
  END IF;

  -- Update the same row to invited status (fresh lifecycle - reset all fields)
  UPDATE golfer_verification_requests
  SET 
    status = 'invited',
    invited_by = p_admin_id,
    updated_at = now(),
    admin_note = COALESCE(p_note, admin_note),
    invite_reason = COALESCE(p_invite_reason, invite_reason),
    approval_count = 0,
    reviewed_at = NULL,
    requested_at = NULL,
    accepted_at = NULL,
    declined_at = NULL,
    second_approval_bypassed = false,
    second_approval_bypassed_by = NULL,
    second_approval_bypassed_at = NULL,
    second_approval_bypass_note = NULL
  WHERE id = p_request_id;

  -- Delete any existing approval reviews for this request (fresh start)
  DELETE FROM golfer_verification_reviews WHERE request_id = p_request_id;

  -- Insert notification for the user with reason
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_user_id,
    'golfer_verification_invite',
    'Clbhouz would like to verify your account',
    CASE 
      WHEN p_invite_reason IS NOT NULL THEN 'Reason: ' || p_invite_reason
      ELSE 'We believe your profile may qualify for golfer verification.'
    END,
    jsonb_build_object(
      'request_id', p_request_id,
      'status', 'invited',
      'reason', p_invite_reason,
      'support_entrypoint', 'golfer_verification_invite'
    )
  );

  RETURN jsonb_build_object('status', 'reinvited', 'request_id', p_request_id);
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.invite_golfer_to_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reinvite_golfer_verification_request(uuid, uuid, text, text) TO authenticated;