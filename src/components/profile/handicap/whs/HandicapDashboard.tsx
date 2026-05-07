import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { callSyncWhsOne } from '@/lib/whs/api';
import { useHandicapTrend, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import TodayView from './views/TodayView';
import TrendsView from './views/TrendsView';
import FriendsView from './views/FriendsView';
import TrophiesSheetMount from './sections/TrophiesSheetMount';
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncedAtForInit = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isOldEnoughForReauth =
    !lastSyncedAtForInit ||
    Date.now() - lastSyncedAtForInit.getTime() > 48 * 3600_000;
  const [reauthRequired, setReauthRequired] = useState(
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

  // ── Sync handler ────────────────────────────────────────────────────────
  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const data = await callSyncWhsOne();
      if (!data.ok) {
        if (data.error === 'credentials_invalid') {
          setReauthRequired(true);
          toast.error('Your England Golf password changed. Please disconnect and reconnect.');
          return;
        }
        toast.error(data.message ?? "Couldn't sync right now. Try again later.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: whsKeys.connection(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.trend(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.lastRound(connection.id) });
      queryClient.invalidateQueries({ queryKey: ['whs-round-detail'] });
      queryClient.invalidateQueries({ queryKey: whsKeys.counters(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.allScores(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendLeaderboard(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendWindowRankings(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendsActivity(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendCourseBests(userId) });
      if (data.handicap_changed && typeof data.handicap_index === 'number') {
        toast.success(`Handicap updated to ${data.handicap_index.toFixed(1)}!`);
      } else {
        toast.success('Refreshed — no changes');
      }
    } catch {
      toast.error("Couldn't reach clbhouz. Check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Sync state ──────────────────────────────────────────────────────────
  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const hoursSinceSync = lastSyncedAt
    ? (Date.now() - lastSyncedAt.getTime()) / 3600_000
    : Infinity;

  // Banner priority: re-auth (only after 48h) > stale (after 24h) > nothing
  const showReauthBanner = !readOnly && reauthRequired;
  const showStaleBanner = !readOnly && !showReauthBanner && hoursSinceSync > 24;

  return (
    <div className="pb-10">
      {/* SWAPPABLE — active view */}
      <div key={activeSubtab} className="anim-fadeSlide pt-5">
        {activeSubtab === 'today' && (
          <TodayView
            connection={connection}
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            connectionCreatedAt={connection.created_at}
            readOnly={readOnly}
            showReauthBanner={showReauthBanner}
            showStaleBanner={showStaleBanner}
            lastSyncedAt={lastSyncedAt}
            isSyncing={isSyncing}
            onSyncNow={handleSyncNow}
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
