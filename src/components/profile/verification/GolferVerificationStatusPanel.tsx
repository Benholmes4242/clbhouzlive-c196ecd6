import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, XCircle, CheckCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { useGolferVerificationRequest, useGolferCooldown, deriveGolferVerificationState } from '@/hooks/useGolferVerificationRequest';
import GolferVerificationModal from './GolferVerificationModal';

interface GolferVerificationStatusPanelProps {
  userId: string;
  isVerified: boolean;
  displayName?: string;
  profilePhotoUrl?: string;
}

const GolferVerificationStatusPanel: React.FC<GolferVerificationStatusPanelProps> = ({ 
  userId, 
  isVerified,
  displayName,
  profilePhotoUrl,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: verificationRequest } = useGolferVerificationRequest(userId);
  const { data: cooldownData } = useGolferCooldown(userId);

  const verificationState = deriveGolferVerificationState(isVerified, verificationRequest);

  // Check if cooldown is active
  const isCooldownActive = cooldownData?.cooldownUntil && cooldownData.cooldownUntil > new Date();
  const cooldownUntil = cooldownData?.cooldownUntil;
  const lastAction = cooldownData?.lastAction;

  const hasDisplayName = !!displayName?.trim();

  const handleRequestVerification = () => {
    if (isCooldownActive) {
      toast.error('Verification unavailable', {
        description: 'You\'ll be able to request verification again soon.',
      });
      return;
    }
    setModalOpen(true);
  };

  // Cooldown state after verification removal
  if (isCooldownActive && lastAction === 'revoked' && cooldownUntil) {
    return (
      <Card className="p-5 space-y-4 border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <CalendarClock className="w-4 h-4" />
            <h3 className="font-medium">Verification temporarily unavailable</h3>
          </div>
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Cooldown
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Your verification was recently removed.
          You can request verification again in <strong>{Math.ceil((cooldownUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</strong>.
        </p>

        <p className="text-xs text-muted-foreground">
          Use this time to ensure your profile and proof are up to date.
        </p>

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
          Available on <strong>{format(cooldownUntil, 'MMMM d, yyyy')}</strong>
        </p>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button disabled className="w-full" variant="outline">
                  Request Verification
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Available on {format(cooldownUntil, 'MMMM d, yyyy')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Card>
    );
  }

  // Cooldown state after rejection
  if (isCooldownActive && lastAction === 'rejected' && cooldownUntil) {
    return (
      <Card className="p-5 space-y-4 border-amber-200 bg-amber-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <CalendarClock className="w-4 h-4" />
            <h3 className="font-medium">Verification request not approved</h3>
          </div>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Cooldown
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Your previous verification request was not approved.
          You can submit a new request in <strong>{Math.ceil((cooldownUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days</strong>.
        </p>

        <p className="text-xs text-muted-foreground">
          Make sure your profile and proof clearly show you are the person you represent.
        </p>

        {verificationRequest?.admin_note && (
          <div className="bg-amber-100/50 rounded-sq-sm p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">Reason provided:</p>
            <p className="text-sm text-amber-700">{verificationRequest.admin_note}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
          Available on <strong>{format(cooldownUntil, 'MMMM d, yyyy')}</strong>
        </p>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button disabled className="w-full" variant="outline">
                  Request Verification
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Available on {format(cooldownUntil, 'MMMM d, yyyy')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Card>
    );
  }

  // Verified state
  if (verificationState === 'verified') {
    return (
      <Card className="p-5 space-y-4 border-emerald-200 bg-emerald-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-medium">You're Verified</h3>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Your account now displays a verified badge across Clbhouz.
        </p>
      </Card>
    );
  }

  // Pending state
  if (verificationState === 'pending') {
    return (
      <Card className="p-5 space-y-4 border-amber-200 bg-amber-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-medium">Verification in Progress</h3>
          </div>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Thanks — your request has been received. We'll notify you once a decision is made.
        </p>

        {verificationRequest?.created_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(verificationRequest.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button disabled className="w-full" variant="outline">
                  Request Verification
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>A request is already in progress.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Card>
    );
  }

  // Rejected state (without active cooldown)
  if (verificationState === 'rejected') {
    return (
      <>
        <Card className="p-5 space-y-4 border-red-200 bg-red-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="font-medium">Verification Not Approved</h3>
            </div>
            <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
              <XCircle className="h-3 w-3" />
              Rejected
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            Your verification request wasn't approved. Review the notes below and try again.
          </p>

          {verificationRequest?.admin_note && (
            <div className="bg-red-100/50 rounded-sq-sm p-3">
              <p className="text-xs font-medium text-red-700 mb-1">Reason provided:</p>
              <p className="text-sm text-red-700">{verificationRequest.admin_note}</p>
            </div>
          )}

          <Button onClick={handleRequestVerification} className="w-full">
            Request Verification Again
          </Button>
        </Card>
        <GolferVerificationModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  // Check if user has an active invite (status === 'invited')
  const hasActiveInvite = verificationRequest?.status === 'invited';
  // Check if user declined an invite
  const hasDeclined = verificationRequest?.status === 'declined';

  // Declined state - user can be re-invited later
  if (hasDeclined) {
    return (
      <Card className="p-5 space-y-4 border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-medium">Golfer Verification</h3>
          </div>
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20">
            Declined
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          You declined the verification invite. You can be re-invited later if eligible.
        </p>
      </Card>
    );
  }

  // Unverified/none state - now requires invite
  return (
    <>
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="w-4 h-4" />
          <h3 className="font-medium">Golfer Verification</h3>
        </div>

        {hasActiveInvite ? (
          // User has been invited - show accept flow
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You've been invited to verify your profile. Verification adds a badge showing you're a notable person in the golf community.
            </p>
            <Button onClick={handleRequestVerification} className="w-full">
              Accept & Get Verified
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can also accept via your notifications.
            </p>
          </div>
        ) : (
          // No invite - show invite-only message
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Verification is invite-only and reserved for notable members of the golf community.
            </p>
            <p className="text-xs text-muted-foreground">
              Keep building your profile — if you qualify, we'll reach out.
            </p>
          </div>
        )}
      </Card>
      {hasActiveInvite && (
        <GolferVerificationModal open={modalOpen} onOpenChange={setModalOpen} />
      )}
    </>
  );
};

export default GolferVerificationStatusPanel;
