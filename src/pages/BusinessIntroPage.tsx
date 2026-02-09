import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';

/**
 * Screen 2: "Create business profile" (Step 1 of 2)
 * Calmer, less "marketing panel", more reassurance and momentum
 */
const BusinessIntroPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseSession();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleBack = () => {
    navigate('/profile');
  };

  const handleContinue = () => {
    navigate('/business/create');
  };

  if (loading) {
    return null;
  }

  return (
    <PageRoot className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
          {/* Back link - slate color */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to profile</span>
          </button>

          {/* Getting started label */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground/70">
              Getting started
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-center mt-1 text-foreground">
            Tell us about your business
          </h1>
          
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center mt-1">
            This helps golfers understand who you are and what you offer. You can edit everything later.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 pt-4">
        
        {/* "Why this matters" strip - flat, subtle, no card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-4"
        >
          <p className="text-sm font-semibold text-foreground">Why this matters</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Your business profile helps golfers discover, trust, and follow your brand, even if they've never heard of you before.
          </p>
        </motion.section>

        {/* "Who can create" section */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="py-4"
        >
          <h3 className="text-sm font-semibold text-foreground">Who can create a business profile?</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              Golf clubs & resorts
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              Coaches & academies
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              Retail & online golf stores
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              Brands, events, and golf organisations
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              Content creators & influencers
            </li>
          </ul>
        </motion.section>

        {/* "What you'll need" section */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="py-4"
        >
          <h3 className="text-sm font-semibold text-foreground">What you'll need</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Have these ready - it usually takes less than 2 minutes.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              Official business name
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              Website
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              Location (city & country)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              Contact email or phone
            </li>
          </ul>
        </motion.section>

        {/* CTA buttons — inline, right after content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3 pt-6 pb-8"
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2.5"
          >
            Not now
          </button>
          <Button
            onClick={handleContinue}
            className="flex-[1.5] h-11 bg-[#334E3D] hover:bg-[#334E3D]/90 text-white rounded-full font-semibold"
          >
            Continue to business details
          </Button>
        </motion.div>
      </main>
    </PageRoot>
  );
};

export default BusinessIntroPage;
