import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Megaphone, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
          <h1 className="text-2xl text-foreground mb-2" style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
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
          <div className="rounded-2xl p-4" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
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
          <h2 className="text-sm text-foreground mb-4" style={{ fontWeight: 900 }}>What you can do next</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/create-post', { state: { businessId, asBusinessId: businessId } })}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)' }}>
                <Megaphone className="h-5 w-5" style={{ color: '#F7931E' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Post as your business</p>
                <p className="text-xs text-muted-foreground">Share updates, photos, and moments with golfers.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#94A3B8' }} />
            </button>
            
            <button
              onClick={() => navigate(`/business/${slug || businessId}/verification/about`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)' }}>
                <CheckCircle2 className="h-5 w-5" style={{ color: '#F7931E' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Request verification</p>
                <p className="text-xs text-muted-foreground">Get a verified badge to build trust with golfers.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#94A3B8' }} />
            </button>
            
            <button
              onClick={() => navigate(`/business/${slug || businessId}/insights`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)' }}>
                <BarChart3 className="h-5 w-5" style={{ color: '#F7931E' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Track your reach</p>
                <p className="text-xs text-muted-foreground">See profile views and engagement in Business Insights.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: '#94A3B8' }} />
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
            className="w-full h-12 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ background: '#0F172A' }}
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
