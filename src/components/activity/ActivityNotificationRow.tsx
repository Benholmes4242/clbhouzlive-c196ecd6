import React from 'react';
import { Heart, MessageCircle, UserPlus, Users, Bell, Mail, Trophy, Building2, X, MoreVertical, ShieldCheck, CheckCircle, ShieldOff, MessageSquare } from 'lucide-react';
import { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { FollowBackButton } from './FollowBackButton';
import { FriendRequestButtons } from './FriendRequestButtons';
import { useCancelFriendRequest } from '@/hooks/useCancelFriendRequest';
import { GolferVerificationInviteButtons } from './GolferVerificationInviteButtons';

// Clbhouz logomark URL for system notifications
const CLBHOUZ_LOGOMARK_URL = '/assets/logomark-orange.png';

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

// Check if notification is a system/Clbhouz notification type
function isClbhouzSystemNotification(type: string): boolean {
  return (
    type === 'system' ||
    type === 'app_update' ||
    type.startsWith('golfer_verification_') ||
    type.startsWith('business_verification_')
  );
}

// Get the notification badge icon for the avatar overlay
function getNotificationBadgeIcon(type: string) {
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
    // Business verification notifications - glass green tick for approved
    case 'business_verification_approved':
      return <CheckCircle className={cn(iconClass, "text-emerald-500")} />;
    case 'business_verification_submitted':
    case 'business_verification_more_proof_requested':
      return <Building2 className={cn(iconClass, "text-amber-500")} />;
    case 'business_verification_rejected':
      return <Building2 className={cn(iconClass, "text-amber-500")} />;
    case 'business_verification_removed':
    case 'business_verification_revoked':
      return <ShieldOff className={cn(iconClass, "text-red-500")} />;
    // Golfer verification notifications - use same circular green tick as business verification
    case 'golfer_verification_approved':
    case 'golfer_verification_invite':
    case 'golfer_verification_submitted':
      return <CheckCircle className={cn(iconClass, "text-emerald-500")} />;
    case 'golfer_verification_rejected':
    case 'golfer_verification_removed':
      return <CheckCircle className={cn(iconClass, "text-red-500")} />;
    default:
      return <Bell className={cn(iconClass, "text-muted-foreground")} />;
  }
}

function getActorDisplayName(notification: ActivityNotification): string {
  // For business notifications, use business name from data if available
  if (notification.type?.startsWith('business_verification')) {
    const businessName = notification.data?.business_name;
    if (businessName) return businessName;
    // Fallback to title which now contains business name
    if (notification.title && notification.title !== 'Business verification removed') {
      return notification.title;
    }
  }
  
  // For system notifications, use Clbhouz Team
  if (notification.type === 'system' || notification.type === 'app_update') {
    return 'Clbhouz Team';
  }
  
  // Use actor display name, never fallback to "Someone" or "Unknown"
  const name = notification.actor_display_name;
  if (name && name !== 'Someone' && name !== 'Unknown User') {
    return name;
  }
  
  // Default to Clbhouz Team for system-like notifications
  return 'Clbhouz Team';
}

