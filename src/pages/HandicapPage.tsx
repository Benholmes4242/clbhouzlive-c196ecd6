/**
 * HandicapPage — Top-level Handicap route (Phase 2 of promotion)
 *
 * Wraps the existing WhsHandicapTab in standard page chrome with a Dispatch-style
 * back header. Reached via /handicap from the ProfileHubSheet 2×2 grid.
 *
 * Gated by `isHandicapPromotedForUser`; non-promoted users get redirected to
 * their profile (where the legacy in-profile handicap tab still lives).
 */

import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isHandicapPromotedForUser } from '@/config/featureFlags';
import WhsHandicapTab from '@/components/profile/handicap/whs/WhsHandicapTab';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const BORDER = 'rgba(15,23,42,0.07)';
const BG_SURFACE = '#F8FAFC';

const HandicapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseSession();

  useEffect(() => {
    if (user?.id) {
      analyticsEvents.track?.('handicap_page_viewed', { source: 'route' });
    }
  }, [user?.id]);

  if (loading) {
    return <PageRoot><div /></PageRoot>;
  }

  if (!user?.id) {
    return <Navigate to="/auth" replace />;
  }

  if (!isHandicapPromotedForUser(user.id)) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <PageRoot style={{ background: BG_SURFACE }}>
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 pb-3"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          background: BG_SURFACE,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-2 p-2 rounded-full active:opacity-60"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: INK }} />
        </button>
        <h1
          className="text-base font-bold"
          style={{ color: INK, letterSpacing: '-0.01em' }}
        >
          Handicap
        </h1>
      </header>

      <main>
        <WhsHandicapTab userId={user.id} />
      </main>
    </PageRoot>
  );
};

export default HandicapPage;
