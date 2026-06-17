import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { format } from 'date-fns';
import { useBusinessVerificationRealtime, useVerificationNotificationsRealtime } from '@/hooks/useBusinessVerificationRealtime';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const BusinessVerificationStatusPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useSupabaseSession();

  useHideBottomNav();
  useHideHeader();

  // Enable realtime updates for instant status changes
  useBusinessVerificationRealtime(id);
  useVerificationNotificationsRealtime(user?.id);

  // Fetch business account
  const { data: business, isLoading: isLoadingBusiness, error: businessError } = useQuery({
    queryKey: ['business-account-verification-status', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, slug, is_verified, verified_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch latest verification request
  const { data: request, isLoading: isLoadingRequest, error: requestError } = useQuery({
    queryKey: ['business-verification-request-status', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('id, status, created_at, reviewed_at, admin_note')
        .eq('business_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const isLoading = isLoadingBusiness || isLoadingRequest;

  const handleViewProfile = () => {
    if (business?.slug) {
      navigate(`/business/${business.slug}`);
    } else {
      navigate('/businesses/manage');
    }
  };

  const handleUpdateDetails = () => {
    navigate(`/business/${id}/edit`);
  };

  const handleRequestAgain = () => {
    navigate(`/business/${id}/verification/about`);
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-background md:!max-w-[440px]">
        <div className="space-y-4 px-4 pt-4">
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
          <div className="h-24 bg-muted animate-pulse rounded-2xl" />
        </div>
      </PageRoot>
    );
  }

  if (businessError || requestError) {
    return (
      <PageRoot className="min-h-screen bg-background md:!max-w-[440px]">
        <div className="flex-1 flex items-center justify-center px-4 min-h-[60vh]">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load verification status.
          </p>
        </div>
      </PageRoot>
    );
  }

  const status = request?.status;
  const isVerified = business?.is_verified;
  const requestedAt = request?.created_at;
  const reviewedAt = request?.reviewed_at;
  const adminNotes = request?.admin_note;

  return (
    <PageRoot className="min-h-screen bg-background md:!max-w-[440px]">
      {/* Header */}
      <header
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
      >
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[16px] font-semibold text-foreground">Verification Status</h1>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Pending state */}
        {status === 'pending' && !isVerified && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="h-16 w-16 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-[hsl(38,92%,50%)]" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Verification pending
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              We're reviewing your request. This usually takes a few days.
            </p>
            {requestedAt && (
              <p className="text-xs text-muted-foreground/70">
                Submitted {format(new Date(requestedAt), 'MMM d, yyyy')}
              </p>
            )}
          </motion.div>
        )}

        {/* Verified state */}
        {(status === 'approved' || isVerified) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="h-16 w-16 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mx-auto mb-4">
              <VerifiedBadge size="xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Your business is verified
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your profile now shows a verified badge, helping golfers trust your business.
            </p>
            {(reviewedAt || business?.verified_at) && (
              <p className="text-xs text-muted-foreground/70 mb-8">
                Verified on {format(new Date((reviewedAt ?? business?.verified_at) as string), 'MMM d, yyyy')}
              </p>
            )}
            <Button
              variant="secondary"
              onClick={handleViewProfile}
              className="gap-2"
            >
              View profile
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Rejected state */}
        {status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Verification not approved
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              We couldn't verify your business at this time.
            </p>
            
            {adminNotes && (
              <div className="bg-muted/30 border border-border/50 rounded-sq-lg p-4 mb-6 text-left">
                <p className="text-xs font-medium text-muted-foreground mb-1">Reason</p>
                <p className="text-sm text-foreground">{adminNotes}</p>
              </div>
            )}
            
            {reviewedAt && (
              <p className="text-xs text-muted-foreground/70 mb-8">
                Reviewed on {format(new Date(reviewedAt), 'MMM d, yyyy')}
              </p>
            )}
            
            <div className="space-y-3 max-w-xs mx-auto">
              <Button
                variant="secondary"
                onClick={handleUpdateDetails}
                className="w-full"
              >
                Update details
              </Button>
              <button
                type="button"
                onClick={handleRequestAgain}
                className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
              >
                Request again
              </button>
            </div>
          </motion.div>
        )}

        {/* No request yet */}
        {!status && !isVerified && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 opacity-50">
              <VerifiedBadge size="xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Not yet verified
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              Request verification to show golfers your business is authentic.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate(`/business/${id}/verification/about`)}
            >
              Request verification
            </Button>
          </motion.div>
        )}
      </main>
    </PageRoot>
  );
};

export default BusinessVerificationStatusPage;