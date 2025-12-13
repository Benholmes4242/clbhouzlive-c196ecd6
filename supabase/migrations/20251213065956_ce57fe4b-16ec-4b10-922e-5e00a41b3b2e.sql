
-- Golfer Verification Requests table
CREATE TABLE IF NOT EXISTS public.golfer_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz,
  reviewed_at timestamptz,
  note text,
  admin_note text,
  approval_count int NOT NULL DEFAULT 0,
  required_approvals int NOT NULL DEFAULT 2,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Golfer Verification Reviews table (for two-reviewer model)
CREATE TABLE IF NOT EXISTS public.golfer_verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.golfer_verification_requests(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, reviewer_id)
);

-- Add verified golfer flags to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_verified_golfer boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS golfer_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS golfer_verified_by uuid;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gvr_user_id ON public.golfer_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gvr_status ON public.golfer_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_gvr_reviews_request ON public.golfer_verification_reviews(request_id);

-- Enable RLS
ALTER TABLE public.golfer_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfer_verification_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for golfer_verification_requests
CREATE POLICY gvr_select_admin ON public.golfer_verification_requests
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY gvr_select_own ON public.golfer_verification_requests
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY gvr_insert_admin ON public.golfer_verification_requests
FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND invited_by = auth.uid());

CREATE POLICY gvr_update_admin ON public.golfer_verification_requests
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY gvr_update_own ON public.golfer_verification_requests
FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'invited')
WITH CHECK (user_id = auth.uid());

CREATE POLICY gvr_delete_admin ON public.golfer_verification_requests
FOR DELETE TO authenticated USING (public.is_admin());

-- RLS Policies for golfer_verification_reviews
CREATE POLICY gvrv_select_admin ON public.golfer_verification_reviews
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY gvrv_insert_admin ON public.golfer_verification_reviews
FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND reviewer_id = auth.uid());

-- RPC to invite a golfer to verification (admin only)
CREATE OR REPLACE FUNCTION public.invite_golfer_to_verification(
  _user_id uuid,
  _note text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if already has a request
  IF EXISTS (SELECT 1 FROM public.golfer_verification_requests WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already has a verification request';
  END IF;

  -- Create the invitation
  INSERT INTO public.golfer_verification_requests (
    user_id,
    invited_by,
    status,
    admin_note
  )
  VALUES (_user_id, auth.uid(), 'invited', _note)
  RETURNING id INTO _request_id;

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
$$;

-- RPC for user to submit their verification request (after being invited)
CREATE OR REPLACE FUNCTION public.submit_golfer_verification_request(
  _request_id uuid,
  _evidence_url text DEFAULT null,
  _note text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the request belongs to the user and is in 'invited' status
  IF NOT EXISTS (
    SELECT 1 FROM public.golfer_verification_requests
    WHERE id = _request_id
      AND user_id = auth.uid()
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Invalid or already submitted request';
  END IF;

  -- Update the request to pending
  UPDATE public.golfer_verification_requests
  SET status = 'pending',
      requested_at = now(),
      evidence_url = _evidence_url,
      note = _note,
      updated_at = now()
  WHERE id = _request_id;
END;
$$;

-- RPC to submit a golfer verification review (two-reviewer model)
CREATE OR REPLACE FUNCTION public.submit_golfer_verification_review(
  _request_id uuid,
  _decision text,
  _note text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_approvals int;
  _required int;
  _user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Prevent duplicate review
  IF EXISTS (
    SELECT 1 FROM public.golfer_verification_reviews
    WHERE request_id = _request_id
      AND reviewer_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You have already reviewed this request';
  END IF;

  -- Insert review
  INSERT INTO public.golfer_verification_reviews (
    request_id,
    reviewer_id,
    decision,
    note
  )
  VALUES (_request_id, auth.uid(), _decision, _note);

  -- Log the review action
  SELECT user_id INTO _user_id
  FROM public.golfer_verification_requests
  WHERE id = _request_id;

  -- Immediate rejection logic
  IF _decision = 'rejected' THEN
    UPDATE public.golfer_verification_requests
    SET status = 'rejected',
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _request_id;

    -- Create rejection notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    )
    VALUES (
      _user_id,
      'golfer_verification_rejected',
      'Verification request not approved',
      'Your golfer verification request was reviewed and not approved at this time.',
      jsonb_build_object('request_id', _request_id)
    );

    RETURN;
  END IF;

  -- Approval path
  SELECT approval_count, required_approvals
  INTO _current_approvals, _required
  FROM public.golfer_verification_requests
  WHERE id = _request_id;

  _current_approvals := _current_approvals + 1;

  UPDATE public.golfer_verification_requests
  SET approval_count = _current_approvals,
      updated_at = now()
  WHERE id = _request_id;

  -- If threshold reached → verify golfer
  IF _current_approvals >= _required THEN
    UPDATE public.golfer_verification_requests
    SET status = 'approved',
        reviewed_at = now(),
        updated_at = now()
    WHERE id = _request_id;

    UPDATE public.user_profiles
    SET is_verified_golfer = true,
        golfer_verified_at = now(),
        golfer_verified_by = auth.uid()
    WHERE id = _user_id;

    -- Create approval notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    )
    VALUES (
      _user_id,
      'golfer_verification_approved',
      'You''re now a verified golfer',
      'Your profile has been verified. A verified badge will now appear next to your name.',
      jsonb_build_object('request_id', _request_id)
    );
  END IF;
END;
$$;
