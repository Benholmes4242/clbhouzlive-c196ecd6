import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHandicapTrend } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import TodayView from './views/TodayView';
import TrendsView from './views/TrendsView';
import RecordsView from './views/RecordsView';
import FriendsView from './views/FriendsView';
import LegendsView from './views/LegendsView';

import WhsConnectionCaption from './sections/WhsConnectionCaption';
import { isHandicapSubtab, type HandicapSubtab } from './types';

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
  const lastSyncedAtForInit = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isOldEnoughForReauth =
    !lastSyncedAtForInit ||
    Date.now() - lastSyncedAtForInit.getTime() > 48 * 3600_000;
  const [reauthRequired] = useState(
    connection.last_sync_status === 'auth_failed' && isOldEnoughForReauth
  );

  // ── URL-state for the active subtab ─────────────────────────────────────
  const rawSubtab = searchParams.get('subtab');
  const activeSubtab: HandicapSubtab = isHandicapSubtab(rawSubtab)
    ? rawSubtab
    : DEFAULT_SUBTAB;

  // ── Trend (used by hero + passed to views as currentHandicap) ───────────
  const { data: trend } = useHandicapTrend(connection.id);
  const currentHandicap = trend?.current ?? null;

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
        {activeSubtab === 'trends' && (
          <TrendsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            readOnly={readOnly}
            ownerFirstName={ownerFirstName}
          />
        )}
        {activeSubtab === 'records' && (
          <RecordsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            readOnly={readOnly}
            ownerFirstName={ownerFirstName}
          />
        )}
        {activeSubtab === 'friends' && (
          <FriendsView
            userId={userId}
            currentHandicap={currentHandicap}
            connectionId={connection.id}
            readOnly={readOnly}
          />
        )}
        {activeSubtab === 'legends' && (
          <LegendsView userId={userId} readOnly={readOnly} ownerFirstName={ownerFirstName} />
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
