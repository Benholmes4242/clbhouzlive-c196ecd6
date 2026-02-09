import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, Bell, Mail, Trophy, Building2, X, ShieldOff, MessageSquare, Clock, CalendarDays, MapPin, CheckCircle2, UserCheck } from 'lucide-react';
import { FiMapPin } from 'react-icons/fi';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import { useCancelFriendRequest } from '@/hooks/useCancelFriendRequest';
import { GolferVerificationInviteButtons } from './GolferVerificationInviteButtons';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { NotificationCard, getNotificationButtonClass } from '@/components/ui/NotificationCard';
import { GOLFER_VERIFICATION_COPY } from '@/lib/golferVerificationCopy';
import { BUSINESS_VERIFICATION_COPY } from '@/lib/businessVerificationCopy';
import { GAME_NOTIFICATION_COPY, isGameNotification } from '@/lib/gameNotificationCopy';

// Clbhouz logomark URL for system notifications
const CLBHOUZ_LOGOMARK_URL = '/assets/logomark-orange.png';

interface ActivityNotificationRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  currentUserId?: string;
  isSessionNew?: boolean;
}

// Shared base pill class for unified styling - SDS corners
const basePillClass = "inline-flex items-center justify-center rounded-sq-xs border px-3 h-9 text-xs font-medium transition-colors gap-1.5 active:scale-[0.93]";

// Icon variants for different friend request states
function getFriendBadgeIcon(isActive: boolean) {
  return <Users className={cn("h-3 w-3", isActive ? "text-green-500" : "text-muted-foreground")} />;
}

// Check if notification is a system/Clbhouz notification type
// NOTE: Business notifications should NOT use Clbhouz branding - they use business avatar/name
function isClbhouzSystemNotification(type: string): boolean {
  return (
    type === 'system' ||
    type === 'app_update' ||
    type.startsWith('golfer_verification_')
    // Business notifications explicitly excluded - they show business identity
  );
}

// Check if this is a business-entity notification (should show business avatar/name)
function isBusinessEntityNotification(type: string): boolean {
  return (
    type.startsWith('business_verification_') ||
    type === 'business_member_added' ||
    type === 'business_access_request' ||
    type === 'business_access_approved' ||
    type === 'business_access_declined'
  );
}

