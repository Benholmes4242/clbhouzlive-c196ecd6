import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, XCircle } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface VerificationStatusBarProps {
  profile: {
    verification_status?: string | null;
    is_business_verified?: boolean | null;
    verification_notes?: string | null;
  };
}

/**
 * Top status bar showing verification status
 * Displays conditionally based on verification state
 */
const VerificationStatusBar: React.FC<VerificationStatusBarProps> = ({ profile }) => {
  const verificationStatus = profile.verification_status ?? 'unverified';
  const isVerified = profile.is_business_verified === true;

  // Unverified
  if (verificationStatus === 'unverified' && !isVerified) {
    return (
      <div className="px-4 py-3 bg-muted/50 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20 gap-1 shrink-0">
            <VerifiedBadge size="sm" className="opacity-50" />
            Unverified
          </Badge>
          <p className="text-xs text-muted-foreground flex-1">
            Your business hasn't been verified yet. Submit your verification when you're ready.
          </p>
        </div>
      </div>
    );
  }

  // Pending
  if (verificationStatus === 'pending_review') {
    return (
      <div className="px-4 py-3 bg-amber-50/50 border-b border-amber-100/60">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            Verification pending
          </Badge>
          <p className="text-xs text-amber-900/70 flex-1">
            Thanks for submitting your documents. We're reviewing your request — this usually takes 1–3 days.
          </p>
        </div>
      </div>
    );
  }

  // Verified
  if (verificationStatus === 'verified' || isVerified) {
    return (
      <div className="px-4 py-3 bg-emerald-50/50 border-b border-emerald-100/60">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 shrink-0">
            <VerifiedBadge size="sm" />
            Verified
          </Badge>
          <p className="text-xs text-emerald-900/70 flex-1">
            Your business is verified. You'll appear with a verified badge across Clbhouz.
          </p>
        </div>
      </div>
    );
  }

  // Rejected
  if (verificationStatus === 'rejected') {
    return (
      <div className="px-4 py-3 bg-red-50/50 border-b border-red-100/60">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1 shrink-0">
            <XCircle className="h-3 w-3" />
            Verification required
          </Badge>
          <p className="text-xs text-red-900/70 flex-1">
            We couldn't verify your business. Please review the notes below and resubmit.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default VerificationStatusBar;
