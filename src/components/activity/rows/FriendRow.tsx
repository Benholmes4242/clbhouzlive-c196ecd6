import React from 'react';
import { Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCancelFriendRequest } from '@/hooks/useCancelFriendRequest';
import { FriendRequestButtons } from '../FriendRequestButtons';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  basePillClass,
} from './rowHelpers';

function getFriendBadgeIcon(isActive: boolean) {
  return <Users className={cn("h-3 w-3", isActive ? "text-green-500" : "text-muted-foreground")} />;
}

export const FriendRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const cancelMutation = useCancelFriendRequest();
  const { type, data } = notification;
  const actorName = getActorDisplayName(notification);
  const targetUserName = data?.target_user_name || actorName;
  const showOrange = isSessionNew || notification.is_unread;
  const friendRequestId = data?.request_id || notification.id;
  const status = data?.status || 'pending';

  const handleCancelRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.is_mock) return;
    cancelMutation.mutate({
      requestId: friendRequestId,
      targetUserId: notification.actor_id!,
      targetUserName,
    });
  };

  switch (type) {
    case 'friend_request': {
      if (status === 'accepted') {
        return (
          <FlatRow
            notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
            avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
            title={<><span className="font-medium">{actorName}</span>{' '}<span className="font-normal text-muted-foreground">sent you a friend request</span></>}
            meta={notification.time_ago}
            actions={<span className={cn(basePillClass, "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)] gap-1")}><Users className="h-3 w-3" />Accepted</span>}
            isSessionNew={isSessionNew}
          />
        );
      }
      if (status === 'declined') {
        return (
          <FlatRow
            notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
            avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
            title={<><span className="font-medium">{actorName}</span>{' '}<span className="font-normal text-muted-foreground">sent you a friend request</span></>}
            meta={notification.time_ago}
            actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive gap-1")}><X className="h-3 w-3" />Declined</span>}
            isSessionNew={isSessionNew}
          />
        );
      }
      return (
        <FlatRow
          notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}<span className="font-normal text-muted-foreground">sent you a friend request</span></>}
          meta={notification.time_ago}
          actions={
            <FriendRequestButtons
              notificationId={notification.id}
              requestId={friendRequestId}
              requesterId={notification.actor_id!}
              requesterName={actorName}
              initialStatus={status}
              isMock={notification.is_mock}
            />
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'friend_accept':
    case 'friend_accepted': {
      return (
        <FlatRow
          notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}<span className="font-normal text-muted-foreground">accepted your friend request</span></>}
          meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-primary/30 bg-primary/10 text-primary gap-1")}><Users className="h-3 w-3" />Friends</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'friend_request_sent': {
      return (
        <FlatRow
          notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={<span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}>Friend request sent to <span className="font-semibold">{targetUserName}</span></span>}
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-border bg-muted text-muted-foreground")}>Pending</span>
              <button type="button" className="text-xs text-muted-foreground underline hover:text-foreground/80" onClick={handleCancelRequest} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? '...' : 'Cancel'}
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'friend_declined': {
      return (
        <FlatRow
          notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={<span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}><span className="font-semibold">{targetUserName}</span> declined your friend request</span>}
          meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}>Request declined</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'friend_cancelled': {
      return (
        <FlatRow
          notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={<span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}>You cancelled your friend request to <span className="font-semibold">{targetUserName}</span></span>}
          meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-border bg-muted text-muted-foreground")}>Cancelled</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    default:
      return null;
  }
};
