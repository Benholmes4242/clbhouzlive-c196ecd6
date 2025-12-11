import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, Star, MessageCircle, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

          {/* Title with step indicator */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-sq-pill">
              Step 1 of 2
            </span>
          </div>
          <h1 className="text-xl font-semibold text-center mt-1">
            Create business profile
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 pt-3">
        {/* Section 1 – Hero / benefits - Modern dark card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="py-3"
        >
          <div className="rounded-[18px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-5 border border-slate-700/50 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-amber-500/15 border border-amber-500/20">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-[17px] font-semibold text-white">
                  Give your business a home on Clbhouz
                </h2>
                <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                  Connect with golfers, collect trusted reviews, and grow your presence on the world's fastest-growing golf platform.
                </p>

                {/* Benefit pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 border border-emerald-500/20">
                    <Users className="h-3.5 w-3.5" /> Attract golfers
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 border border-amber-500/20">
                    <Star className="h-3.5 w-3.5" /> Collect reviews
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-sq-pill bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 border border-sky-500/20">
                    <MessageCircle className="h-3.5 w-3.5" /> Enable follows
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
          className="mt-2 rounded-[18px] bg-background px-5 py-5 border border-border/50"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Who is this for?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a profile for any golf business you represent:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                  Golf clubs & resorts
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                  Academies & coaches
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                  Retail shops & online stores
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary/60" />
                  Brands, societies, and events
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">What you'll need</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Have these ready for the best start:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Official business name
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Website or booking link
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Location (city & country)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Contact email or phone
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Request a verified badge once your profile is live.
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
            className="inline-flex h-11 flex-[1.5] items-center justify-center rounded-full bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-[0.99] transition-all"
          >
            Continue to business setup
          </button>
        </div>
      </footer>
    </PageRoot>
  );
};

export default BusinessIntroPage;
