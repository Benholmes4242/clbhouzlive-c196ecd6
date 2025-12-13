-- P0 FIX: Add golfer verification notification types to constraints
-- Also add 'declined' status for golfer_verification_requests

-- 1. Update notifications_type_check constraint to include golfer verification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    -- Existing types
    'like'::text, 
    'comment'::text, 
    'follow'::text, 
    'mention'::text, 
    'friend_request'::text, 
    'friend_accepted'::text, 
    'game_invite'::text, 
    'game_update'::text, 
    'achievement'::text,
    -- Business verification types
    'business_verification_submitted'::text, 
    'business_verification_approved'::text, 
    'business_verification_rejected'::text, 
    'business_verification_removed'::text, 
    'business_verification_more_proof_requested'::text, 
    'business_verification_revoked'::text,
    'business_verification_requested'::text,
    -- Personal/legacy verification types
    'personal_verification_submitted'::text, 
    'personal_verification_requested'::text, 
    'personal_verification_approved'::text, 
    'personal_verification_rejected'::text,
    -- NEW: Golfer verification types (P0 fix)
    'golfer_verification_invite'::text,
    'golfer_verification_submitted'::text,
    'golfer_verification_approved'::text,
    'golfer_verification_rejected'::text,
    'golfer_verification_removed'::text
  ])
);

-- 2. Update golfer_verification_requests status constraint to include 'declined'
ALTER TABLE public.golfer_verification_requests DROP CONSTRAINT IF EXISTS golfer_verification_requests_status_check;

ALTER TABLE public.golfer_verification_requests ADD CONSTRAINT golfer_verification_requests_status_check CHECK (
  status = ANY (ARRAY[
    'invited'::text,
    'pending'::text, 
    'approved'::text, 
    'rejected'::text,
    'declined'::text,
    'revoked'::text
  ])
);

-- 3. Create RPC for user to accept an invite (moves status from 'invited' to 'pending')
CREATE OR REPLACE FUNCTION public.accept_golfer_verification_invite(
  p_request_id uuid,
  p_evidence_url text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the request belongs to the caller and is in 'invited' status
  IF NOT EXISTS (
    SELECT 1 FROM public.golfer_verification_requests
    WHERE id = p_request_id
      AND user_id = auth.uid()
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Invalid or already submitted request';
  END IF;

  -- Update the request to pending
  UPDATE public.golfer_verification_requests
  SET status = 'pending',
      requested_at = now(),
      evidence_url = COALESCE(p_evidence_url, evidence_url),
      note = COALESCE(p_note, note),
      updated_at = now()
  WHERE id = p_request_id;

  -- Insert notification for admins (optional audit trail)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    am.user_id,
    'golfer_verification_submitted',
    'Golfer verification request submitted',
    'A golfer has accepted their invite and submitted for verification.',
    jsonb_build_object('request_id', p_request_id, 'golfer_id', auth.uid())
  FROM public.admin_memberships am
  WHERE am.role IN ('admin', 'super_admin')
  LIMIT 3; -- Notify up to 3 admins
END;
$$;

-- 4. Create RPC for user to decline an invite
CREATE OR REPLACE FUNCTION public.decline_golfer_verification_invite(
  p_request_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the request belongs to the caller and is in 'invited' status
  IF NOT EXISTS (
    SELECT 1 FROM public.golfer_verification_requests
    WHERE id = p_request_id
      AND user_id = auth.uid()
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Invalid request or not in invited status';
  END IF;

  -- Update the request to declined
  UPDATE public.golfer_verification_requests
  SET status = 'declined',
      admin_note = COALESCE(p_note, 'User declined the invite'),
      updated_at = now()
  WHERE id = p_request_id;
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_golfer_verification_invite(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_golfer_verification_invite(uuid, text) TO authenticated;