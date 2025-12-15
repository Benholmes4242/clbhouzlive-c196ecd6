import React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useAcceptGolferInvite, useDeclineGolferInvite } from '@/hooks/useGolferVerificationActions';
import { cn } from '@/lib/utils';
import { getNotificationButtonClass } from '@/components/ui/NotificationCard';

interface GolferVerificationInviteButtonsProps {
  requestId: string;
  initialStatus?: 'pending' | 'accepted' | 'declined';
  isMock?: boolean;
}

export const GolferVerificationInviteButtons: React.FC<GolferVerificationInviteButtonsProps> = ({
  requestId,
  initialStatus = 'pending',
  isMock = false,
}) => {
  // Track local optimistic state, but always reset to server state on remount
  const [optimisticStatus, setOptimisticStatus] = React.useState<'pending' | 'accepted' | 'declined' | null>(null);
  const acceptMutation = useAcceptGolferInvite();
  const declineMutation = useDeclineGolferInvite();

  // Derive display status: use optimistic if set, otherwise use initialStatus from server
  const displayStatus = optimisticStatus ?? initialStatus;

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) return;

    acceptMutation.mutate(
      { requestId },
      {
        onSuccess: () => setOptimisticStatus('accepted'),
      }
    );
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) return;

    declineMutation.mutate(
      { requestId },
      {
        onSuccess: () => setOptimisticStatus('declined'),
      }
    );
  };

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  // Already responded (either optimistically or from server)
  if (displayStatus === 'accepted') {
    return (
      <span className={getNotificationButtonClass('statusSuccess')}>
        <Check className="h-3 w-3" />
        Verification in progress
      </span>
    );
  }

  if (displayStatus === 'declined') {
    return (
      <span className={getNotificationButtonClass('statusMuted')}>
        <X className="h-3 w-3" />
        Invite declined
      </span>
    );
  }

  // Pending - show action buttons
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleAccept}
        disabled={isPending}
        className={cn(
          getNotificationButtonClass('primary'),
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {acceptMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          'Accept verification'
        )}
      </button>
      <button
        onClick={handleDecline}
        disabled={isPending}
        className={cn(
          getNotificationButtonClass('secondary'),
          "disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {declineMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          'Not now'
        )}
      </button>
    </div>
  );
};
