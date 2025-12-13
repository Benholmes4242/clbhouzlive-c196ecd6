-- Phase 2: Two-Reviewer Verification Model

-- 1. Create business_verification_reviews table
CREATE TABLE IF NOT EXISTS public.business_verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.business_verification_requests(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_bvr_reviews_request
ON public.business_verification_reviews (request_id);

-- 2. Add approval tracking columns to business_verification_requests
ALTER TABLE public.business_verification_requests
ADD COLUMN IF NOT EXISTS approval_count int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_approvals int NOT NULL DEFAULT 2;

-- 3. Enable RLS on business_verification_reviews
ALTER TABLE public.business_verification_reviews ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for business_verification_reviews
CREATE POLICY bvr_select_admin
ON public.business_verification_reviews
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY bvr_insert_admin
ON public.business_verification_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  AND reviewer_id = auth.uid()
);

-- 5. Create the submit_business_verification_review RPC
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
  _current_approvals int;
  _required int;
  _business_id uuid;
  _current_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Check request exists and is pending
  SELECT status, business_id, approval_count, required_approvals
  INTO _current_status, _business_id, _current_approvals, _required
  FROM public.business_verification_requests
  WHERE id = _request_id;

  IF _current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF _current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request is no longer pending');
  END IF;

  -- Prevent duplicate review
  IF EXISTS (
    SELECT 1 FROM public.business_verification_reviews
    WHERE request_id = _request_id
      AND reviewer_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already reviewed this request');
  END IF;

  -- Insert review
  INSERT INTO public.business_verification_reviews (
    request_id,
    reviewer_id,
    decision,
    note
  )
  VALUES (_request_id, auth.uid(), _decision, _note);

  -- Log the review action
  INSERT INTO public.business_activity_log (business_id, type, actor_user_id, metadata)
  VALUES (
    _business_id,
    CASE WHEN _decision = 'approved' THEN 'verification_review_approved' ELSE 'verification_review_rejected' END,
    auth.uid(),
    jsonb_build_object('request_id', _request_id, 'note', _note)
  );

  -- Immediate rejection logic
  IF _decision = 'rejected' THEN
    UPDATE public.business_verification_requests
    SET status = 'rejected',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        admin_note = _note
    WHERE id = _request_id;

    -- Log final rejection
    INSERT INTO public.business_activity_log (business_id, type, actor_user_id, metadata)
    VALUES (_business_id, 'verification_rejected', auth.uid(), jsonb_build_object('request_id', _request_id));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;

  -- Approval path
  _current_approvals := _current_approvals + 1;

  UPDATE public.business_verification_requests
  SET approval_count = _current_approvals
  WHERE id = _request_id;

  -- If threshold reached → verify business
  IF _current_approvals >= _required THEN
    UPDATE public.business_verification_requests
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = _request_id;

    UPDATE public.business_accounts
    SET is_verified = true,
        verified_at = now(),
        verified_by = auth.uid()
    WHERE id = _business_id;

    -- Log final approval
    INSERT INTO public.business_activity_log (business_id, type, actor_user_id, metadata)
    VALUES (_business_id, 'verification_fully_approved', auth.uid(), jsonb_build_object('request_id', _request_id));

    RETURN jsonb_build_object('success', true, 'status', 'approved', 'approvals', _current_approvals);
  END IF;

  RETURN jsonb_build_object('success', true, 'status', 'pending', 'approvals', _current_approvals, 'required', _required);
END;
$$;