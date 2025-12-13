import React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAcceptGolferInvite, useDeclineGolferInvite } from '@/hooks/useGolferVerificationActions';
import { cn } from '@/lib/utils';

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
  const [status, setStatus] = React.useState(initialStatus);
  const acceptMutation = useAcceptGolferInvite();
  const declineMutation = useDeclineGolferInvite();

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) return;

    acceptMutation.mutate(
      { requestId },
      {
        onSuccess: () => setStatus('accepted'),
      }
    );
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) return;

    declineMutation.mutate(
      { requestId },
      {
        onSuccess: () => setStatus('declined'),
      }
    );
  };

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  // Already responded
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 px-3 h-6 text-[11px] font-semibold rounded-sq-xs border border-emerald-500 bg-emerald-500/10 text-emerald-600">
        <Check className="h-3 w-3" />
        Accepted
      </span>
    );
  }

  if (status === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 px-3 h-6 text-[11px] font-semibold rounded-sq-xs border border-muted-foreground/30 bg-muted text-muted-foreground">
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  }

  // Pending - show action buttons
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        className="h-7 px-3 text-xs"
        onClick={handleAccept}
        disabled={isPending}
      >
        {acceptMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          'Accept invite'
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleDecline}
        disabled={isPending}
      >
        {declineMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          'Not now'
        )}
      </Button>
    </div>
  );
};
