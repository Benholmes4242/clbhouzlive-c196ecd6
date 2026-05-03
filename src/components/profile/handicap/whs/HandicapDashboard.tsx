import React, { useCallback, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { callSyncWhsOne } from '@/lib/whs/api';
import { useHandicapTrend, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import HeroHandicapCard from './sections/HeroHandicapCard';
import HandicapTabsNav from './HandicapTabsNav';
import OverviewView from './views/OverviewView';
import TrendsView from './views/TrendsView';
import FriendsView from './views/FriendsView';
import { isHandicapSubtab, type HandicapSubtab } from './types';

interface Props {
  connection: WhsConnection;
  userId: string;
}

const DEFAULT_SUBTAB: HandicapSubtab = 'overview';

export const HandicapDashboard: React.FC<Props> = ({ connection, userId }) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const handleSubtabChange = useCallback(
    (next: HandicapSubtab) => {
      const params = new URLSearchParams(searchParams);
      params.set('subtab', next);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

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
      queryClient.invalidateQueries({ queryKey: whsKeys.lastRoundDetail(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.counters(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.recent(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.allScores(connection.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendsLeaderboard(userId) });
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
  const showReauthBanner = reauthRequired;
  const showStaleBanner = !showReauthBanner && hoursSinceSync > 24;

  return (
    <div className="pb-10">
      {/* PERSISTENT — warnings (re-auth takes priority over stale) */}
      {showReauthBanner ? (
        <div
          className="mx-5 mt-5 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#B91C1C' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your stored England Golf password no longer works. We can't refresh your data. Please
            disconnect and reconnect.
          </p>
        </div>
      ) : showStaleBanner && lastSyncedAt ? (
        <div
          className="mx-5 mt-5 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(247,147,30,0.08)', color: '#9A6116' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your handicap data hasn't refreshed in{' '}
            {formatDistanceToNow(lastSyncedAt, { addSuffix: false })}. Tap "Sync now" to refresh.
          </p>
        </div>
      ) : null}

      {/* PERSISTENT — hero, always visible */}
      <HeroHandicapCard connection={connection} />

      

      {/* PERSISTENT — sticky sub-tabs */}
      <HandicapTabsNav active={activeSubtab} onChange={handleSubtabChange} />

      {/* SWAPPABLE — active view */}
      <div key={activeSubtab} className="anim-fadeSlide pt-5">
        {activeSubtab === 'overview' && (
          <OverviewView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
            connectionCreatedAt={connection.created_at}
          />
        )}
        {activeSubtab === 'trends' && (
          <TrendsView
            connectionId={connection.id}
            userId={userId}
            currentHandicap={currentHandicap}
          />
        )}
        {activeSubtab === 'friends' && (
          <FriendsView userId={userId} currentHandicap={currentHandicap} connectionId={connection.id} />
        )}
      </div>

      {/* PERSISTENT — footer */}
      <div className="px-5 pt-2 flex flex-col items-center gap-3">
        <p className="text-[12px] text-muted-foreground">
          {lastSyncedAt
            ? `Last refreshed ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`
            : 'Not yet synced'}
        </p>
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold disabled:opacity-50"
          style={{ color: '#F7931E' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </button>
        <button
          onClick={() =>
            toast(
              'Disconnect coming soon — get in touch via support if you need to disconnect now.'
            )
          }
          className="text-[12px] text-muted-foreground mt-2"
        >
          Disconnect England Golf
        </button>
      </div>

      {lastSyncedAt && (
        <p
          className="text-center text-[11px] mx-5 mt-6 mb-2"
          style={{ color: 'rgba(15,23,42,0.40)' }}
        >
          Handicap refreshes daily ·{' '}
          {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
        </p>
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
