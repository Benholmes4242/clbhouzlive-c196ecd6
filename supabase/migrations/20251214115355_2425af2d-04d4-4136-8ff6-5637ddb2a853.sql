-- Fix invite_golfer_to_verification to allow re-invite for revoked/removed users
CREATE OR REPLACE FUNCTION public.invite_golfer_to_verification(_user_id uuid, _note text DEFAULT NULL::text)
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
    -- Update existing request to invited status
    UPDATE public.golfer_verification_requests
    SET 
      status = 'invited',
      invited_by = auth.uid(),
      admin_note = _note,
      approval_count = 0,
      reviewed_at = NULL,
      requested_at = NULL,
      updated_at = now()
    WHERE id = _request_id;
  ELSE
    -- Create a new invitation
    INSERT INTO public.golfer_verification_requests (
      user_id,
      invited_by,
      status,
      admin_note
    )
    VALUES (_user_id, auth.uid(), 'invited', _note)
    RETURNING id INTO _request_id;
  END IF;

  -- Create notification for the user
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
    'You''re eligible for verification',
    'We believe your profile may qualify for golfer verification. You can request verification to help prevent impersonation.',
    jsonb_build_object('request_id', _request_id)
  );

  RETURN _request_id;
END;
$function$;

-- Fix reinvite_golfer_verification_request to also allow removed (revoked) status
CREATE OR REPLACE FUNCTION public.reinvite_golfer_verification_request(p_request_id uuid, p_admin_id uuid, p_note text DEFAULT NULL::text)
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

  -- Update the same row to invited status
  UPDATE golfer_verification_requests
  SET 
    status = 'invited',
    invited_by = p_admin_id,
    updated_at = now(),
    admin_note = COALESCE(p_note, admin_note),
    approval_count = 0,
    reviewed_at = NULL,
    requested_at = NULL
  WHERE id = p_request_id;

  -- Insert notification for the user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_user_id,
    'golfer_verification_invite',
    'You''re invited to get verified',
    'Accept to submit your request for review.',
    jsonb_build_object('request_id', p_request_id)
  );

  RETURN jsonb_build_object('status', 'reinvited', 'request_id', p_request_id);
END;
$function$;