function getActorAvatarUrl(notification: ActivityNotification): string | null {
  // For Clbhouz system notifications (verification, app updates), use logo mark
  if (isClbhouzSystemNotification(notification.type)) {
    return CLBHOUZ_LOGOMARK_URL;
  }
  // For business notifications, use business logo from data if available
  if (notification.type?.startsWith('business_verification')) {
    const businessLogo = notification.data?.business_logo_url;
    if (businessLogo) return businessLogo;
  }
  return notification.actor_avatar_url;
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
      return 'Verification request submitted';
    case 'business_verification_approved':
      return 'Your business is verified';
    case 'business_verification_rejected':
      return 'Verification not approved';
    case 'business_verification_revoked':
    case 'business_verification_removed':
      return 'Verification revoked';
    case 'business_verification_domain_required':
      return 'Action required: verify your business email domain';
    // Golfer verification notifications
    case 'golfer_verification_invite':
      return "Clbhouz would like to verify your account";
    case 'golfer_verification_submitted':
      return 'Verification request submitted';
    case 'golfer_verification_approved':
      return "You're now a verified golfer";
    case 'golfer_verification_rejected':
      return 'Verification request not approved';
    case 'golfer_verification_removed':
      return 'Golfer verification removed';
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
      <span className="absolute bottom-0 right-0 translate-x-1 translate-y-1 h-5 w-5 rounded-full border-2 border-background bg-white/72 backdrop-blur-[6px] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        {badgeIcon}
      </span>
    </div>
  );
};

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
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <div className="space-y-1">
              <div>
                <span className={cn(showOrange ? "font-semibold" : "font-medium")}>Clbhouz would like to verify your account</span>
              </div>
              {isAccepted && (
                <p className="text-xs text-muted-foreground">We're reviewing your verification.</p>
              )}
              {reason && !isAccepted && !isDeclined && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Reason:</span> {reason}
                </p>
              )}
            </div>
          }
          meta={notification.time_ago}
          actions={
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {requestId && !isAccepted && !isDeclined ? (
                <>
                  <GolferVerificationInviteButtons
                    requestId={requestId}
                    initialStatus="pending"
                    isMock={notification.is_mock}
                  />
                </>
              ) : null}
              {isAccepted && (
                <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600 gap-1")}>
                  <CheckCircle className="h-3 w-3" />
                  Verification in progress
                </span>
              )}
              {isDeclined && (
                <span className={cn(basePillClass, "border-muted-foreground/30 bg-muted text-muted-foreground gap-1")}>
                  <X className="h-3 w-3" />
                  Invite declined
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); /* TODO: wire to support DM */ }}
                className={cn(basePillClass, "border-primary bg-primary/10 text-primary gap-1 cursor-pointer hover:bg-primary/20")}
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
            <div className="space-y-1">
              <div>
                <span className={cn(showOrange ? "font-semibold" : "font-medium")}>You're now a verified golfer</span>
              </div>
              <p className="text-xs text-muted-foreground">Your profile now shows a verified badge.</p>
            </div>
          }
          meta={notification.time_ago}
          actions={
            <span className={cn(basePillClass, "border-emerald-500 bg-emerald-500/10 text-emerald-600 gap-1")}>
              <CheckCircle className="h-3 w-3" />
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
            <div className="space-y-1">
              <div>
                <span className={cn(showOrange ? "font-semibold" : "font-medium")}>Verification not approved</span>
              </div>
              <p className="text-xs text-muted-foreground">Your verification request was reviewed but not approved at this time.</p>
              {reason && (
                <p className="text-xs text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </p>
              )}
            </div>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); /* TODO: wire to support DM */ }}
              className={cn(basePillClass, "border-primary bg-primary/10 text-primary gap-1 cursor-pointer hover:bg-primary/20")}
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
            <div className="space-y-1">
              <div>
                <span className={cn(showOrange ? "font-semibold" : "font-medium")}>Golfer verification removed</span>
              </div>
              <p className="text-xs text-muted-foreground">Your golfer verification has been removed.</p>
              {reason && (
                <p className="text-xs text-muted-foreground/80">
                  <span className="font-medium">Reason:</span> {reason}
                </p>
              )}
            </div>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); /* TODO: wire to support DM */ }}
              className={cn(basePillClass, "border-primary bg-primary/10 text-primary gap-1 cursor-pointer hover:bg-primary/20")}
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
     *    – Shows revoked message with reason (if provided) and support CTA
     */
    case 'business_verification_removed':
    case 'business_verification_revoked': {
      const statusIcon = <ShieldOff className="h-3 w-3 text-red-500" />;
      const businessName = data?.business_name || data?.entity_name || 'your business';
      const reason = data?.reason || data?.admin_note;
      
      // TODO: Wire this CTA to Support DM once messaging is implemented
      const handleSupportChat = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // No-op until support messaging is built
      };
      
      return (
        <FlatRow
          notification={notification}
          onClick={onClick}
          onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={
            <div className="space-y-1">
              <div>
                <span className={cn(showOrange ? "font-semibold" : "font-medium")}>Verification revoked</span>
              </div>
              <div className="text-muted-foreground font-normal text-xs">
                Your business verification for {businessName} has been revoked.
              </div>
              {reason && (
                <div className="text-xs text-muted-foreground/80 mt-1">
                  <span className="font-medium">Reason:</span> {reason}
                </div>
              )}
            </div>
          }
          meta={notification.time_ago}
          actions={
            <button
              type="button"
              onClick={handleSupportChat}
              className={cn(basePillClass, "border-primary bg-primary/10 text-primary gap-1 cursor-pointer hover:bg-primary/20")}
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
     * 10) DEFAULT – All other notification types (follow, like, comment, etc.)
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