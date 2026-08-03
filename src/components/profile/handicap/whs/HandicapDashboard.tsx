import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHandicapTrend, useCounters } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { WhsConnection } from '@/lib/whs/types';
import { getSyncHealth } from '@/lib/whs/syncHealth';

import TodayView from './views/TodayView';
import TrendsView from './views/TrendsView';
import CircleView from './views/CircleView';

import WhsConnectionCaption from './sections/WhsConnectionCaption';
import { resolveHandicapSubtab, type HandicapSubtab } from './types';

interface Props {
  connection: WhsConnection;
  userId: string;
  /**
   * Read-only mode — when true, hides Sync now, Disconnect, the re-auth/stale
   * banners, and the invite affordances on the Friends tab. Used when
   * viewing a friend's handicap via /handicap/:userId.
   */
  readOnly?: boolean;
  /** First name of the profile owner — threaded to TodayView for name-prefixed friend-view copy. */
  ownerFirstName?: string | null;
}

const DEFAULT_SUBTAB: HandicapSubtab = 'today';

export const HandicapDashboard: React.FC<Props> = ({ connection, userId, readOnly = false, ownerFirstName = null }) => {
  const [searchParams] = useSearchParams();
  // Single source of truth - see src/lib/whs/syncHealth.ts. Status only.
  const [syncHealth] = useState(() => getSyncHealth(connection));
  const reauthRequired = syncHealth.kind === 'reauth_auth';


  // ── URL-state for the active subtab (legacy values aliased) ─────────────
  const rawSubtab = searchParams.get('subtab');
  const activeSubtab: HandicapSubtab = resolveHandicapSubtab(rawSubtab).subtab;


  // ── Trend (used by hero + passed to views as currentHandicap) ───────────
  const { data: trend } = useHandicapTrend(connection.id);
  const currentHandicap = trend?.current ?? null;

  // ── handicap_viewed: one emit per (tab, read_only) view. Fire-and-forget. ─
  const { data: counters } = useCounters(connection.id);
  const roundsCounting = counters?.length ?? null;
  const viewedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${activeSubtab}:${readOnly ? 1 : 0}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    analyticsEvents.track('handicap_viewed', {
      tab: activeSubtab,
      read_only: readOnly,
      index: currentHandicap,
      rounds_counting: roundsCounting,
    });
  }, [activeSubtab, readOnly, currentHandicap, roundsCounting]);

  const showReauthBanner = !readOnly && reauthRequired;

  return (
    <div className="pb-10">
      {/* SWAPPABLE — active view */}
      <div key={activeSubtab} className="anim-fadeSlide">
        {activeSubtab === 'today' && (
          <TodayView
            connection={connection}
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            connectionCreatedAt={connection.created_at}
            readOnly={readOnly}
            showReauthBanner={showReauthBanner}
            ownerFirstName={ownerFirstName}
          />
        )}
        {activeSubtab === 'form' && (
          <TrendsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            readOnly={readOnly}
            ownerFirstName={ownerFirstName}
          />
        )}
        {activeSubtab === 'circle' && (
          <CircleView userId={userId} readOnly={readOnly} ownerFirstName={ownerFirstName} />
        )}

      </div>

      {!readOnly && (
        <WhsConnectionCaption membershipNumber={connection.membership_number} />
      )}

      

      <style>{`
        @keyframes handicapViewFadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fadeSlide {
          animation: handicapViewFadeSlide 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
      `}</style>
    </div>
  );
};

export default HandicapDashboard;
