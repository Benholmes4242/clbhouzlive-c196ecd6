-- Add declined_at and accepted_at columns
ALTER TABLE public.golfer_verification_requests
ADD COLUMN IF NOT EXISTS declined_at timestamptz;

ALTER TABLE public.golfer_verification_requests
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

-- Drop old function to change return type
DROP FUNCTION IF EXISTS public.decline_golfer_verification_invite(uuid, text);

-- Create the decline RPC as idempotent (returns jsonb)
CREATE OR REPLACE FUNCTION public.decline_golfer_verification_invite(
  p_request_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  -- Fetch the request
  SELECT id, user_id, status
  INTO v_request
  FROM public.golfer_verification_requests
  WHERE id = p_request_id;

  -- Check if request exists and belongs to caller
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- If already declined, return success (idempotent)
  IF v_request.status = 'declined' THEN
    RETURN jsonb_build_object(
      'status', 'declined',
      'already_declined', true
    );
  END IF;

  -- Only allow declining from 'invited' status
  IF v_request.status != 'invited' THEN
    RETURN jsonb_build_object(
      'status', v_request.status,
      'error', 'Cannot decline - request is not in invited status'
    );
  END IF;

  -- Update the request to declined
  UPDATE public.golfer_verification_requests
  SET status = 'declined',
      declined_at = now(),
      admin_note = COALESCE(p_note, 'User declined the invite'),
      updated_at = now()
  WHERE id = p_request_id;

  -- Also update the notification data to reflect the declined status
  UPDATE public.notifications
  SET data = data || jsonb_build_object('status', 'declined')
  WHERE type = 'golfer_verification_invite'
    AND recipient_id = v_request.user_id
    AND (data->>'request_id')::uuid = p_request_id;

  RETURN jsonb_build_object(
    'status', 'declined',
    'already_declined', false
  );
END;
$$;

-- Also fix the accept RPC to set accepted_at
CREATE OR REPLACE FUNCTION public.accept_golfer_verification_invite(
  p_request_id uuid,
  p_evidence_url text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  -- Fetch the request
  SELECT id, user_id, status
  INTO v_request
  FROM public.golfer_verification_requests
  WHERE id = p_request_id;

  -- Check if request exists
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Check ownership
  IF v_request.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Only allow accepting from 'invited' status
  IF v_request.status != 'invited' THEN
    RAISE EXCEPTION 'Request is not in invited status';
  END IF;

  -- Update to pending (submitted for review)
  UPDATE public.golfer_verification_requests
  SET status = 'pending',
      accepted_at = now(),
      evidence_url = COALESCE(p_evidence_url, evidence_url),
      note = COALESCE(p_note, note),
      requested_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Update the notification data to reflect accepted status
  UPDATE public.notifications
  SET data = data || jsonb_build_object('status', 'accepted')
  WHERE type = 'golfer_verification_invite'
    AND recipient_id = v_request.user_id
    AND (data->>'request_id')::uuid = p_request_id;
END;
$$;