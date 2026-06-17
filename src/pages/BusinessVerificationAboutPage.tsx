import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, BadgeCheck, Shield, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const BusinessVerificationAboutPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useHideBottomNav();
  useHideHeader();

  const handleContinue = () => {
    navigate(`/business/${id}/verification/request`);
  };

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
            <h1 className="text-[16px] font-semibold text-foreground">Verified Business</h1>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Get verified on clbhouz
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Verification helps golfers know your business is authentic and trusted.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground">Why get verified?</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-muted flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Build trust</p>
                <p className="text-xs text-muted-foreground">
                  A verified badge shows golfers your business is legitimate.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-muted flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Stand out</p>
                <p className="text-xs text-muted-foreground">
                  Verified businesses are more visible to golfers searching for services.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-sq-sm bg-muted flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Professional presence</p>
                <p className="text-xs text-muted-foreground">
                  Join other verified clubs, coaches, and brands on clbhouz.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">How it works</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">1.</span>
              <span>Submit a verification request with your business details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">2.</span>
              <span>We review your request (usually within a few days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">3.</span>
              <span>Approved profiles receive a verified badge</span>
            </li>
          </ol>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] text-muted-foreground/70 text-center mb-8"
        >
          Verification is optional and not required to use clbhouz.
        </motion.p>
      </main>

      {/* Footer CTAs */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-background/95 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Not now
          </button>
          <Button
            variant="secondary"
            onClick={handleContinue}
            className="flex-[1.5] h-11"
          >
            Continue
          </Button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessVerificationAboutPage;