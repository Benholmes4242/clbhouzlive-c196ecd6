
-- VERIFICATION DATA CLEANUP: Wipe all testing data

-- 1. Delete business verification data
DELETE FROM business_verification_reviews;
DELETE FROM business_verification_requests;

-- 2. Delete golfer verification data  
DELETE FROM golfer_verification_invites;
DELETE FROM golfer_verification_requests;

-- 3. Delete verification audit logs
DELETE FROM verification_audit_log;

-- 4. Delete verification notifications
DELETE FROM notifications WHERE type LIKE '%verification%';

-- 5. Reset business_accounts verification flags
UPDATE business_accounts SET 
  is_verified = false,
  verified_at = NULL,
  verified_by = NULL,
  verification_cooldown_until = NULL,
  last_verification_action = NULL;

-- 6. Reset user_profiles golfer verification flags
UPDATE user_profiles SET 
  is_verified_golfer = false,
  golfer_verified_at = NULL,
  golfer_verified_by = NULL
WHERE is_verified_golfer = true 
   OR golfer_verified_at IS NOT NULL;

-- 7. Reset user_profiles business verification flags (legacy fields)
UPDATE user_profiles SET
  is_business_verified = false,
  is_verified_business = false,
  verification_status = NULL,
  verification_notes = NULL,
  verification_requested_at = NULL,
  verification_reviewed_at = NULL,
  verification_reviewed_by = NULL,
  verified_business_at = NULL,
  verified_business_notes = NULL
WHERE is_business_verified = true 
   OR is_verified_business = true
   OR verification_status IS NOT NULL;
