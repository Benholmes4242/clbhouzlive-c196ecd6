-- VERIFICATION DATA CLEANUP - Full wipe for fresh start
-- This removes all test verification data as if it never existed

-- 1. Delete business verification reviews (approvals)
DELETE FROM public.business_verification_reviews;

-- 2. Delete business domain verifications
DELETE FROM public.business_domain_verifications;

-- 3. Delete business verification requests
DELETE FROM public.business_verification_requests;

-- 4. Delete business verification events (audit log)
DELETE FROM public.business_verification_events;

-- 5. Delete golfer verification reviews (approvals)
DELETE FROM public.golfer_verification_reviews;

-- 6. Delete golfer verification requests
DELETE FROM public.golfer_verification_requests;

-- 7. Delete golfer verification invites (if separate table exists)
DELETE FROM public.golfer_verification_invites;

-- 8. Delete golfer candidate overrides
DELETE FROM public.golfer_candidate_overrides;

-- 9. Reset business verified flags
UPDATE public.business_accounts
SET 
  is_verified = false,
  verified_at = NULL,
  verified_by = NULL,
  verification_cooldown_until = NULL,
  last_verification_action = NULL
WHERE is_verified = true OR verified_at IS NOT NULL;

-- 10. Reset user profile verified golfer flags
UPDATE public.user_profiles
SET 
  is_verified_golfer = false
WHERE is_verified_golfer = true;

-- 11. Delete all verification-related notifications
DELETE FROM public.notifications
WHERE type LIKE '%verification%';

-- 12. Confirm by selecting counts (these should all be 0 after cleanup)