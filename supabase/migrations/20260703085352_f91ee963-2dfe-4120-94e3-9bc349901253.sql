ALTER TABLE public.business_verification_requests
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_role text;