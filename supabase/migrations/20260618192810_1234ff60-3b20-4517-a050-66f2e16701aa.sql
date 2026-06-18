ALTER TABLE public.verification_audit_log DROP CONSTRAINT IF EXISTS verification_audit_log_action_check;
ALTER TABLE public.verification_audit_log ADD CONSTRAINT verification_audit_log_action_check CHECK (
  action IN (
    'submitted', 'approved', 'rejected', 'removed', 'revoked', 'needs_more_info',
    'domain_check_requested', 'more_proof_requested', 'cooldown_bypassed',
    'golfer_invited', 'golfer_accepted', 'golfer_declined', 'golfer_approved',
    'golfer_rejected', 'golfer_removed', 'golfer_test_reset',
    'golfer_verification_bypassed_second_approval'
  )
);