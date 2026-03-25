import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, Bell, Mail, Trophy, Building2, X, ShieldOff, Clock, CalendarDays, MapPin, CheckCircle2, UserCheck, Star, AtSign } from 'lucide-react';
import { FiMapPin } from 'react-icons/fi';
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

export function getNotificationBadgeIcon(type: string) {
  const iconClass = "h-3 w-3";
  switch (type) {
    case 'like':
      return <Heart className={cn(iconClass, "text-[#F7931E]")} fill="currentColor" />;
    case 'comment':
    case 'comment_reply':
      return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
    case 'mention':
    case 'tag':
      return <MessageCircle className={cn(iconClass, "text-purple-500")} />;
    case 'follow':
      return <UserPlus className={cn(iconClass, "text-blue-500")} />;
    case 'friend_request':
    case 'friend_accept':
    case 'friend_accepted':
      return <Users className={cn(iconClass, "text-green-500")} />;
    case 'friend_request_sent':
    case 'friend_declined':
    case 'friend_cancelled':
      return <Users className={cn(iconClass, "text-muted-foreground")} />;
    case 'message':
    case 'dm':
      return <Mail className={cn(iconClass, "text-violet-500")} />;
    case 'achievement':
      return <Trophy className={cn(iconClass, "text-amber-500")} />;
    case 'club_update':
    case 'course_update':
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    case 'business_verification_approved':
      return <VerifiedBadge size="sm" />;
    case 'business_verification_submitted':
    case 'business_verification_more_proof_requested':
      return <Clock className={cn(iconClass, "text-amber-500")} />;
    case 'business_verification_rejected':
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    case 'business_verification_removed':
    case 'business_verification_revoked':
      return <ShieldOff className={cn(iconClass, "text-gray-500")} />;
    case 'business_member_added':
    case 'business_access_approved':
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    case 'business_access_request':
      return <UserPlus className={cn(iconClass, "text-gray-500")} />;
    case 'business_access_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'golfer_verification_approved':
      return <VerifiedBadge size="sm" />;
    case 'golfer_verification_invite':
    case 'golfer_verification_submitted':
      return <Clock className={cn(iconClass, "text-amber-500")} />;
    case 'golfer_verification_rejected':
    case 'golfer_verification_removed':
      return <ShieldOff className={cn(iconClass, "text-red-500")} />;
    case 'game_request':
      return <UserPlus className={cn(iconClass, "text-amber-500")} />;
    case 'game_request_accepted':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'game_request_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'game_cancelled':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'rsvp_update':
      return <UserCheck className={cn(iconClass, "text-emerald-500")} />;
    case 'game_reminder_24h':
    case 'game_reminder_2h':
      return <Bell className={cn(iconClass, "text-amber-500")} />;
    case 'game_updated':
      return <CalendarDays className={cn(iconClass, "text-blue-500")} />;
    case 'game_completed':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_request':
      return <UserPlus className={cn(iconClass, "text-amber-500")} />;
    case 'trip_request_accepted':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_request_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'trip_invite':
      return <MapPin className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_cancelled':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'trip_created':
    case 'trip_game_added':
    case 'trip_reminder':
      return <MapPin className={cn(iconClass, "text-violet-500")} />;
    case 'friend_course_review':
    case 'course_review':
      return <FiMapPin className={cn(iconClass, "text-emerald-500")} />;
    case 'business_course_review':
      return <Star className={cn(iconClass, "text-emerald-500")} fill="currentColor" />;
    case 'review_response':
      return <MessageCircle className={cn(iconClass, "text-[#334E3D]")} />;
    case 'top_ten_comment':
      return <MessageCircle className={cn(iconClass, "text-amber-500")} />;
    case 'top_ten_reply':
      return <MessageCircle className={cn(iconClass, "text-amber-500")} />;
    case 'top_ten_mention':
      return <AtSign className={cn(iconClass, "text-amber-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
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
