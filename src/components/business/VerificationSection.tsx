import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface VerificationSectionProps {
  profile: {
    id: string;
    business_name?: string | null;
    business_location?: string | null;
    business_website?: string | null;
    business_contact_email?: string | null;
    profile_photo_url?: string | null;
    verification_status?: string | null;
    verification_notes?: string | null;
    is_business_verified?: boolean | null;
  };
}

/**
 * Verification section within the manage page
 * Shows different states and allows requesting verification
 */
const VerificationSection: React.FC<VerificationSectionProps> = ({ profile }) => {
  const queryClient = useQueryClient();
  const [isRequesting, setIsRequesting] = useState(false);
  
  const verificationStatus = profile.verification_status ?? 'unverified';
  const isVerified = profile.is_business_verified === true;

  // Check if profile has minimum required fields for verification
  const canRequestVerification = Boolean(
    profile.business_name?.trim() &&
    profile.business_location?.trim() &&
    (profile.business_website?.trim() || profile.business_contact_email?.trim())
  );

  const handleRequestVerification = async () => {
    if (!profile.id) return;

    try {
      setIsRequesting(true);

      const { error } = await supabase.rpc('request_business_verification', {
        p_profile_id: profile.id,
      });

      if (error) throw error;

      // Send admin email notification
      try {
        await supabase.functions.invoke('send-business-verification-email', {
          body: {
            profileId: profile.id,
            businessName: profile.business_name,
            businessCategory: null,
            businessLocation: profile.business_location,
            businessWebsite: profile.business_website,
            businessContactEmail: profile.business_contact_email,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send admin notification email:', emailErr);
      }

      // Invalidate profile caches
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      toast.success('Verification request submitted.');
    } catch (err) {
      console.error(err);
      toast.error('Could not submit your verification request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Not submitted / Unverified
  if (verificationStatus === 'unverified' && !isVerified) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Submit your verification to receive a verified badge.
        </p>

        {/* Requirements checklist */}
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li className="flex items-center gap-2">
            {profile.business_name?.trim() ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            Business name
          </li>
          <li className="flex items-center gap-2">
            {profile.business_location?.trim() ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            Location
          </li>
          <li className="flex items-center gap-2">
            {(profile.business_website?.trim() || profile.business_contact_email?.trim()) ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            Website or email
          </li>
        </ul>

        <Button
          onClick={handleRequestVerification}
          disabled={isRequesting || !canRequestVerification}
          size="sm"
          className="mt-2"
        >
          {isRequesting ? 'Submitting...' : 'Start verification'}
        </Button>
      </div>
    );
  }

  // Pending
  if (verificationStatus === 'pending_review') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Your documents are being reviewed. This usually takes 1–3 days.
        </p>
      </div>
    );
  }

  // Verified
  if (verificationStatus === 'verified' || isVerified) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Your business is verified.
        </p>
      </div>
    );
  }

  // Rejected
  if (verificationStatus === 'rejected') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          We couldn't verify your business. Please review the notes and resubmit.
        </p>

        {profile.verification_notes && (
          <div className="bg-red-50 rounded-sq-sm p-3 border border-red-100">
            <p className="text-xs font-medium text-red-700 mb-1">Notes:</p>
            <p className="text-sm text-red-700">{profile.verification_notes}</p>
          </div>
        )}

        <Button
          onClick={handleRequestVerification}
          disabled={isRequesting || !canRequestVerification}
          size="sm"
        >
          {isRequesting ? 'Submitting...' : 'Resubmit verification'}
        </Button>
      </div>
    );
  }

  return null;
};

export default VerificationSection;
