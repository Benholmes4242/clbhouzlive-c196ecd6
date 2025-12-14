-- Drop the existing check constraint
ALTER TABLE public.golfer_verification_requests
DROP CONSTRAINT IF EXISTS golfer_verification_requests_status_check;

-- Recreate it with the full allowed set including 'removed' and 'revoked'
ALTER TABLE public.golfer_verification_requests
ADD CONSTRAINT golfer_verification_requests_status_check
CHECK (status IN (
  'invited',
  'pending',
  'approved',
  'rejected',
  'declined',
  'removed',
  'revoked'
));