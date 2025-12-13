-- Add bypass metadata columns to golfer_verification_requests
ALTER TABLE public.golfer_verification_requests
ADD COLUMN IF NOT EXISTS second_approval_bypassed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS second_approval_bypassed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS second_approval_bypassed_at timestamptz,
ADD COLUMN IF NOT EXISTS second_approval_bypass_note text;

-- Also add golfer_verification_bypassed_second_approval to the audit log constraint
ALTER TABLE public.verification_audit_log DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;

ALTER TABLE public.verification_audit_log
ADD CONSTRAINT verification_audit_log_action_check
CHECK (action IN (
  'requested',
  'submitted',
  'approved',
  'rejected',
  'revoked',
  'removed',
  'more_proof_requested',
  'force_approved',
  'domain_check_requested',
  'invited',
  'declined',
  'reinvited',
  'golfer_verification_bypassed_second_approval'
));