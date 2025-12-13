-- Create the re-invite RPC for admin to re-invite declined/rejected golfers
-- This reuses the same request row instead of creating a new one

CREATE OR REPLACE FUNCTION public.reinvite_golfer_verification_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Only allow re-invite if status is declined or rejected
  IF v_request.status NOT IN ('declined', 'rejected') THEN
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
$$;

-- Grant execute to authenticated users (admin check should be done at app level or via RLS)
GRANT EXECUTE ON FUNCTION public.reinvite_golfer_verification_request(uuid, uuid, text) TO authenticated;