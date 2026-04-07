import React from 'react';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { NotificationCard, getNotificationButtonClass } from '@/components/ui/NotificationCard';

// Re-export for convenience
export { getNotificationButtonClass };

const CLBHOUZ_LOGOMARK_URL = '/assets/logomark-orange.png';

// Shared base pill class
export const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-9 text-xs font-medium transition-colors gap-1.5 active:scale-[0.93]";

export function isClbhouzSystemNotification(type: string): boolean {
  return type === 'system' || type === 'app_update' || type.startsWith('golfer_verification_');
}

export function isBusinessEntityNotification(type: string): boolean {
  return (
    type.startsWith('business_verification_') ||
    type === 'business_member_added' ||
    type === 'business_access_request' ||
    type === 'business_access_approved' ||
    type === 'business_access_declined'
  );
}

export function getActorDisplayName(notification: ActivityNotification): string {
  if (isBusinessEntityNotification(notification.type)) {
    const businessName = notification.data?.business_name || notification.data?.entity_name;
    if (businessName) return businessName;
  }
  if (notification.type === 'system' || notification.type === 'app_update') {
    return 'Clbhouz Team';
  }
  const name = notification.actor_display_name;
  if (name && name !== 'Someone' && name !== 'Unknown User') return name;
  if (isBusinessEntityNotification(notification.type)) {
    return notification.data?.business_name || 'Business';
  }
  return 'Someone';
}

export function getActorAvatarUrl(notification: ActivityNotification): string | null {
  if (isBusinessEntityNotification(notification.type)) {
    const businessAvatar = notification.data?.business_avatar_url ||
      notification.data?.business_logo_url ||
      notification.data?.entity_avatar_url;
    if (businessAvatar) return businessAvatar;
    return null;
  }
  if (isClbhouzSystemNotification(notification.type)) {
    return CLBHOUZ_LOGOMARK_URL;
  }
  return notification.actor_avatar_url;
}

export function getNotificationBadgeIcon(type: string): string {
  switch (type) {
    case 'like':                              return '🧡';
    case 'comment':
    case 'comment_reply':                     return '💬';
    case 'mention':
    case 'tag':                               return '💬';
    case 'follow':                            return '➕';
    case 'friend_request':
    case 'friend_accept':
    case 'friend_accepted':                   return '👥';
    case 'friend_request_sent':
    case 'friend_declined':
    case 'friend_cancelled':                  return '👥';
    case 'message':
    case 'dm':                                return '✉️';
    case 'achievement':                       return '🏆';
    case 'club_update':
    case 'course_update':                     return '📍';
    case 'business_verification_approved':
    case 'golfer_verification_approved':      return '✅';
    case 'business_verification_submitted':
    case 'golfer_verification_submitted':
    case 'golfer_verification_invite':
    case 'business_verification_more_proof_requested': return '⏳';
    case 'business_verification_rejected':
    case 'golfer_verification_rejected':
    case 'business_verification_removed':
    case 'golfer_verification_removed':
    case 'business_verification_revoked':     return '🚫';
    case 'business_member_added':
    case 'business_access_approved':
    case 'business_access_request':           return '🏢';
    case 'business_access_declined':          return '❌';
    case 'game_request':
    case 'trip_request':                      return '⛳';
    case 'game_request_accepted':
    case 'trip_request_accepted':
    case 'game_completed':
    case 'rsvp_update':                       return '✅';
    case 'game_request_declined':
    case 'trip_request_declined':
    case 'game_cancelled':
    case 'trip_cancelled':                    return '❌';
    case 'game_reminder_24h':
    case 'game_reminder_2h':                  return '🔔';
    case 'game_updated':                      return '📅';
    case 'trip_invite':
    case 'trip_created':
    case 'trip_game_added':
    case 'trip_reminder':                     return '🗺️';
    case 'friend_course_review':
    case 'course_review':                     return '⛳';
    case 'business_course_review':            return '⭐';
    case 'review_response':
    case 'top_ten_comment':
    case 'top_ten_reply':                     return '💬';
    case 'top_ten_mention':                   return '💬';
    default:                                  return '🔔';
  }
}

// Avatar with status badge component
interface AvatarWithBadgeProps {
  notification: ActivityNotification;
  badgeIcon: React.ReactNode;
}

export const AvatarWithBadge: React.FC<AvatarWithBadgeProps> = ({ notification, badgeIcon }) => {
  const avatarUrl = getActorAvatarUrl(notification);
  const displayName = getActorDisplayName(notification);
  const isSystemNotification = isClbhouzSystemNotification(notification.type);

  return (
    <div className="relative shrink-0" style={{ width: 48, height: 50 }}>
      <div style={{ border: '0.5px solid #D1D5DB', borderRadius: '34%', padding: 0, lineHeight: 0 }}>
        <SquircleAvatar
          src={avatarUrl}
          alt={displayName || 'User'}
          size={48}
          fallback={displayName?.charAt(0) || '?'}
          hideRing
        />
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background ring-2 ring-background shadow-sm flex items-center justify-center">
        {badgeIcon}
      </span>
    </div>
  );
};

// FlatRow wrapper using NotificationCard
interface FlatRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtext?: React.ReactNode;
  meta: string;
  actions?: React.ReactNode;
  isSessionNew?: boolean;
}

export const FlatRow: React.FC<FlatRowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  avatar,
  title,
  subtext,
  meta,
  actions,
  isSessionNew
}) => {
  const showOrange = isSessionNew || notification.is_unread;

  return (
    <NotificationCard
      avatar={avatar}
      title={title}
      subtext={subtext}
      actions={actions}
      timestamp={meta}
      isNew={showOrange}
      onClick={onClick}
      onMenuClick={onOpenActionsSheet}
    />
  );
};

// Shared props interface for all sub-row components
export interface RowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  currentUserId?: string;
  isSessionNew?: boolean;
}
