-- Drop and recreate the check constraint with the correct trigger type
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (
  type IN (
    'like',
    'comment',
    'follow',
    'mention',
    'friend_request',
    'friend_accepted',
    'game_invite',
    'game_update',
    'achievement',
    'business_verification_submitted',
    'business_verification_requested',
    'business_verification_approved',
    'business_verification_rejected',
    'personal_verification_submitted',
    'personal_verification_requested',
    'personal_verification_approved',
    'personal_verification_rejected'
  )
);