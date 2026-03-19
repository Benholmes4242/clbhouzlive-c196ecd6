import React from 'react';
import { cn } from '@/lib/utils';
import { FollowBackButton } from '../FollowBackButton';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  getNotificationBadgeIcon,
} from './rowHelpers';

function renderNotificationText(notification: any): string | React.ReactNode {
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
    case 'new_post':
      return 'shared a new post';
    case 'club_update':
    case 'course_update':
      return title || 'posted an update';
    default:
      return title || message || 'New notification';
  }
}

export const SocialRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  currentUserId,
  isSessionNew,
}) => {
  const { type } = notification;
  const actorName = getActorDisplayName(notification);
  const showOrange = isSessionNew || notification.is_unread;
  const statusIcon = getNotificationBadgeIcon(type);

  const showFollowBack =
    type === 'follow' &&
    notification.actor_type === 'user' &&
    notification.actor_id &&
    notification.actor_id !== currentUserId;

  return (
    <FlatRow
      notification={notification}
      onClick={onClick}
      onOpenActionsSheet={onOpenActionsSheet}
      avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
      title={
        <>
          <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
          <span className="font-normal text-muted-foreground">{renderNotificationText(notification)}</span>
          {(notification.type === 'tag' || 
            notification.type === 'mention' || 
            notification.type === 'mention_post' || 
            notification.type === 'comment_mention') && 
            notification.data?.post_id && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(249,115,22,0.85)',
                letterSpacing: 0.1,
              }}
            >
              View post →
            </span>
          )}
        </>
      }
      meta={notification.time_ago}
      actions={
        showFollowBack ? (
          <FollowBackButton
            actorId={notification.actor_id!}
            actorDisplayName={actorName}
            isMock={notification.is_mock}
          />
        ) : undefined
      }
      isSessionNew={isSessionNew}
    />
  );
};
