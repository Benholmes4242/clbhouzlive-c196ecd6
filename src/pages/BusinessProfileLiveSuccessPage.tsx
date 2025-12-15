import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Megaphone, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface LocationState {
  businessId: string;
  businessName: string;
  category: string;
  location: string;
  avatarUrl?: string;
  username?: string;
}

const BusinessProfileLiveSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  // If no state, redirect to manage page
  if (!state?.businessId) {
    navigate('/business/manage', { replace: true });
    return null;
  }

  const { businessId, businessName, category, location: businessLocation, avatarUrl, username } = state;

  const initials = businessName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BZ';

  const handleViewProfile = () => {
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      navigate('/business/manage');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/business/manage');
  };

  return (
    <PageRoot className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-8"
        >
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your business profile is live
          </h1>
          <p className="text-muted-foreground">
            Golfers can now discover and follow your business on clbhouz.
          </p>
        </motion.div>

        {/* Mini profile preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm mb-10"
        >
          <div className="bg-muted/30 border border-border/50 rounded-sq-lg p-4">
            <div className="flex items-center gap-3">
              <SquircleAvatar
                size={56}
                src={avatarUrl}
                alt={businessName}
                fallback={initials}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{businessName}</p>
                <p className="text-sm text-muted-foreground truncate">{category}</p>
                {businessLocation && (
                  <p className="text-xs text-muted-foreground/70 truncate">{businessLocation}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* What you can do next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm mb-10"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">What you can do next</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-slate-100 flex items-center justify-center shrink-0">
                <Megaphone className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Post as your business</p>
                <p className="text-xs text-muted-foreground">Share updates, photos, and moments with golfers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-slate-100 flex items-center justify-center shrink-0">
                <VerifiedBadge size="sm" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Request verification</p>
                <p className="text-xs text-muted-foreground">Get a verified badge to build trust with golfers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-slate-100 flex items-center justify-center shrink-0">
                <BarChart3 className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Track your reach</p>
                <p className="text-xs text-muted-foreground">See profile views and engagement in Business Insights.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm space-y-3"
        >
          <Button
            variant="secondary"
            onClick={handleViewProfile}
            className="w-full h-11 gap-2"
          >
            View business profile
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={handleGoToDashboard}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Go to dashboard
          </button>
        </motion.div>
      </main>
    </PageRoot>
  );
};

export default BusinessProfileLiveSuccessPage;
