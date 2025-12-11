-- 1) Add verification status columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_status text 
  CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected')) 
  DEFAULT 'unverified';

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS verification_notes text;

-- 2) Create audit table for verification history
CREATE TABLE IF NOT EXISTS public.business_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'reset')),
  actor_user_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.business_verification_events ENABLE ROW LEVEL SECURITY;

-- Admin can read all verification events
CREATE POLICY "Admins can view verification events"
ON public.business_verification_events
FOR SELECT
USING (public.is_admin());

-- Admin can insert verification events
CREATE POLICY "Admins can insert verification events"
ON public.business_verification_events
FOR INSERT
WITH CHECK (public.is_admin());

-- Users can view their own verification events
CREATE POLICY "Users can view own verification events"
ON public.business_verification_events
FOR SELECT
USING (business_profile_id = auth.uid());

-- 3) Create admin email notifications queue table
CREATE TABLE IF NOT EXISTS public.admin_email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error text
);

-- Enable RLS (only edge functions with service role can access)
ALTER TABLE public.admin_email_notifications ENABLE ROW LEVEL SECURITY;

-- 4) RPC: request_business_verification (called by business owner)
CREATE OR REPLACE FUNCTION public.request_business_verification(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_profile record;
BEGIN
  -- Get the current auth user
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Load profile
  SELECT * INTO v_profile
  FROM public.user_profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Only allow owner to request verification on their own profile
  IF v_profile.id <> v_auth_user_id THEN
    RAISE EXCEPTION 'You can only request verification for your own profile';
  END IF;

  -- Only allow for business-type profiles
  IF v_profile.profile_type <> 'business' AND v_profile.business_name IS NULL THEN
    RAISE EXCEPTION 'Profile is not a business profile';
  END IF;

  -- Update status -> pending_review
  UPDATE public.user_profiles
  SET
    verification_status = 'pending_review',
    verification_requested_at = now()
  WHERE id = p_profile_id;

  -- Write to audit table
  INSERT INTO public.business_verification_events (business_profile_id, action, actor_user_id)
  VALUES (p_profile_id, 'requested', v_auth_user_id);

  -- Insert into admin notification queue
  INSERT INTO public.admin_email_notifications (type, payload)
  VALUES (
    'business_verification_requested',
    jsonb_build_object(
      'profile_id', v_profile.id,
      'business_name', v_profile.business_name,
      'business_category', v_profile.business_category,
      'business_location', v_profile.business_location,
      'business_website', v_profile.business_website,
      'business_contact_email', v_profile.business_contact_email,
      'verification_requested_at', now()
    )
  );
END;
$$;

-- 5) RPC: update_business_verification_status (admin-only)
CREATE OR REPLACE FUNCTION public.update_business_verification_status(
  p_profile_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Gate to admins only
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized - admin access required';
  END IF;

  IF p_status NOT IN ('verified', 'rejected', 'unverified') THEN
    RAISE EXCEPTION 'Invalid verification status';
  END IF;

  UPDATE public.user_profiles
  SET
    verification_status = p_status,
    verification_reviewed_at = now(),
    verification_reviewed_by = v_auth_user_id,
    verification_notes = p_notes,
    is_business_verified = CASE WHEN p_status = 'verified' THEN true ELSE false END
  WHERE id = p_profile_id;

  INSERT INTO public.business_verification_events (business_profile_id, action, actor_user_id, reason)
  VALUES (
    p_profile_id,
    CASE
      WHEN p_status = 'verified' THEN 'approved'
      WHEN p_status = 'rejected' THEN 'rejected'
      ELSE 'reset'
    END,
    v_auth_user_id,
    p_notes
  );
END;
$$;