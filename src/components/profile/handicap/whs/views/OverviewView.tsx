import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { WhsConnection } from '@/lib/whs/types';
import MorningMoment from '@/components/handicap/MorningMoment';
import HeroHandicapCard from '../sections/HeroHandicapCard';
import AchievementsStrip from '../sections/AchievementsStrip';
import LastRoundCard from '../sections/LastRoundCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';

interface Props {
  connection: WhsConnection;
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  connectionCreatedAt: string;
  /** When true, hides personal-only sections (Echo Insights, Today, footer, banners). */
  readOnly?: boolean;
  showReauthBanner?: boolean;
  showStaleBanner?: boolean;
  lastSyncedAt?: Date | null;
  isSyncing?: boolean;
  onSyncNow?: () => void;
}

export const OverviewView: React.FC<Props> = ({
  connection,
  connectionId,
  userId,
  currentHandicap,
  connectionCreatedAt,
  readOnly = false,
  showReauthBanner = false,
  showStaleBanner = false,
  lastSyncedAt = null,
  isSyncing = false,
  onSyncNow,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-overview"
      aria-labelledby="handicap-tab-overview"
    >
      {/* Today section — viewer's daily context, hidden on friend pages */}
      {!readOnly && <MorningMoment userId={userId} />}

      {/* Sync state banners (re-auth takes priority over stale) */}
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

      {/* Hero handicap ring + line chart */}
      <HeroHandicapCard connection={connection} userId={userId} />

      {/* Existing overview cards */}
      <LastRoundCard connectionId={connectionId} />
      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />
      {/* Echo Insights is an AI read of *your* game — hide on friend pages. */}
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
      <AchievementsStrip
        connectionId={connectionId}
        connectionCreatedAt={connectionCreatedAt}
      />

      {/* Sync footer — hidden in read-only mode */}
      {!readOnly && (
        <div className="px-5 pt-2 flex flex-col items-center gap-3">
          <p className="text-[12px] text-muted-foreground">
            {lastSyncedAt
              ? `Last refreshed ${formatDistanceToNow(lastSyncedAt, { addSuffix: true })}`
              : 'Not yet synced'}
          </p>
          <button
            onClick={onSyncNow}
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
      )}

      {/* Refresh frequency caption */}
      {!readOnly && lastSyncedAt && (
        <p
          className="text-center text-[11px] mx-5 mt-6 mb-2"
          style={{ color: 'rgba(15,23,42,0.40)' }}
        >
          Handicap refreshes daily ·{' '}
          {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
        </p>
      )}
    </div>
  );
};

export default OverviewView;
