import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, Bell, Mail, Trophy, Building2 } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onMarkRead?: (id: string) => void;
  onHide?: (id: string) => void;
  currentUserId?: string;
}

function getNotificationIcon(type: string) {
  const iconClass = "h-3 w-3";
  switch (type) {
    case 'like':
      return <Heart className={cn(iconClass, "text-rose-500")} />;
    case 'comment':
    case 'mention':
    case 'tag':
      return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
    case 'follow':
      return <UserPlus className={cn(iconClass, "text-emerald-500")} />;
    case 'friend_request':
    case 'friend_accepted':
      return <Users className={cn(iconClass, "text-amber-500")} />;
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
      return <Building2 className={cn(iconClass, "text-slate-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
  }
}

function renderNotificationText(notification: ActivityNotification): string {
  const { type, message, title } = notification;
  
  switch (type) {
    case 'like':
      return 'liked your post';
    case 'comment':
      return message ? `commented: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"` : 'commented on your post';
    case 'mention':
      return 'mentioned you in a post';
    case 'tag':
      return 'tagged you in a post';
    case 'follow':
      return 'started following you';
    case 'friend_request':
      return 'sent you a friend request';
    case 'friend_request_sent':
      return ''; // Will be handled specially in the component
    case 'friend_accepted':
      return 'accepted your friend request';
    case 'friend_declined':
      return ''; // Will be handled specially in the component
    case 'friend_cancelled':
      return ''; // Will be handled specially in the component
    case 'message':
    case 'dm':
      return message ? `sent you a message: "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"` : 'sent you a message';
    case 'new_post':
      return 'shared a new post';
    case 'achievement':
      return 'earned a new achievement';
    case 'club_update':
    case 'course_update':
      return title || 'posted an update';
    case 'system':
    case 'app_update':
      return title || 'New update available';
    default:
      return title || message || 'New notification';
  }
}

export const ActivityNotificationRow: React.FC<ActivityNotificationRowProps> = ({ 
  notification, 
  onClick,
  onMarkRead,
  onHide,
  currentUserId
}) => {
  const isUnread = notification.is_unread;
  
  // Determine if we should show "Follow back" button (only for follow, not friend_request)
  const showFollowBack = 
    notification.type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  // Determine if we should show friend request buttons (receiver, pending)
  const showFriendRequestButtons = 
    notification.type === 'friend_request' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  // Determine various friend state pills
  const showFriendsPill = notification.type === 'friend_accepted';
  const showPendingPill = notification.type === 'friend_request_sent';
  const showDeclinedPill = notification.type === 'friend_declined';
  const showCancelledPill = notification.type === 'friend_cancelled';

  // Get request ID for friend request actions (from data or notification id)
  const friendRequestId = notification.data?.request_id || notification.id;
  const targetUserName = notification.data?.target_user_name || notification.actor_display_name;

  // Has any CTA (friend request, follow back, or status pills)
  const hasCTA = showFriendRequestButtons || showFollowBack || showFriendsPill || showPendingPill || showDeclinedPill || showCancelledPill;
  const statusIcon = getNotificationIcon(notification.type);

  // Build custom text for sender-side notifications
  const getCustomText = () => {
    if (notification.type === 'friend_request_sent') {
      return `Friend request sent to ${targetUserName}`;
    }
    if (notification.type === 'friend_cancelled') {
      return `You cancelled your friend request to ${targetUserName}`;
    }
    if (notification.type === 'friend_declined') {
      return `Friend request to ${targetUserName} was declined`;
    }
    return null;
  };
  
  const customText = getCustomText();

  // Shared base pill class for unified styling
  const basePillClass = "inline-flex items-center justify-center rounded-full border px-4 h-9 text-xs font-semibold transition-colors";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left transition-all duration-200 relative",
        "rounded-sq-md px-4 py-3 min-h-[86px] flex items-stretch",
        isUnread 
          ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/40" 
          : "bg-background/50 hover:bg-background/80"
      )}
    >
      <div className="flex w-full gap-3">
        {/* LEFT: Avatar with consistent status icon placement */}
        <div className="relative shrink-0">
          <SquircleAvatar
            src={notification.actor_avatar_url}
            alt={notification.actor_display_name || 'User'}
            size={44}
            fallback={notification.actor_display_name?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(0)}
          />
          {/* Status icon - always bottom-right on avatar, consistent position */}
          <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-card bg-background flex items-center justify-center">
            {statusIcon}
          </span>
        </div>

        {/* RIGHT: Content */}
        <div className="flex-1 min-w-0">
          {/* TOP ROW: text */}
          <p className={cn(
            "text-sm leading-snug",
            isUnread ? "text-foreground" : "text-foreground/90"
          )}>
            {customText ? (
              <span className={cn(isUnread ? "font-medium" : "font-normal", "text-foreground/90")}>
                {customText}
              </span>
            ) : (
              <>
                <span className={cn(isUnread ? "font-semibold" : "font-medium")}>
                  {notification.actor_display_name || 'Unknown User'}
                </span>{' '}
                <span className="font-normal text-muted-foreground">
                  {renderNotificationText(notification)}
                </span>
              </>
            )}
          </p>

          {/* MIDDLE: timestamp */}
          <p className="mt-1 text-xs text-muted-foreground">
            {notification.time_ago}
          </p>

          {/* BOTTOM ROW: CTAs - aligned to bottom-right */}
          {hasCTA && (
            <div className="mt-2 flex items-center justify-end gap-2">
              {showFriendRequestButtons && (
                <FriendRequestButtons
                  requestId={friendRequestId}
                  requesterId={notification.actor_id!}
                  requesterName={notification.actor_display_name}
                  isMock={notification.is_mock}
                />
              )}
              {showFollowBack && (
                <FollowBackButton
                  actorId={notification.actor_id!}
                  actorDisplayName={notification.actor_display_name}
                  isMock={notification.is_mock}
                />
              )}
              {showFriendsPill && (
                <span className={cn(basePillClass, "border-border bg-muted text-foreground/80 gap-1")}>
                  <Users className="h-3 w-3" />
                  Friends
                </span>
              )}
              {showPendingPill && (
                <span className={cn(basePillClass, "border-border bg-muted text-foreground/60 gap-1")}>
                  Pending
                </span>
              )}
              {showDeclinedPill && (
                <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500 gap-1")}>
                  Declined
                </span>
              )}
              {showCancelledPill && (
                <span className={cn(basePillClass, "border-border bg-muted text-foreground/60 gap-1")}>
                  Cancelled
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
