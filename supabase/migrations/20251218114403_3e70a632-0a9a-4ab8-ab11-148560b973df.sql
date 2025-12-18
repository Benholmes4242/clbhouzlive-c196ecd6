-- Add 'business_access_request' and 'business_access_approved' and 'business_access_declined' to notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'like'::text, 'comment'::text, 'follow'::text, 'mention'::text, 
    'friend_request'::text, 'friend_accept'::text, 
    'game_invite'::text, 'game_request'::text, 'game_reminder'::text, 'game_update'::text, 'game_message'::text, 
    'achievement'::text, 'badge'::text, 'challenge'::text, 'milestone'::text, 
    'business_verification_submitted'::text, 'business_verification_approved'::text, 
    'business_verification_rejected'::text, 'business_verification_removed'::text, 
    'business_verification_revoked'::text, 'business_verification_more_proof_requested'::text, 
    'business_verification_domain_check_requested'::text, 
    'golfer_verification_invite'::text, 'golfer_verification_approved'::text, 
    'golfer_verification_rejected'::text, 'golfer_verification_removed'::text, 
    'business_invite'::text, 'business_member_added'::text, 'business_member_removed'::text,
    'business_access_request'::text, 'business_access_approved'::text, 'business_access_declined'::text,
    'system'::text, 'announcement'::text, 'welcome'::text
  ])
);