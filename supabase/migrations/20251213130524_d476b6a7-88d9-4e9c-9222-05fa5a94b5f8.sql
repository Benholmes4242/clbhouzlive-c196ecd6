-- Fix: Add 'revoked' to the status check constraint for business_verification_requests

-- Drop the existing constraint
ALTER TABLE public.business_verification_requests
DROP CONSTRAINT IF EXISTS business_verification_requests_status_check;

-- Recreate with 'revoked' included
ALTER TABLE public.business_verification_requests
ADD CONSTRAINT business_verification_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'));