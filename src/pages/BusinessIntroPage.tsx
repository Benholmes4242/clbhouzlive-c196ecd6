import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, Star, MessageCircle, Globe2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';

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
    <PageRoot className="flex min-h-screen flex-col bg-muted/40">
      {/* Top header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-3">
          {/* Back link */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to profile</span>
          </button>

          {/* Title */}
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center">Business profiles</p>
          <h1 className="text-xl font-semibold text-center mt-0.5">
            Set up your golf club, academy, or brand
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-28 pt-4">
        {/* Section 1 – Hero / benefits */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-4"
        >
          <div className="rounded-sq-lg bg-gradient-to-br from-amber-50 to-emerald-50 px-4 py-5 border border-amber-100/60">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-sq-md bg-amber-500/10">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  Give your business a home on Clbhouz
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Appear in search and the directory, collect reviews, and connect with golfers
                  who love your course, academy, or brand.
                </p>

                {/* Benefit pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                    <Users className="h-3.5 w-3.5" /> Attract more golfers
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-100">
                    <Star className="h-3.5 w-3.5" /> Collect trusted reviews
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-white/80 px-3 py-1.5 text-xs font-medium text-sky-700 border border-sky-100">
                    <MessageCircle className="h-3.5 w-3.5" /> Enable messages & follows
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 2 – Who is this for / What you need */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-2 rounded-sq-lg bg-background px-4 py-5 border border-border/50"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Who is this for?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a profile for any golf-related business you officially represent:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  Golf clubs & resorts
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  Academies & coaches
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  Retail shops & online stores
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  Brands, societies, and events
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">What you'll need</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                You can always update details later. For the best start, have:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                  Official business name
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                  Website or booking link
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                  Location (city & country)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
                  Contact email or phone number
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/50">
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              You can request a verified badge once your business profile is live.
            </p>
          </div>
        </motion.section>
      </main>

      {/* Sticky footer */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex h-10 flex-[1.5] items-center justify-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-[0.99] transition-all"
          >
            Continue to business setup
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessIntroPage;
