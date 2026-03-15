import React from 'react';
import { Building2, X, UserPlus, ShieldOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { GolferVerificationInviteButtons } from '../GolferVerificationInviteButtons';
import { GOLFER_VERIFICATION_COPY } from '@/lib/golferVerificationCopy';
import { BUSINESS_VERIFICATION_COPY } from '@/lib/businessVerificationCopy';
import {
  RowProps,
  FlatRow,
  AvatarWithBadge,
  getActorDisplayName,
  getNotificationBadgeIcon,
  getNotificationButtonClass,
  basePillClass,
} from './rowHelpers';

export const VerificationRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const { type, data } = notification;
  const showOrange = isSessionNew || notification.is_unread;
  const actorName = getActorDisplayName(notification);

  const supportButton = (
    <button type="button" onClick={(e) => e.stopPropagation()} className={getNotificationButtonClass('support')}>
      <MessageSquare className="h-3 w-3" />
      Chat with support
    </button>
  );

  switch (type) {
    // === GOLFER VERIFICATION ===
    case 'golfer_verification_invite': {
      const requestId = data?.request_id;
      const inviteStatus = data?.status || 'pending';
      const reason = data?.reason;
      const statusIcon = getNotificationBadgeIcon(type);
      const isAccepted = inviteStatus === 'accepted' || inviteStatus === 'pending_review';
      const isDeclined = inviteStatus === 'declined';

      let subtextContent: React.ReactNode = null;
      if (isAccepted) subtextContent = GOLFER_VERIFICATION_COPY.accepted.body;
      else if (reason && !isDeclined) subtextContent = <><span className="font-medium">Reason:</span> {reason}</>;

      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={statusIcon} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GOLFER_VERIFICATION_COPY.invited.title}</span>}
          subtext={subtextContent} meta={notification.time_ago}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {requestId && !isAccepted && !isDeclined && (
                <GolferVerificationInviteButtons requestId={requestId} initialStatus="pending" isMock={notification.is_mock} />
              )}
              {isAccepted && (
                <span className={cn(basePillClass, "border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/10 text-[hsl(35,80%,43%)]")}><VerifiedBadge size="sm" />Verification in progress</span>
              )}
              {isDeclined && (
                <span className={cn(basePillClass, "border-border bg-muted text-muted-foreground")}><X className="h-3 w-3" />Invite declined</span>
              )}
              {supportButton}
            </div>
          }
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'golfer_verification_approved':
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GOLFER_VERIFICATION_COPY.approved.title}</span>}
          subtext={GOLFER_VERIFICATION_COPY.approved.body} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-primary/30 bg-primary/10 text-primary")}><VerifiedBadge size="sm" />Verified</span>}
          isSessionNew={isSessionNew}
        />
      );

    case 'golfer_verification_rejected': {
      const reason = data?.reason || data?.admin_note;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GOLFER_VERIFICATION_COPY.rejected.title}</span>}
          subtext={<>{GOLFER_VERIFICATION_COPY.rejected.body}{reason && <span className="block mt-1 text-muted-foreground/80"><span className="font-medium">Reason:</span> {reason}</span>}</>}
          meta={notification.time_ago} actions={supportButton} isSessionNew={isSessionNew}
        />
      );
    }

    case 'golfer_verification_removed': {
      const reason = data?.reason || data?.admin_note;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<ShieldOff className="h-3 w-3 text-red-500" />} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{GOLFER_VERIFICATION_COPY.removed.title}</span>}
          subtext={<>{GOLFER_VERIFICATION_COPY.removed.body}{reason && <span className="block mt-1 text-muted-foreground/80"><span className="font-medium">Reason:</span> {reason}</span>}</>}
          meta={notification.time_ago} actions={supportButton} isSessionNew={isSessionNew}
        />
      );
    }

    // === BUSINESS VERIFICATION ===
    case 'business_verification_removed':
    case 'business_verification_revoked': {
      const businessName = data?.business_name || data?.entity_name || 'your business';
      const reason = data?.reason || data?.admin_note;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<ShieldOff className="h-3 w-3 text-red-500" />} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>Verification revoked</span>}
          subtext={<>Your business verification for {businessName} has been revoked.{reason && <span className="block mt-1 text-muted-foreground/80"><span className="font-medium">Reason:</span> {reason}</span>}</>}
          meta={notification.time_ago} actions={supportButton} isSessionNew={isSessionNew}
        />
      );
    }

    case 'business_verification_submitted':
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{BUSINESS_VERIFICATION_COPY.submitted.title}</span>}
          subtext={BUSINESS_VERIFICATION_COPY.submitted.body} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-amber-500/30 bg-amber-500/10 text-amber-600")}>Pending</span>}
          isSessionNew={isSessionNew}
        />
      );

    case 'business_verification_approved':
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{BUSINESS_VERIFICATION_COPY.approved.title}</span>}
          subtext={BUSINESS_VERIFICATION_COPY.approved.body} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-primary/30 bg-primary/10 text-primary")}><VerifiedBadge size="sm" />Verified</span>}
          isSessionNew={isSessionNew}
        />
      );

    case 'business_verification_rejected': {
      const reason = data?.reason || data?.admin_note;
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{BUSINESS_VERIFICATION_COPY.rejected.title}</span>}
          subtext={<>{BUSINESS_VERIFICATION_COPY.rejected.body}{reason && <span className="block mt-1 text-muted-foreground/80"><span className="font-medium">Reason:</span> {reason}</span>}</>}
          meta={notification.time_ago} actions={supportButton} isSessionNew={isSessionNew}
        />
      );
    }

    case 'business_verification_more_proof_requested':
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={getNotificationBadgeIcon(type)} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>{BUSINESS_VERIFICATION_COPY.more_proof_requested.title}</span>}
          subtext={BUSINESS_VERIFICATION_COPY.more_proof_requested?.body} meta={notification.time_ago}
          actions={supportButton} isSessionNew={isSessionNew}
        />
      );

    // === BUSINESS ACCESS ===
    case 'business_member_added': {
      const businessName = data?.business_name || 'a business';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<Building2 className="h-3 w-3 text-gray-500" />} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>Added to team</span>}
          subtext={`You've been added to ${businessName}.`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-border bg-muted text-muted-foreground")}><Building2 className="h-3 w-3" />Team member</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'business_access_request': {
      const requesterName = notification.actor_display_name || data?.requester_name || 'A user';
      const businessName = data?.business_name || 'your business';
      const rawRole = data?.role_requested || 'team member';
      const roleLabel = rawRole.toLowerCase().replace('_', ' ');
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<UserPlus className="h-3 w-3 text-amber-500" />} />}
          title={<><span className={cn(showOrange ? "font-semibold" : "font-medium")}>{requesterName}</span>{' '}<span className="font-normal text-muted-foreground">requested {roleLabel} access</span></>}
          subtext={<span className="flex flex-col gap-0.5"><span>to {businessName}</span><span className="text-xs text-muted-foreground/70">Review in Business Profiles → Manage team</span></span>}
          meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-amber-500/30 bg-amber-500/10 text-amber-600")}>Pending</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'business_access_approved': {
      const businessName = data?.business_name || 'the business';
      const roleGranted = data?.role_granted || data?.role || 'Team member';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<Building2 className="h-3 w-3 text-gray-500" />} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>Added to team</span>}
          subtext={`You now have access to ${businessName}.`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-border bg-muted text-muted-foreground")}><Building2 className="h-3 w-3" />{roleGranted}</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    case 'business_access_declined': {
      const businessName = data?.business_name || 'the business';
      return (
        <FlatRow notification={notification} onClick={onClick} onOpenActionsSheet={onOpenActionsSheet}
          avatar={<AvatarWithBadge notification={notification} badgeIcon={<X className="h-3 w-3 text-red-500" />} />}
          title={<span className={cn(showOrange ? "font-semibold" : "font-medium")}>Request declined</span>}
          subtext={`Your request to join ${businessName} was declined.`} meta={notification.time_ago}
          actions={<span className={cn(basePillClass, "border-destructive/30 bg-destructive/10 text-destructive")}><X className="h-3 w-3" />Declined</span>}
          isSessionNew={isSessionNew}
        />
      );
    }

    default:
      return null;
  }
};
