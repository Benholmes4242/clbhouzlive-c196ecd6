import React from 'react';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { NotificationCard, getNotificationButtonClass } from '@/components/ui/NotificationCard';
import {
  Heart, MessageCircle, UserPlus, Users, Mail, Trophy, MapPin,
  CheckCircle2, Clock, Ban, Building2, XCircle, Bell, Calendar,
  Map as MapIcon, Flag, Star,
} from 'lucide-react';

// Re-export for convenience
export { getNotificationButtonClass };

const CLBHOUZ_LOGOMARK_URL = '/assets/logomark-orange.png';

// Shared base pill class
export const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-9 text-xs font-medium transition-colors gap-1.5 active:scale-[0.93]";

// Email-as-username detection — broken pattern like "dsblair710gmailcom"
const EMAIL_DOMAIN_PATTERN = /^(.+?)(gmail|yahoo|outlook|hotmail|icloud)(com|net|org)$/i;

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

export function isPrivateActor(notification: ActivityNotification): boolean {
  // True only when we positively know the actor is private (not just missing).
  return notification.actor_is_public === false;
}

export function isIncompleteProfile(notification: ActivityNotification): boolean {
  const name = notification.actor_display_name;
  if (!name) return false;
  return EMAIL_DOMAIN_PATTERN.test(name);
}

export function getActorDisplayName(notification: ActivityNotification): string {
  if (isBusinessEntityNotification(notification.type)) {
    const businessName = notification.data?.business_name || notification.data?.entity_name;
    if (businessName) return businessName;
  }
  if (notification.type === 'system' || notification.type === 'app_update') {
    return 'clbhouz Team';
  }

  const name = notification.actor_display_name;

  // Privacy resolution — only for follow notifications (friend requests must always reveal)
  if (notification.type === 'follow' && isPrivateActor(notification)) {
    return 'A private golfer';
  }

  // Email-as-username display rule
  if (name && isIncompleteProfile(notification)) {
    const match = name.match(EMAIL_DOMAIN_PATTERN);
    if (match) return `Golfer · ${match[1]}`;
  }

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

export function getNotificationBadgeIcon(type: string): React.ReactElement {
  const p = { size: 11, strokeWidth: 2.5, color: '#FFFFFF' };

  switch (type) {
    case 'like':
      return <Heart {...p} fill="#FFFFFF" />;
    case 'comment':
    case 'comment_reply':
    case 'mention':
    case 'tag':
    case 'top_ten_comment':
    case 'top_ten_reply':
    case 'top_ten_mention':
      return <MessageCircle {...p} />;
    case 'follow':
      return <UserPlus {...p} />;
    case 'friend_request':
    case 'friend_accept':
    case 'friend_accepted':
    case 'friend_request_sent':
    case 'friend_declined':
    case 'friend_cancelled':
      return <Users {...p} />;
    case 'message':
    case 'dm':
      return <Mail {...p} />;
    case 'achievement':
    case 'achievement_unlocked':
    case 'milestone_reached':
      return <Trophy {...p} />;
    case 'club_update':
    case 'course_update':
      return <MapPin {...p} />;
    case 'business_verification_approved':
    case 'golfer_verification_approved':
      return <CheckCircle2 {...p} />;
    case 'business_verification_submitted':
    case 'golfer_verification_submitted':
    case 'golfer_verification_invite':
    case 'business_verification_more_proof_requested':
      return <Clock {...p} />;
    case 'business_verification_rejected':
    case 'golfer_verification_rejected':
    case 'business_verification_removed':
    case 'golfer_verification_removed':
    case 'business_verification_revoked':
      return <Ban {...p} />;
    case 'business_member_added':
    case 'business_access_approved':
    case 'business_access_request':
      return <Building2 {...p} />;
    case 'business_access_declined':
    case 'game_request_declined':
    case 'trip_request_declined':
    case 'game_cancelled':
    case 'trip_cancelled':
      return <XCircle {...p} />;
    case 'game_request':
    case 'trip_request':
    case 'friend_course_review':
    case 'course_review':
      return <Flag {...p} />;
    case 'business_course_review':
      return <Star {...p} fill="#FFFFFF" />;
    case 'review_response':
      return <MessageCircle {...p} />;
    case 'game_request_accepted':
    case 'trip_request_accepted':
    case 'game_completed':
    case 'rsvp_update':
      return <CheckCircle2 {...p} />;
    case 'game_reminder_24h':
    case 'game_reminder_2h':
      return <Bell {...p} />;
    case 'game_updated':
      return <Calendar {...p} />;
    case 'trip_invite':
    case 'trip_created':
    case 'trip_game_added':
    case 'trip_reminder':
      return <MapIcon {...p} />;
    default:
      return <Bell {...p} />;
  }
}

export function getBadgeColor(type: string): string {
  if (type === 'friend_accept' || type === 'friend_accepted') return '#16A34A';
  if (type === 'friend_request' || type === 'follow') return '#F7931E';
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') return '#F7931E';
  if (type === 'like') return '#EF4444';
  if (
    type === 'business_verification_rejected' ||
    type === 'golfer_verification_rejected' ||
    type === 'business_verification_removed' ||
    type === 'golfer_verification_removed' ||
    type === 'business_verification_revoked' ||
    type === 'business_access_declined' ||
    type === 'game_request_declined' ||
    type === 'trip_request_declined' ||
    type === 'game_cancelled' ||
    type === 'trip_cancelled'
  ) return '#DC2626';
  if (
    type === 'business_verification_approved' ||
    type === 'golfer_verification_approved' ||
    type === 'game_request_accepted' ||
    type === 'trip_request_accepted' ||
    type === 'game_completed' ||
    type === 'rsvp_update'
  ) return '#16A34A';
  return '#1E293B';
}

// Avatar with status badge component
interface AvatarWithBadgeProps {
  notification: ActivityNotification;
  badgeIcon: React.ReactNode;
}

export const AvatarWithBadge: React.FC<AvatarWithBadgeProps> = ({ notification, badgeIcon }) => {
  const avatarUrl = getActorAvatarUrl(notification);
  const displayName = getActorDisplayName(notification);
  const badgeColor = getBadgeColor(notification.type);

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
      <span
        className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full ring-2 ring-white shadow-sm flex items-center justify-center"
        style={{ background: badgeColor }}
      >
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
