-- Allow 'needs_more_info' status on business_verification_requests.
-- The request-info admin action (request_info_business_verification RPC) sets this
-- status; the original CHECK constraint omitted it, causing a 500. Already applied
-- live via SQL editor; this migration captures it in version control.

ALTER TABLE public.business_verification_requests
  DROP CONSTRAINT IF EXISTS business_verification_requests_status_check;

ALTER TABLE public.business_verification_requests
  ADD CONSTRAINT business_verification_requests_status_check
  CHECK (status IN ('pending','approved','rejected','cancelled','needs_more_info'));