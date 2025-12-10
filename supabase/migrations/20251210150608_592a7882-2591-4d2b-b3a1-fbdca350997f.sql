-- Drop the old restrictive constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add expanded constraint with all notification types used by the app
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  -- Social / person-to-person
  'follow',
  'friend_request',
  'friend_request_sent',
  'friend_accepted',
  'friend_declined',
  'friend_cancelled',
  'mention',
  'mention_post',
  'tag',
  'like',
  'like_post',
  'comment',
  'comment_post',
  -- Messages
  'message',
  'message_received',
  'dm',
  -- Clubs & Courses
  'club_invite',
  'club_follow',
  'club_event',
  'club_announcement',
  'club_update',
  'course_review',
  'course_like',
  'course_follow',
  'course_update',
  'event',
  -- Achievements
  'achievement',
  'achievement_unlocked',
  'milestone_reached',
  'new_post',
  -- System
  'system',
  'app_update',
  'tip'
]::text[]));