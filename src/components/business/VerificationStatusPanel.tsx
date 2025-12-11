import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationStatusPanelProps {
  profile: {
    id: string;
    business_name?: string | null;
    business_location?: string | null;
    business_website?: string | null;
    business_contact_email?: string | null;
    profile_photo_url?: string | null;
    verification_status?: string | null;
    verification_notes?: string | null;
    verification_requested_at?: string | null;
    is_business_verified?: boolean | null;
  };
}

const VerificationStatusPanel: React.FC<VerificationStatusPanelProps> = ({ profile }) => {
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

  // Unverified state
  if (verificationStatus === 'unverified') {
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="w-4 h-4" />
          <h3 className="font-medium">Business Verification</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Verification helps golfers trust that your business is authentic.
          Once verified, you'll appear with a blue badge across Clbhouz and may receive higher visibility in the directory.
        </p>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            Before requesting verification, make sure your profile includes:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 ml-1">
            <li className="flex items-center gap-2">
              {profile.business_name?.trim() ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              A clear business name
            </li>
            <li className="flex items-center gap-2">
              {(profile.business_website?.trim() || profile.business_contact_email?.trim()) ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              A website or contact email
            </li>
            <li className="flex items-center gap-2">
              {profile.business_location?.trim() ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              Your location
            </li>
            <li className="flex items-center gap-2">
              {profile.profile_photo_url?.trim() ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              A profile image or logo
            </li>
          </ul>
        </div>

        {canRequestVerification ? (
          <Button
            onClick={handleRequestVerification}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? 'Submitting...' : 'Request Verification'}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button disabled className="w-full">
                    Complete your profile to request verification
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add a business name, location, and website or email to continue.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!canRequestVerification && (
          <p className="text-xs text-amber-600">
            Your business profile is missing key information needed for verification.
          </p>
        )}
      </Card>
    );
  }

  // Pending review state
  if (verificationStatus === 'pending_review') {
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
          Thanks — your request has been received.
          Our team is reviewing your business details. We'll notify you as soon as we've made a decision.
        </p>

        {profile.verification_requested_at && (
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(profile.verification_requested_at).toLocaleDateString('en-GB', {
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

  // Verified state
  if (verificationStatus === 'verified' || isVerified) {
    return (
      <Card className="p-5 space-y-4 border-emerald-200 bg-emerald-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-medium">Your Business Is Verified</h3>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Your business now displays a verified badge across Clbhouz.
          Golfers will see this badge in the directory, search results, and your profile.
        </p>
      </Card>
    );
  }

  // Rejected state
  if (verificationStatus === 'rejected') {
    return (
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
          Your previous verification request wasn't approved.
          You can review the notes below, update your profile, and request verification again.
        </p>

        {profile.verification_notes && (
          <div className="bg-red-100/50 rounded-sq-sm p-3">
            <p className="text-xs font-medium text-red-700 mb-1">Reason provided:</p>
            <p className="text-sm text-red-700">{profile.verification_notes}</p>
          </div>
        )}

        {canRequestVerification ? (
          <Button
            onClick={handleRequestVerification}
            disabled={isRequesting}
            className="w-full"
          >
            {isRequesting ? 'Submitting...' : 'Request Verification Again'}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button disabled className="w-full">
                    Complete your profile to request verification
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add a business name, location, and website or email to continue.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <p className="text-xs text-muted-foreground">
          Make sure your profile details are accurate and match your official business information.
        </p>
      </Card>
    );
  }

  return null;
};

export default VerificationStatusPanel;
