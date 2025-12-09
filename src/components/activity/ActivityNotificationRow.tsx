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
    case 'friend_accepted':
      return 'accepted your friend request';
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

  // Determine if we should show friend request buttons
  const showFriendRequestButtons = 
    notification.type === 'friend_request' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  // Get request ID for friend request actions (from data or notification id)
  const friendRequestId = notification.data?.request_id || notification.id;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex gap-3 p-3 text-left transition-all duration-200",
        "rounded-sq-md relative",
        isUnread 
          ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/40" 
          : "bg-background/50 hover:bg-background/80"
      )}
    >
      {/* Unread dot indicator - positioned inside card, top-left */}
      {isUnread && (
        <span 
          className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-orange-500 z-10" 
          aria-hidden 
        />
      )}

      {/* Avatar with type icon overlay + achievement ring */}
      <div className="relative flex-shrink-0">
        <SquircleAvatar
          src={notification.actor_avatar_url}
          alt={notification.actor_display_name || 'User'}
          size={44}
          fallback={notification.actor_display_name?.charAt(0) || '?'}
          ringColor={getRingColorForTotalPlayed(0)}
        />
        <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background border border-border/60 flex items-center justify-center shadow-sm">
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm leading-snug",
          isUnread ? "text-foreground" : "text-foreground/90"
        )}>
          <span className={cn(isUnread ? "font-semibold" : "font-medium")}>
            {notification.actor_display_name || 'Unknown User'}
          </span>{' '}
          <span className="text-muted-foreground font-normal">
            {renderNotificationText(notification)}
          </span>
        </p>

        {/* Friend request buttons - on second line, right-aligned */}
        {showFriendRequestButtons && (
          <div className="mt-2 flex items-center justify-end">
            <FriendRequestButtons
              requestId={friendRequestId}
              requesterId={notification.actor_id!}
              requesterName={notification.actor_display_name}
              isMock={notification.is_mock}
            />
          </div>
        )}

        {/* Time ago - simplified, no taxonomy */}
        <p className="mt-1 text-xs text-muted-foreground">
          {notification.time_ago}
        </p>
      </div>

      {/* Follow back button for follow notifications - stays inline */}
      {showFollowBack && (
        <div className="flex-shrink-0 self-center">
          <FollowBackButton
            actorId={notification.actor_id!}
            actorDisplayName={notification.actor_display_name}
            isMock={notification.is_mock}
          />
        </div>
      )}
    </button>
  );
};
