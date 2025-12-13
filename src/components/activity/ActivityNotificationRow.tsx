import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, Bell, Mail, Trophy, Building2, X, MoreVertical } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import { useCancelFriendRequest } from '@/hooks/useCancelFriendRequest';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  currentUserId?: string;
  isSessionNew?: boolean;
}

// Shared base pill class for unified styling - SDS corners, 30% shorter height
const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-6 text-[11px] font-semibold transition-colors";

// Icon variants for different friend request states
function getFriendBadgeIcon(isActive: boolean) {
  return <Users className={cn("h-3 w-3", isActive ? "text-amber-500" : "text-muted-foreground")} />;
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
      return <Users className={cn(iconClass, "text-amber-500")} />;
    case 'friend_request':
    case 'friend_accepted':
      return <UserPlus className={cn(iconClass, "text-emerald-500")} />;
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
    // Business verification notifications
    case 'business_verification_submitted':
    case 'business_verification_approved':
    case 'business_verification_rejected':
      return <Building2 className={cn(iconClass, type === 'business_verification_approved' ? "text-emerald-500" : type === 'business_verification_rejected' ? "text-red-500" : "text-amber-500")} />;
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
    // Business verification notifications - use title directly
    case 'business_verification_submitted':
      return title || 'Verification request submitted';
    case 'business_verification_approved':
      return title || 'Your business is verified';
    case 'business_verification_rejected':
      return title || 'Verification not approved';
    default:
      return title || message || 'New notification';
  }
}

// Avatar with status badge component
interface AvatarWithBadgeProps {
  notification: ActivityNotification;
  badgeIcon: React.ReactNode;
}

const AvatarWithBadge: React.FC<AvatarWithBadgeProps> = ({ notification, badgeIcon }) => (
  <div className="relative shrink-0" style={{ width: 48, height: 50 }}>
    <SquircleAvatar
      src={notification.actor_avatar_url}
      alt={notification.actor_display_name || 'User'}
      size={48}
      fallback={notification.actor_display_name?.charAt(0) || '?'}
      ringColor={getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
    />
    <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-background bg-background flex items-center justify-center shadow-sm">
      {badgeIcon}
    </span>
  </div>
);

// LinkedIn-style flat row component
interface FlatRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  meta: string;
  actions?: React.ReactNode;
  isSessionNew?: boolean;
}

const FlatRow: React.FC<FlatRowProps> = ({ 
  notification, 
  onClick, 
  onOpenActionsSheet,
  avatar, 
  title, 
  meta, 
  actions,
  isSessionNew
}) => {
  // Use session-based "new" status for orange styling (persists until user leaves page)
  const showOrange = isSessionNew || notification.is_unread;
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        showOrange 
          ? "bg-amber-500/[0.06]" 
          : "bg-transparent hover:bg-muted/30"
      )}
    >
      {/* Unread dot indicator */}
      <div className="w-2 shrink-0 flex items-center justify-center">
        {showOrange && (
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        )}
      </div>

      {/* Main clickable area */}
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left min-w-0"
      >
        {avatar}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-snug",
            showOrange ? "text-foreground" : "text-foreground/90"
          )}>
            {title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
          {actions && (
            <div className="mt-2 flex items-center justify-end gap-2">
              {actions}
            </div>
          )}
        </div>
      </button>

      {/* 3-dot menu */}
      <button
        type="button"
        className="shrink-0 p-2 -mr-2 rounded-full hover:bg-muted/50 active:scale-95 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onOpenActionsSheet();
        }}
        aria-label="More options"
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export const ActivityNotificationRow: React.FC<ActivityNotificationRowProps> = ({ 
  notification, 
  onClick,
  onOpenActionsSheet,
  currentUserId,
  isSessionNew
}) => {
  const cancelMutation = useCancelFriendRequest();
  const { type, data } = notification;
  const actorName = notification.actor_display_name || 'Unknown User';
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
    /**
     * 1) RECEIVED FRIEND REQUEST
     *    – what *you* see when someone sends a request to you.
     *    – Uses notification.data.status to persist accepted/declined state across reloads.
     */
    case 'friend_request': {
      // Check if already accepted/declined via persisted data.status
      if (status === 'accepted') {
        return (
          <FlatRow
            notification={notification}
            onClick={onClick}
            onOpenActionsSheet={onOpenActionsSheet}
            avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
            title={
              <>
                <span className="font-medium">{actorName}</span>{' '}
                <span className="font-normal text-muted-foreground">sent you a friend request</span>
              </>
            }
            meta={notification.time_ago}
            actions={
              <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600 gap-1")}>
                <Users className="h-3 w-3" />
                Accepted
              </span>
            }
            isSessionNew={isSessionNew}
          />
        );
      }
      
      if (status === 'declined') {
        return (
          <FlatRow
            notification={notification}
            onClick={onClick}
            onOpenActionsSheet={onOpenActionsSheet}
            avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
            title={
              <>
                <span className="font-medium">{actorName}</span>{' '}
                <span className="font-normal text-muted-foreground">sent you a friend request</span>
              </>
            }
            meta={notification.time_ago}
            actions={
              <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500 gap-1")}>
                <X className="h-3 w-3" />
                Declined
              </span>
            }
            isSessionNew={isSessionNew}
          />
        );
      }
      
      // Pending – Accept / Decline shown at bottom-right of card
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
              <span className="font-normal text-muted-foreground">sent you a friend request</span>
            </>
          }
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

    /**
     * 2) FRIEND ACCEPTED (receiver view - you accepted their request)
     *    – Shows "is now friends with you" with Friends pill
     */
    case 'friend_accepted': {
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(true)} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{actorName}</span>{' '}
              <span className="font-normal text-muted-foreground">accepted your friend request</span>
            </>
          }
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600 gap-1")}>
              <Users className="h-3 w-3" />
              Friends
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 3) SENT FRIEND REQUEST (sender view - you sent the request)
     *    – Pending state with optional Cancel link
     */
    case 'friend_request_sent': {
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={
            <span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}>
              Friend request sent to <span className="font-semibold">{targetUserName}</span>
            </span>
          }
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-border bg-muted text-foreground/60")}>
                Pending
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground underline hover:text-foreground/80"
                onClick={handleCancelRequest}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? '...' : 'Cancel'}
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 4) FRIEND DECLINED (sender view - they declined your request)
     */
    case 'friend_declined': {
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={
            <span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}>
              <span className="font-semibold">{targetUserName}</span> declined your friend request
            </span>
          }
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              Request declined
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 5) FRIEND CANCELLED (sender view - you cancelled the request)
     */
    case 'friend_cancelled': {
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getFriendBadgeIcon(false)} />}
          title={
            <span className={cn(showOrange ? "font-medium" : "font-normal", "text-foreground/90")}>
              You cancelled your friend request to <span className="font-semibold">{targetUserName}</span>
            </span>
          }
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-border bg-muted text-foreground/60")}>
              Cancelled
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 6) DEFAULT – All other notification types (follow, like, comment, etc.)
     */
    default: {
      const statusIcon = getNotificationIcon(type);
      
      // Determine if we should show "Follow back" button
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
    }
  }
};