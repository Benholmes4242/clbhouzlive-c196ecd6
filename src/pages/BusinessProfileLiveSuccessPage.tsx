import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Megaphone, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
/* NO PRIVATE PALETTE - this page had no constants at all, only inline light
   literals, which is the same blind spot from the other direction. */
import { CARD_BG, HAIR } from '@/components/manage/ui';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { BIZ } from '@/components/business/businessTokens';

interface LocationState {
  businessId: string;
  businessName: string;
  category: string;
  location: string;
  avatarUrl?: string;
  slug?: string;
}

const BusinessProfileLiveSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  if (!state?.businessId) {
    navigate('/businesses/manage', { replace: true });
    return null;
  }

  const { businessId, businessName, category, location: businessLocation, avatarUrl, slug } = state;

  const initials = businessName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BZ';

  const handleViewProfile = () => {
    if (slug) {
      navigate(`/business/${slug}`);
    } else if (businessId) {
      navigate(`/business/${businessId}`);
    } else {
      navigate('/businesses/manage');
    }
  };

  const handleGoToDashboard = () => {
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
          <h1 className="text-2xl text-foreground mb-2" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Your business profile is live 🎉
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
          <div className="rounded-2xl p-4" style={{ background: CARD_BG, border: `1px solid ${HAIR}` }}>
            <div className="flex items-center gap-3">
              <SquircleAvatar
                size={56}
                src={avatarUrl}
                alt={businessName}
                fallback={initials}
                hairlineRing
                ringColor={DARK_HAIRLINE}
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
          <h2 className="text-sm text-foreground mb-4" style={{ fontWeight: 700 }}>What you can do next</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/create-post', { state: { businessId, asBusinessId: businessId } })}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}` }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
                <Megaphone className="h-5 w-5" style={{ color: A.AMBER }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Post as your business</p>
                <p className="text-xs text-muted-foreground">Share updates, photos, and moments with golfers.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: A.MUTE }} />
            </button>
            
            <button
              onClick={() => navigate(`/business/${slug || businessId}/verification`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}` }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: A.AMBER }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Request verification</p>
                <p className="text-xs text-muted-foreground">Get a verified badge to build trust with golfers.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: A.MUTE }} />
            </button>
            
            <button
              onClick={() => navigate(`/business/${slug || businessId}/insights`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: CARD_BG, border: `1px solid ${HAIR}` }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BIZ.amberTint, border: `1px solid ${BIZ.amberHair}` }}>
                <BarChart3 className="h-5 w-5" style={{ color: A.AMBER }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Track your reach</p>
                <p className="text-xs text-muted-foreground">See profile views and engagement in Business Insights.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: A.MUTE }} />
            </button>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm space-y-3"
        >
          <button
            onClick={handleViewProfile}
            className="w-full h-12 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ background: A.INK, color: A.CANVAS }}
          >
            View business profile
            <ArrowRight className="h-4 w-4" />
          </button>
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
