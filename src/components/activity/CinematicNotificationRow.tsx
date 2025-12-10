import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { Heart, MessageCircle, UserPlus, Users, Trophy } from 'lucide-react';
import { FollowBackButton } from './FollowBackButton';

interface CinematicNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  currentUserId?: string;
}

function getNotificationIcon(type: string) {
  const iconClass = "h-3.5 w-3.5";
  switch (type) {
    case 'like':
      return <Heart className={cn(iconClass, "text-muted-foreground fill-muted-foreground")} />;
    case 'comment':
    case 'mention':
    case 'tag':
      return <MessageCircle className={cn(iconClass, "text-muted-foreground")} />;
    case 'follow':
      return <Users className={cn(iconClass, "text-muted-foreground")} />;
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus className={cn(iconClass, "text-muted-foreground")} />;
    case 'achievement':
      return <Trophy className={cn(iconClass, "text-muted-foreground")} />;
    default:
      return null;
  }
}

function renderNotificationText(notification: ActivityNotification): string {
  const { type, message } = notification;
  
  switch (type) {
    case 'like':
      return 'liked your post';
    case 'comment':
      return message ? `commented: "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"` : 'commented on your post';
    case 'mention':
      return 'mentioned you';
    case 'follow':
      return 'started following you';
    case 'friend_request':
      return 'sent you a friend request';
    case 'friend_accepted':
      return 'accepted your friend request';
    default:
      return notification.title || '';
  }
}

// Flat notification row - no background image, no gradient
export const MediaHighlightRow: React.FC<CinematicNotificationRowProps & { mediaUrl: string }> = ({
  notification,
  onClick,
  currentUserId,
}) => {
  const actorName = notification.actor_display_name || 'Unknown User';
  const isUnread = notification.is_unread;
  const icon = getNotificationIcon(notification.type);

  const showFollowBack = 
    notification.type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  return (
    <motion.article
      onClick={onClick}
      className={cn(
        "relative overflow-hidden cursor-pointer min-h-[72px] border-b border-border/30",
        isUnread ? "bg-[hsl(var(--accent))]/5" : "bg-transparent"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(var(--echo-accent))]" />
      )}

      {/* Content */}
      <div className={cn("flex items-center px-4 py-3 gap-3", isUnread && "pl-8")}>
        {/* Avatar with badge */}
        <div className="relative shrink-0" style={{ width: 48, height: 50 }}>
          <SquircleAvatar
            src={notification.actor_avatar_url}
            alt={notification.actor_display_name || 'User'}
            size={48}
            fallback={notification.actor_display_name?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
          />
          {icon && (
            <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center shadow-sm">
              {icon}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-foreground">
            <span className={cn(isUnread ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
            <span className="font-normal text-muted-foreground">{renderNotificationText(notification)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">{notification.time_ago}</p>
        </div>

        {/* CTA */}
        {showFollowBack && (
          <FollowBackButton
            actorId={notification.actor_id!}
            actorDisplayName={actorName}
            isMock={notification.is_mock}
          />
        )}
      </div>
    </motion.article>
  );
};

// Flat course notification row - no background image, no gradient
export const CourseHighlightRow: React.FC<CinematicNotificationRowProps & { courseImageUrl: string }> = ({
  notification,
  onClick,
}) => {
  const actorName = notification.actor_display_name || 'Unknown User';
  const isUnread = notification.is_unread;
  const courseName = notification.data?.course_name || 'Golf Course';
  const icon = getNotificationIcon(notification.type);

  return (
    <motion.article
      onClick={onClick}
      className={cn(
        "relative overflow-hidden cursor-pointer min-h-[72px] border-b border-border/30",
        isUnread ? "bg-[hsl(var(--accent))]/5" : "bg-transparent"
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(var(--echo-accent))]" />
      )}

      {/* Content */}
      <div className={cn("flex items-center px-4 py-3 gap-3", isUnread && "pl-8")}>
        {/* Avatar with badge */}
        <div className="relative shrink-0" style={{ width: 48, height: 50 }}>
          <SquircleAvatar
            src={notification.actor_avatar_url}
            alt={notification.actor_display_name || 'User'}
            size={48}
            fallback={notification.actor_display_name?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
          />
          {icon && (
            <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center shadow-sm">
              {icon}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-foreground">
            <span className={cn(isUnread ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
            <span className="font-normal text-muted-foreground">{renderNotificationText(notification)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {courseName} · {notification.time_ago}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

// Default row - delegates to standard flat layout
export const DefaultCinematicRow: React.FC<CinematicNotificationRowProps> = () => {
  return null;
};
