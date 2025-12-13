-- Fix verification_audit_log_action_check constraint to include all valid actions
-- Currently only allows: 'requested', 'approved', 'rejected', 'revoked'
-- Need to add: 'submitted', 'more_proof_requested', 'force_approved'

-- 1) Drop the old constraint
ALTER TABLE public.verification_audit_log
DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;

-- 2) Recreate with all valid action types
ALTER TABLE public.verification_audit_log
ADD CONSTRAINT verification_audit_log_action_check
CHECK (action IN (
  -- Core actions
  'requested',
  'submitted',
  'approved',
  'rejected',
  'revoked',
  'removed',
  -- Special actions
  'more_proof_requested',
  'force_approved',
  'domain_check_requested',
  -- Golfer-specific
  'invited',
  'declined',
  'reinvited'
));