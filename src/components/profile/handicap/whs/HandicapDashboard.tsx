import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHandicapTrend } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import TodayView from './views/TodayView';
import TrendsView from './views/TrendsView';
import RecordsView from './views/RecordsView';
import FriendsView from './views/FriendsView';
import TrophiesSheetMount from './sections/TrophiesSheetMount';
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
}

const DEFAULT_SUBTAB: HandicapSubtab = 'today';

export const HandicapDashboard: React.FC<Props> = ({ connection, userId, readOnly = false }) => {
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
      <div key={activeSubtab} className="anim-fadeSlide pt-2">
        {activeSubtab === 'today' && (
          <TodayView
            connection={connection}
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            connectionCreatedAt={connection.created_at}
            readOnly={readOnly}
            showReauthBanner={showReauthBanner}
          />
        )}
        {activeSubtab === 'trends' && (
          <TrendsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            readOnly={readOnly}
          />
        )}
        {activeSubtab === 'records' && (
          <RecordsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            readOnly={readOnly}
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
      </div>

      {!readOnly && (
        <WhsConnectionCaption membershipNumber={connection.membership_number} />
      )}

      {!readOnly && (
        <TrophiesSheetMount
          connectionId={connection.id}
          connectionCreatedAt={connection.created_at}
          userId={userId}
        />
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