// Get the notification badge icon for the avatar overlay
function getNotificationBadgeIcon(type: string) {
  const iconClass = "h-3 w-3";
  switch (type) {
    // Fix 8: Updated colour system
    case 'like':
      return <Heart className={cn(iconClass, "text-[#F7931E]")} fill="currentColor" />;
    case 'comment':
      return <MessageCircle className={cn(iconClass, "text-blue-500")} />;
    case 'mention':
    case 'tag':
      return <MessageCircle className={cn(iconClass, "text-purple-500")} />;
    case 'follow':
      return <UserPlus className={cn(iconClass, "text-blue-500")} />;
    case 'friend_request':
    case 'friend_accept':
    case 'friend_accepted':
      return <Users className={cn(iconClass, "text-green-500")} />;
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
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    // Business verification
    case 'business_verification_approved':
      return <VerifiedBadge size="sm" />;
    case 'business_verification_submitted':
    case 'business_verification_more_proof_requested':
      return <Clock className={cn(iconClass, "text-amber-500")} />;
    case 'business_verification_rejected':
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    case 'business_verification_removed':
    case 'business_verification_revoked':
      return <ShieldOff className={cn(iconClass, "text-gray-500")} />;
    // Business access
    case 'business_member_added':
    case 'business_access_approved':
      return <Building2 className={cn(iconClass, "text-gray-500")} />;
    case 'business_access_request':
      return <UserPlus className={cn(iconClass, "text-gray-500")} />;
    case 'business_access_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    // Golfer verification
    case 'golfer_verification_approved':
      return <VerifiedBadge size="sm" />;
    case 'golfer_verification_invite':
    case 'golfer_verification_submitted':
      return <Clock className={cn(iconClass, "text-amber-500")} />;
    case 'golfer_verification_rejected':
    case 'golfer_verification_removed':
      return <ShieldOff className={cn(iconClass, "text-red-500")} />;
    // Game & Trip notifications
    case 'game_request':
      return <UserPlus className={cn(iconClass, "text-amber-500")} />;
    case 'game_request_accepted':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'game_request_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'game_invite':
      return <CalendarDays className={cn(iconClass, "text-emerald-500")} />;
    case 'game_cancelled':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'rsvp_update':
      return <UserCheck className={cn(iconClass, "text-emerald-500")} />;
    case 'game_reminder_24h':
    case 'game_reminder_2h':
      return <Bell className={cn(iconClass, "text-amber-500")} />;
    case 'game_updated':
      return <CalendarDays className={cn(iconClass, "text-blue-500")} />;
    case 'game_completed':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_request':
      return <UserPlus className={cn(iconClass, "text-amber-500")} />;
    case 'trip_request_accepted':
      return <CheckCircle2 className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_request_declined':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'trip_invite':
      return <MapPin className={cn(iconClass, "text-emerald-500")} />;
    case 'trip_cancelled':
      return <X className={cn(iconClass, "text-red-500")} />;
    case 'trip_created':
    case 'trip_game_added':
    case 'trip_reminder':
      return <MapPin className={cn(iconClass, "text-violet-500")} />;
    // Friend course review
    case 'friend_course_review':
    case 'course_review':
      return <FiMapPin className={cn(iconClass, "text-emerald-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
  }
}

function getActorDisplayName(notification: ActivityNotification): string {
  // For business-entity notifications, prioritize business name from data
  if (isBusinessEntityNotification(notification.type)) {
    const businessName = notification.data?.business_name || notification.data?.entity_name;
    if (businessName) return businessName;
  }
  
  // For system notifications only, use Clbhouz Team
  if (notification.type === 'system' || notification.type === 'app_update') {
    return 'Clbhouz Team';
  }
  
  // Use actor display name for user-triggered notifications
  const name = notification.actor_display_name;
  if (name && name !== 'Someone' && name !== 'Unknown User') {
    return name;
  }
  
  // For business notifications without actor, use business name
  if (isBusinessEntityNotification(notification.type)) {
    return notification.data?.business_name || 'Business';
  }
  
  // Default fallback
  return 'Someone';
}

function getActorAvatarUrl(notification: ActivityNotification): string | null {
  // For business-entity notifications, use business avatar from data
  if (isBusinessEntityNotification(notification.type)) {
    const businessAvatar = notification.data?.business_avatar_url || 
                           notification.data?.business_logo_url || 
                           notification.data?.entity_avatar_url;
    if (businessAvatar) return businessAvatar;
    // No fallback to Clbhouz logo - return null to show initials
    return null;
  }
  
  // For Clbhouz system notifications only (golfer verification, app updates), use logo mark
  if (isClbhouzSystemNotification(notification.type)) {
    return CLBHOUZ_LOGOMARK_URL;
  }
  
  return notification.actor_avatar_url;
}

function renderNotificationText(notification: ActivityNotification): string | React.ReactNode {
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
    // Business verification notifications - use centralized copy
    case 'business_verification_submitted':
      return BUSINESS_VERIFICATION_COPY.submitted.title;
    case 'business_verification_approved':
      return BUSINESS_VERIFICATION_COPY.approved.title;
    case 'business_verification_rejected':
      return BUSINESS_VERIFICATION_COPY.rejected.title;
    case 'business_verification_revoked':
    case 'business_verification_removed':
      return BUSINESS_VERIFICATION_COPY.removed.title;
    case 'business_verification_more_proof_requested':
      return BUSINESS_VERIFICATION_COPY.more_proof_requested.title;
    // Golfer verification notifications - use centralized copy
    case 'golfer_verification_invite':
      return GOLFER_VERIFICATION_COPY.invited.title;
    case 'golfer_verification_submitted':
      return GOLFER_VERIFICATION_COPY.accepted.title;
    case 'golfer_verification_approved':
      return GOLFER_VERIFICATION_COPY.approved.title;
    case 'golfer_verification_rejected':
      return GOLFER_VERIFICATION_COPY.rejected.title;
    case 'golfer_verification_removed':
      return GOLFER_VERIFICATION_COPY.removed.title;
    // Friend course review — descriptive text with bold course name + rating
    case 'friend_course_review':
    case 'course_review': {
      const courseName = notification.data?.course_name;
      const rating = notification.data?.rating;
      if (courseName) {
        const truncatedName = courseName.length > 30 ? courseName.slice(0, 30) + '…' : courseName;
        if (rating != null) {
          return <>reviewed <span className="font-semibold text-foreground">{truncatedName}</span> and rated it <span className="font-semibold text-foreground">{rating}</span></>;
        }
        return <>reviewed <span className="font-semibold text-foreground">{truncatedName}</span></>;
      }
      return 'reviewed a course';
    }
    default:
      return title || message || 'New notification';
  }
}

// Avatar with status badge component
interface AvatarWithBadgeProps {
  notification: ActivityNotification;
  badgeIcon: React.ReactNode;
}

const AvatarWithBadge: React.FC<AvatarWithBadgeProps> = ({ notification, badgeIcon }) => {
  const avatarUrl = getActorAvatarUrl(notification);
  const displayName = getActorDisplayName(notification);
  const isSystemNotification = isClbhouzSystemNotification(notification.type);
  
  return (
    <div className="relative shrink-0" style={{ width: 48, height: 50 }}>
      <SquircleAvatar
        src={avatarUrl}
        alt={displayName || 'User'}
        size={48}
        fallback={displayName?.charAt(0) || '?'}
        ringColor={isSystemNotification ? undefined : getRingColorForTotalPlayed(notification.data?.actor_total_top100_played || 0)}
      />
      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background ring-2 ring-background shadow-sm flex items-center justify-center">
        {badgeIcon}
      </span>
    </div>
  );
};

// Row wrapper using NotificationCard - maintains existing interface for easy migration
interface FlatRowProps {
  notification: ActivityNotification;
  onClick: () => void;
  onOpenActionsSheet: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtext?: React.ReactNode;
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
  subtext,
  meta, 
  actions,
  isSessionNew
}) => {
  const showOrange = isSessionNew || notification.is_unread;
  
  return (
    <NotificationCard
      avatar={avatar}
      title={title}
      subtext={subtext}
      actions={actions}
      timestamp={meta}
      isNew={showOrange}
      onClick={onClick}
      onMenuClick={onOpenActionsSheet}
    />
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
              <span className={cn(basePillClass, "border-green-400 bg-green-50 text-green-600 gap-1")}>
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
              <span className={cn(basePillClass, "border-red-300 bg-red-50 text-red-500 gap-1")}>
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
    case 'friend_accept':
    case 'friend_accepted': {  // 'friend_accept' is the DB type, 'friend_accepted' is legacy
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
              <span className={cn(basePillClass, "border-green-400 bg-green-50 text-green-600 gap-1")}>
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
     * 6) GOLFER VERIFICATION INVITE
     *    – User received an invite to verify their golfer profile
     */
    case 'golfer_verification_invite': {
      const requestId = data?.request_id;
      const inviteStatus = data?.status || 'pending';
      const reason = data?.reason;
      const statusIcon = getNotificationBadgeIcon(type);
      const isAccepted = inviteStatus === 'accepted' || inviteStatus === 'pending_review';
      const isDeclined = inviteStatus === 'declined';
      
      // Build subtext based on state using centralized copy
      let subtextContent: React.ReactNode = null;
      if (isAccepted) {
        subtextContent = GOLFER_VERIFICATION_COPY.accepted.body;
      } else if (reason && !isDeclined) {
        subtextContent = <><span className="font-medium">Reason:</span> {reason}</>;
      }
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GOLFER_VERIFICATION_COPY.invited.title}
            </span>
          }
          subtext={subtextContent}
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {requestId && !isAccepted && !isDeclined && (
                <GolferVerificationInviteButtons
                  requestId={requestId}
                  initialStatus="pending"
                  isMock={notification.is_mock}
                />
              )}
              {isAccepted && (
                <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600")}>
                  <VerifiedBadge size="sm" />
                  Verification in progress
                </span>
              )}
              {isDeclined && (
                <span className={cn(basePillClass, "border-muted-foreground/30 bg-muted text-muted-foreground")}>
                  <X className="h-3 w-3" />
                  Invite declined
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); }}
                className={getNotificationButtonClass('support')}
              >
                <MessageSquare className="h-3 w-3" />
                Chat with support
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 7) GOLFER VERIFICATION APPROVED
     */
    case 'golfer_verification_approved': {
      const statusIcon = getNotificationBadgeIcon(type);
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GOLFER_VERIFICATION_COPY.approved.title}
            </span>
          }
          subtext={GOLFER_VERIFICATION_COPY.approved.body}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600")}>
              <VerifiedBadge size="sm" />
              Verified
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 8) GOLFER VERIFICATION REJECTED
     */
    case 'golfer_verification_rejected': {
      const statusIcon = getNotificationBadgeIcon(type);
      const reason = data?.reason || data?.admin_note;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GOLFER_VERIFICATION_COPY.rejected.title}
            </span>
          }
          subtext={
            <>
              {GOLFER_VERIFICATION_COPY.rejected.body}
              {reason && (
                <span className="block mt-1 text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </span>
              )}
            </>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className={getNotificationButtonClass('support')}
            >
              <MessageSquare className="h-3 w-3" />
              Chat with support
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 8b) GOLFER VERIFICATION REMOVED (revoked)
     */
    case 'golfer_verification_removed': {
      const statusIcon = <ShieldOff className="h-3 w-3 text-red-500" />;
      const reason = data?.reason || data?.admin_note;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GOLFER_VERIFICATION_COPY.removed.title}
            </span>
          }
          subtext={
            <>
              {GOLFER_VERIFICATION_COPY.removed.body}
              {reason && (
                <span className="block mt-1 text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </span>
              )}
            </>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className={getNotificationButtonClass('support')}
            >
              <MessageSquare className="h-3 w-3" />
              Chat with support
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 9) BUSINESS VERIFICATION REVOKED/REMOVED
     */
    case 'business_verification_removed':
    case 'business_verification_revoked': {
      const statusIcon = <ShieldOff className="h-3 w-3 text-red-500" />;
      const businessName = data?.business_name || data?.entity_name || 'your business';
      const reason = data?.reason || data?.admin_note;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              Verification revoked
            </span>
          }
          subtext={
            <>
              Your business verification for {businessName} has been revoked.
              {reason && (
                <span className="block mt-1 text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </span>
              )}
            </>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className={getNotificationButtonClass('support')}
            >
              <MessageSquare className="h-3 w-3" />
              Chat with support
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 10) BUSINESS VERIFICATION SUBMITTED
     */
    case 'business_verification_submitted': {
      const statusIcon = getNotificationBadgeIcon(type);
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {BUSINESS_VERIFICATION_COPY.submitted.title}
            </span>
          }
          subtext={BUSINESS_VERIFICATION_COPY.submitted.body}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-amber-400 bg-amber-500/10 text-amber-600")}>
              Pending
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 11) BUSINESS VERIFICATION APPROVED
     */
    case 'business_verification_approved': {
      const statusIcon = getNotificationBadgeIcon(type);
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {BUSINESS_VERIFICATION_COPY.approved.title}
            </span>
          }
          subtext={BUSINESS_VERIFICATION_COPY.approved.body}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600")}>
              <VerifiedBadge size="sm" />
              Verified
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 12) BUSINESS VERIFICATION REJECTED
     */
    case 'business_verification_rejected': {
      const statusIcon = getNotificationBadgeIcon(type);
      const reason = data?.reason || data?.admin_note;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {BUSINESS_VERIFICATION_COPY.rejected.title}
            </span>
          }
          subtext={
            <>
              {BUSINESS_VERIFICATION_COPY.rejected.body}
              {reason && (
                <span className="block mt-1 text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </span>
              )}
            </>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); }}
              className={getNotificationButtonClass('support')}
            >
              <MessageSquare className="h-3 w-3" />
              Chat with support
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 13) BUSINESS MEMBER ADDED - user was added to a business team
     */
    case 'business_member_added': {
      const businessName = data?.business_name || 'a business';
      const statusIcon = <Building2 className="h-3 w-3 text-gray-500" />;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              Added to team
            </span>
          }
          subtext={`You've been added to ${businessName}.`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-gray-300 bg-gray-50 text-gray-600")}>
              <Building2 className="h-3 w-3" />
              Team member
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 14) BUSINESS ACCESS REQUEST - someone requested access to your business
     */
    case 'business_access_request': {
      // Priority: actor_display_name > data.requester_name > fallback "A user"
      const requesterName = notification.actor_display_name || data?.requester_name || 'A user';
      const businessName = data?.business_name || 'your business';
      const businessId = data?.business_id || notification.entity_id;
      // Normalize role label: team_member → "team member", manager → "manager"
      const rawRole = data?.role_requested || 'team member';
      const roleLabel = rawRole.toLowerCase().replace('_', ' ');
      const statusIcon = <UserPlus className="h-3 w-3 text-amber-500" />;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{requesterName}</span>{' '}
              <span className="font-normal text-muted-foreground">requested {roleLabel} access</span>
            </>
          }
          subtext={
            <span className="flex flex-col gap-0.5">
              <span>to {businessName}</span>
              <span className="text-xs text-muted-foreground/70">Review in Business Profiles → Manage team</span>
            </span>
          }
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-amber-400 bg-amber-500/10 text-amber-600")}>
              Pending
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 15) BUSINESS ACCESS APPROVED - your access request was approved
     */
    case 'business_access_approved': {
      const businessName = data?.business_name || 'the business';
      const roleGranted = data?.role_granted || data?.role || 'Team member';
      const statusIcon = <Building2 className="h-3 w-3 text-gray-500" />;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              Added to team
            </span>
          }
          subtext={`You now have access to ${businessName}.`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-gray-300 bg-gray-50 text-gray-600")}>
              <Building2 className="h-3 w-3" />
              {roleGranted}
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 16) BUSINESS ACCESS DECLINED - your access request was declined
     */
    case 'business_access_declined': {
      const businessName = data?.business_name || 'the business';
      const statusIcon = <X className="h-3 w-3 text-red-500" />;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              Request declined
            </span>
          }
          subtext={`Your request to join ${businessName} was declined.`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              <X className="h-3 w-3" />
              Declined
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 17) GAME REQUEST - Someone wants to join your game (Host receives)
     */
    case 'game_request': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      const requesterName = actorName;
      const requestMessage = data?.request_message;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{requesterName}</span>{' '}
              <span className="font-normal text-muted-foreground">wants to join your game</span>
            </>
          }
          subtext={requestMessage || courseName}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View requests
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 18) GAME REQUEST ACCEPTED - Your request was accepted (Requester receives)
     */
    case 'game_request_accepted': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_request_accepted.title}
            </span>
          }
          subtext={`Your request to join ${courseName} was accepted`}
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600")}>
                <CheckCircle2 className="h-3 w-3" />
                Accepted
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className={getNotificationButtonClass('primary')}
              >
                View game
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 19) GAME REQUEST DECLINED - Your request was declined (Requester receives)
     */
    case 'game_request_declined': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_request_declined.title}
            </span>
          }
          subtext={`Your request to join ${courseName} was declined`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              <X className="h-3 w-3" />
              Declined
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 20) GAME CANCELLED - Game has been cancelled
     */
    case 'game_cancelled': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_cancelled.title}
            </span>
          }
          subtext={`The game at ${courseName} has been cancelled`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              Cancelled
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 21) GAME INVITE - You've been invited to a game
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      const date = data?.date || '';
      const time = data?.time || '';
      const subcopy = [courseName, date, time].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_invite.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-amber-400 bg-amber-500/10 text-amber-600")}>
                Pending
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className={getNotificationButtonClass('primary')}
              >
                View game
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 18) RSVP UPDATE - Friend is going to a game
     */
    case 'rsvp_update': {
      const statusIcon = getNotificationBadgeIcon(type);
      const playerName = data?.player_name || actorName;
      const courseName = data?.course_name || 'Golf Course';
      const date = data?.date || '';
      const subcopy = [courseName, date].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{playerName}</span>{' '}
              <span className="font-normal text-muted-foreground">is going</span>
            </>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 19) GAME REMINDER 24H - You're playing tomorrow
     */
    case 'game_reminder_24h': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      const time = data?.time || '';
      const subcopy = [courseName, time].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_reminder_24h.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View game
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 20) GAME REMINDER 2H - Game starting soon
     */
    case 'game_reminder_2h': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      const time = data?.time || '';
      const subcopy = [courseName, time].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_reminder_2h.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View game
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 21) GAME UPDATED - Game details changed
     */
    case 'game_updated': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      const newTime = data?.new_time;
      const subcopy = newTime 
        ? `${courseName} · New tee time: ${newTime}`
        : courseName;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_updated.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View game
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 22) GAME COMPLETED - Game has ended
     */
    case 'game_completed': {
      const statusIcon = getNotificationBadgeIcon(type);
      const courseName = data?.course_name || 'Golf Course';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.game_completed.title}
            </span>
          }
          subtext={`${courseName} · View recap`}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View game
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 27) TRIP REQUEST - Someone wants to join your trip (Organizer receives)
     */
    case 'trip_request': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      const requesterName = actorName;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{requesterName}</span>{' '}
              <span className="font-normal text-muted-foreground">wants to join your trip</span>
            </>
          }
          subtext={tripName}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View requests
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 28) TRIP REQUEST ACCEPTED - Your request was accepted (Requester receives)
     */
    case 'trip_request_accepted': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_request_accepted.title}
            </span>
          }
          subtext={`Your request to join ${tripName} was accepted`}
          meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2">
              <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600")}>
                <CheckCircle2 className="h-3 w-3" />
                Accepted
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className={getNotificationButtonClass('primary')}
              >
                View trip
              </button>
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 29) TRIP REQUEST DECLINED - Your request was declined (Requester receives)
     */
    case 'trip_request_declined': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_request_declined.title}
            </span>
          }
          subtext={`Your request to join ${tripName} was declined`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              <X className="h-3 w-3" />
              Declined
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 30) TRIP INVITE - You've been invited to a trip
     */
    case 'trip_invite': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      const organizerName = data?.organizer_name || actorName;
      const tripDates = data?.trip_dates || '';
      const subcopy = [tripName, tripDates].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <>
              <span className={cn(showOrange ? "font-semibold" : "font-medium")}>{organizerName}</span>{' '}
              <span className="font-normal text-muted-foreground">invited you to a trip</span>
            </>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View trip
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 31) TRIP CANCELLED - Trip has been cancelled
     */
    case 'trip_cancelled': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_cancelled.title}
            </span>
          }
          subtext={`${tripName} has been cancelled`}
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-red-400 bg-red-500/5 text-red-500")}>
              Cancelled
            </span>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 32) TRIP CREATED - You've been added to a trip
     */
    case 'trip_created': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      const dateRange = data?.date_range || '';
      const subcopy = [tripName, dateRange].filter(Boolean).join(' · ');
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_created.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View trip
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 24) TRIP GAME ADDED - New game added to trip
     */
    case 'trip_game_added': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      const courseName = data?.course_name || 'Golf Course';
      const subcopy = `${tripName} · ${courseName}`;
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_game_added.title}
            </span>
          }
          subtext={subcopy}
          meta={notification.time_ago}
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 25) TRIP REMINDER - Trip starts tomorrow
     */
    case 'trip_reminder': {
      const statusIcon = getNotificationBadgeIcon(type);
      const tripName = data?.trip_name || 'Golf Trip';
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
              {GAME_NOTIFICATION_COPY.trip_reminder.title}
            </span>
          }
          subtext={tripName}
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={getNotificationButtonClass('primary')}
            >
              View trip
            </button>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    /**
     * 26) DEFAULT – All other notification types (follow, like, comment, etc.)
     */
    default: {
      const statusIcon = getNotificationBadgeIcon(type);
      
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