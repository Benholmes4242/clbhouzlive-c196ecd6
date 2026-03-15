import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GAME_NOTIFICATION_COPY } from '@/lib/gameNotificationCopy';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  getNotificationBadgeIcon,
  getNotificationButtonClass,
  basePillClass,
} from './rowHelpers';

export const GameRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const { type, data } = notification;
  const actorName = getActorDisplayName(notification);
  const showOrange = isSessionNew || notification.is_unread;
  const statusIcon = getNotificationBadgeIcon(type);

  const viewGameBtn = (label = 'View game') => (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={getNotificationButtonClass('primary')}>
      {label}
    </button>
  );

  const viewTripBtn = (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={getNotificationButtonClass('primary')}>
      View trip
    </button>
  );

  switch (type) {
    case 'game_request': {
      const courseName = data?.course_name || 'Golf Course';
      const requestMessage = data?.request_message;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}<span className="font-normal text-muted-foreground">wants to join your game</span></>}
          subtext={requestMessage || courseName} meta={notification.time_ago}
          actions={viewGameBtn('View requests')} isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_request_accepted': {
      const courseName = data?.course_name || 'Golf Course';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.game_request_accepted.title}</span>}
          subtext={`Your request to join ${courseName} was accepted`} meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)]")}><CheckCircle2 className="h-3 w-3" />Accepted</span>
              {viewGameBtn()}
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_request_declined': {
      const courseName = data?.course_name || 'Golf Course';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.game_request_declined.title}</span>}
          subtext={`Your request to join ${courseName} was declined`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}><X className="h-3 w-3" />Declined</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_cancelled': {
      const courseName = data?.course_name || 'Golf Course';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.game_cancelled.title}</span>}
          subtext={`The game at ${courseName} has been cancelled`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}>Cancelled</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'rsvp_update': {
      const playerName = data?.player_name || actorName;
      const courseName = data?.course_name || 'Golf Course';
      const date = data?.date || '';
      const subcopy = [courseName, date].filter(Boolean).join(' · ');
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{playerName}</span>{' '}<span className="font-normal text-muted-foreground">is going</span></>}
          subtext={subcopy} meta={notification.time_ago} isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_reminder_24h':
    case 'game_reminder_2h': {
      const courseName = data?.course_name || 'Golf Course';
      const time = data?.time || '';
      const subcopy = [courseName, time].filter(Boolean).join(' · ');
      const copy = GAME_NOTIFICATION_COPY[type];
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{copy.title}</span>}
          subtext={subcopy} meta={notification.time_ago}
          actions={viewGameBtn()} isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_updated': {
      const courseName = data?.course_name || 'Golf Course';
      const newTime = data?.new_time;
      const subcopy = newTime ? `${courseName} · New tee time: ${newTime}` : courseName;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.game_updated.title}</span>}
          subtext={subcopy} meta={notification.time_ago}
          actions={viewGameBtn()} isSessionNew={isSessionNew}
        />
      );
    }

    case 'game_completed': {
      const courseName = data?.course_name || 'Golf Course';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.game_completed.title}</span>}
          subtext={`${courseName} · View recap`} meta={notification.time_ago}
          actions={viewGameBtn()} isSessionNew={isSessionNew}
        />
      );
    }

    // === TRIP notifications ===
    case 'trip_request': {
      const tripName = data?.trip_name || 'Golf Trip';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}<span className="font-normal text-muted-foreground">wants to join your trip</span></>}
          subtext={tripName} meta={notification.time_ago}
          actions={<button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} className={getNotificationButtonClass('primary')}>View requests</button>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_request_accepted': {
      const tripName = data?.trip_name || 'Golf Trip';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_request_accepted.title}</span>}
          subtext={`Your request to join ${tripName} was accepted`} meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)]")}><CheckCircle2 className="h-3 w-3" />Accepted</span>
              {viewTripBtn}
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_request_declined': {
      const tripName = data?.trip_name || 'Golf Trip';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_request_declined.title}</span>}
          subtext={`Your request to join ${tripName} was declined`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}><X className="h-3 w-3" />Declined</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_invite': {
      const tripName = data?.trip_name || 'Golf Trip';
      const organizerName = data?.organizer_name || actorName;
      const tripDates = data?.trip_dates || '';
      const subcopy = [tripName, tripDates].filter(Boolean).join(' · ');
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{organizerName}</span>{' '}<span className="font-normal text-muted-foreground">invited you to a trip</span></>}
          subtext={subcopy} meta={notification.time_ago}
          actions={viewTripBtn} isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_cancelled': {
      const tripName = data?.trip_name || 'Golf Trip';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_cancelled.title}</span>}
          subtext={`${tripName} has been cancelled`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}>Cancelled</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_created': {
      const tripName = data?.trip_name || 'Golf Trip';
      const dateRange = data?.date_range || '';
      const subcopy = [tripName, dateRange].filter(Boolean).join(' · ');
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_created.title}</span>}
          subtext={subcopy} meta={notification.time_ago}
          actions={viewTripBtn} isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_game_added': {
      const tripName = data?.trip_name || 'Golf Trip';
      const courseName = data?.course_name || 'Golf Course';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_game_added.title}</span>}
          subtext={`${tripName} · ${courseName}`} meta={notification.time_ago}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'trip_reminder': {
      const tripName = data?.trip_name || 'Golf Trip';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GAME_NOTIFICATION_COPY.trip_reminder.title}</span>}
          subtext={tripName} meta={notification.time_ago}
          actions={viewTripBtn} isSessionNew={isSessionNew}
        />
      );
    }

    default:
      return null;
  }
};
