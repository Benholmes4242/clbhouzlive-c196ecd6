import React from 'react';
import { cn } from '@/lib/utils';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  getNotificationBadgeIcon,
  getNotificationButtonClass,
} from './rowHelpers';

export const ReviewRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const { type, data } = notification;
  const actorName = getActorDisplayName(notification);
  const showOrange = isSessionNew || notification.is_unread;
  const statusIcon = getNotificationBadgeIcon(type);

  if (type === 'review_response') {
    const businessName = data?.business_name || 'A business';
    const courseName = data?.course_name || 'a course';
    return (
      <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
        avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
        title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{businessName}</span>{' '}<span className="font-normal text-muted-foreground">responded to your review of {courseName}</span></>}
        meta={notification.time_ago}
        actions={<button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={getNotificationButtonClass('primary')}>View response</button>}
        isSessionNew={isSessionNew}
      />
    );
  }

  // friend_course_review, course_review, business_course_review
  const courseName = data?.course_name;
  const rating = data?.rating;
  let reviewText: React.ReactNode = 'reviewed a course';
  if (courseName) {
    const truncatedName = courseName.length > 30 ? courseName.slice(0, 30) + '…' : courseName;
    if (rating != null) {
      reviewText = <>reviewed <span className="font-semibold text-foreground">{truncatedName}</span> and rated it <span className="font-semibold text-foreground">{rating}</span></>;
    } else {
      reviewText = <>reviewed <span className="font-semibold text-foreground">{truncatedName}</span></>;
    }
  }

  return (
    <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
      avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
      title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}<span className="font-normal text-muted-foreground">{reviewText}</span></>}
      meta={notification.time_ago}
      isSessionNew={isSessionNew}
      actions={
        data?.course_id ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={getNotificationButtonClass('primary')}
          >
            View review
          </button>
        ) : undefined
      }
    />
  );
};
