import React from 'react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SocialRow } from './rows/SocialRow';
import { FriendRow } from './rows/FriendRow';
import { VerificationRow } from './rows/VerificationRow';
import { GameRow } from './rows/GameRow';
import { ReviewRow } from './rows/ReviewRow';
import { SystemRow } from './rows/SystemRow';
import { AdminInviteRow } from './rows/AdminInviteRow';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  currentUserId?: string;
  isSessionNew?: boolean;
}

const FRIEND_TYPES = new Set([
  'friend_request', 'friend_accept', 'friend_accepted',
  'friend_request_sent', 'friend_declined', 'friend_cancelled',
]);

const VERIFICATION_TYPES = new Set([
  'golfer_verification_invite', 'golfer_verification_submitted',
  'golfer_verification_approved', 'golfer_verification_rejected', 'golfer_verification_removed',
  'business_verification_submitted', 'business_verification_approved',
  'business_verification_rejected', 'business_verification_removed',
  'business_verification_revoked', 'business_verification_more_proof_requested',
  'business_member_added', 'business_access_request',
  'business_access_approved', 'business_access_declined',
]);

const GAME_TYPES = new Set([
  'game_request', 'game_request_accepted', 'game_request_declined',
  'game_cancelled', 'rsvp_update',
  'game_reminder_24h', 'game_reminder_2h', 'game_updated', 'game_completed',
  'trip_request', 'trip_request_accepted', 'trip_request_declined',
  'trip_invite', 'trip_cancelled', 'trip_created', 'trip_game_added', 'trip_reminder',
]);

const REVIEW_TYPES = new Set([
  'friend_course_review', 'course_review', 'business_course_review', 'review_response',
]);

const SYSTEM_TYPES = new Set(['system', 'app_update', 'achievement', 'achievement_unlocked']);

export const ActivityNotificationRow: React.FC<ActivityNotificationRowProps> = (props) => {
  const { type } = props.notification;

  if (type === 'admin_invite') return <AdminInviteRow {...props} />;
  if (FRIEND_TYPES.has(type)) return <FriendRow {...props} />;
  if (VERIFICATION_TYPES.has(type)) return <VerificationRow {...props} />;
  if (GAME_TYPES.has(type)) return <GameRow {...props} />;
  if (REVIEW_TYPES.has(type)) return <ReviewRow {...props} />;
  if (SYSTEM_TYPES.has(type)) return <SystemRow {...props} />;
  return <SocialRow {...props} />;
};
