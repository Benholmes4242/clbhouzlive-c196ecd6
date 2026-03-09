import React from 'react';
import { cn } from '@/lib/utils';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  getNotificationBadgeIcon,
} from './rowHelpers';

export const SystemRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const { type, title, message } = notification;
  const actorName = getActorDisplayName(notification);
  const showOrange = isSessionNew || notification.is_unread;
  const statusIcon = getNotificationBadgeIcon(type);

  let text: string;
  switch (type) {
    case 'system':
    case 'app_update':
      text = title || 'New update available';
      break;
    case 'achievement':
    case 'achievement_unlocked':
      text = 'earned a new achievement';
      break;
    default:
      text = title || message || 'New notification';
  }

  return (
    <FlatRow
      notification={notification}
      onClick={onClick}
      onOpenActionsSheet={onOpenActionsSheet}
      avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
      title={
        <>
          <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
          <span className="font-normal text-muted-foreground">{text}</span>
        </>
      }
      meta={notification.time_ago}
      isSessionNew={isSessionNew}
    />
  );
};
