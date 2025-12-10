import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { Heart, MessageCircle, UserPlus, Users, Trophy } from 'lucide-react';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import { TONE_GRADIENTS } from '@/lib/notificationTone';

interface CinematicNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  currentUserId?: string;
}

function getNotificationIcon(type: string) {
  const iconClass = "h-3.5 w-3.5";
  switch (type) {
    case 'like':
      return <Heart className={cn(iconClass, "text-white fill-white")} />;
    case 'comment':
    case 'mention':
    case 'tag':
      return <MessageCircle className={cn(iconClass, "text-white")} />;
    case 'follow':
      return <Users className={cn(iconClass, "text-white")} />;
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus className={cn(iconClass, "text-white")} />;
    case 'achievement':
      return <Trophy className={cn(iconClass, "text-white")} />;
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

// Media Highlight Row - Edge-to-edge photo with vignette
export const MediaHighlightRow: React.FC<CinematicNotificationRowProps & { mediaUrl: string }> = ({
  notification,
  onClick,
  mediaUrl,
  currentUserId,
}) => {
  const actorName = notification.actor_display_name || 'Unknown User';
  const isUnread = notification.is_unread;
  const icon = getNotificationIcon(notification.type);
  const toneGradient = TONE_GRADIENTS[notification.tone] || TONE_GRADIENTS.system;

  const showFollowBack = 
    notification.type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  return (
    <motion.article
      onClick={onClick}
      className="relative overflow-hidden rounded-sq-md cursor-pointer min-h-[86px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background image - full cover */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${mediaUrl})` }}
      />

      {/* Tone-based vignette overlay */}
      <div className={cn("absolute inset-0 z-[1]", toneGradient)} />

      {/* Unread indicator bar */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(var(--echo-accent))] z-[2]" />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center px-4 py-3 gap-3 h-full">
        {/* Avatar with badge */}
        <div className="relative shrink-0" style={{ width: 52, height: 54 }}>
          <SquircleAvatar
            src={notification.actor_avatar_url}
            alt={notification.actor_display_name || 'User'}
            size={52}
            fallback={notification.actor_display_name?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
          />
          {icon && (
            <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-black/40 bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              {icon}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-white">
            <span className={cn(isUnread ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
            <span className="font-normal opacity-90">{renderNotificationText(notification)}</span>
          </p>
          <p className="mt-1 text-xs text-white/70">{notification.time_ago}</p>
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

// Course Highlight Row - Course background with emerald tint
export const CourseHighlightRow: React.FC<CinematicNotificationRowProps & { courseImageUrl: string }> = ({
  notification,
  onClick,
  courseImageUrl,
  currentUserId,
}) => {
  const actorName = notification.actor_display_name || 'Unknown User';
  const isUnread = notification.is_unread;
  const courseName = notification.data?.course_name || 'Golf Course';
  const icon = getNotificationIcon(notification.type);
  const toneGradient = TONE_GRADIENTS[notification.tone] || TONE_GRADIENTS.clubs;

  return (
    <motion.article
      onClick={onClick}
      className="relative overflow-hidden rounded-sq-md cursor-pointer min-h-[86px]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Course image - full cover */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${courseImageUrl})` }}
      />

      {/* Tone-based vignette */}
      <div className={cn("absolute inset-0 z-[1]", toneGradient)} />

      {/* Unread indicator bar */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(var(--echo-accent))] z-[2]" />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center px-4 py-3 gap-3 h-full">
        {/* Avatar with badge */}
        <div className="relative shrink-0" style={{ width: 52, height: 54 }}>
          <SquircleAvatar
            src={notification.actor_avatar_url}
            alt={notification.actor_display_name || 'User'}
            size={52}
            fallback={notification.actor_display_name?.charAt(0) || '?'}
            ringColor={getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
          />
          {icon && (
            <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-black/40 bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              {icon}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-white">
            <span className={cn(isUnread ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
            <span className="font-normal opacity-90">{renderNotificationText(notification)}</span>
          </p>
          <p className="mt-1 text-xs text-white/70">
            {courseName} · {notification.time_ago}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

// Default cinematic row with subtle animation
export const DefaultCinematicRow: React.FC<CinematicNotificationRowProps> = ({
  notification,
  onClick,
  currentUserId,
}) => {
  // This component delegates to the standard ActivityNotificationRow
  // but wraps it with motion for consistent animations
  return null; // We'll use the standard row for non-cinematic
};
