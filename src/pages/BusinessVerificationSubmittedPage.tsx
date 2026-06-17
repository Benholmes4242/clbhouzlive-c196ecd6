import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const BusinessVerificationSubmittedPage = () => {
  const navigate = useNavigate();

  useHideBottomNav();
  useHideHeader();

  const handleDone = () => {
    // Navigate back to business profile or manage page
    navigate('/businesses/manage');
  };

  return (
    <PageRoot className="min-h-screen bg-background flex flex-col md:!max-w-[440px]">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-8"
        >
          <div className="h-20 w-20 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-[hsl(38,92%,50%)] flex items-center justify-center">
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 max-w-sm"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Verification request submitted
          </h1>
          <p className="text-muted-foreground">
            We'll review your request and get back to you in-app. You can continue using clbhouz in the meantime.
          </p>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm mb-10"
        >
          <div className="bg-muted/30 border border-border/50 rounded-sq-lg p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">What happens next</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>We'll review your business details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>You'll receive a notification when we're done</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>Approved profiles get a verified badge</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <Button
            variant="secondary"
            onClick={handleDone}
            className="w-full h-11 gap-2"
          >
            Done
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </main>
    </PageRoot>
  );
};

export default BusinessVerificationSubmittedPage;