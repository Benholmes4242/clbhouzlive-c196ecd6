import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { WhsConnection } from '@/lib/whs/types';
import MorningMoment from '@/components/handicap/MorningMoment';
import HeroHandicapCard from '../sections/HeroHandicapCard';
import AchievementsStrip from '../sections/AchievementsStrip';
import LastRoundCard from '../sections/LastRoundCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';
import StreaksSection from '../sections/StreaksSection';
import WhereYouStandSection from '../sections/WhereYouStandSection';
import { useUserProfile } from '@/hooks/useUserProfile';

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
      <HeroHandicapCard connection={connection} />

      {/* Streaks — personal, hidden on friend pages */}
      {!readOnly && <StreaksSection connectionId={connectionId} userId={userId} />}

      {/* Existing overview cards */}
      <LastRoundCard connectionId={connectionId} />
      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />
      {/* Echo Insights is an AI read of *your* game — hide on friend pages. */}
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
      <AchievementsStrip
        connectionId={connectionId}
        connectionCreatedAt={connectionCreatedAt}
        userId={userId}
      />

      {/* Sync footer — single line, hidden in read-only mode */}
      {!readOnly && (
        <div
          style={{
            padding: '40px 20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12.5,
            color: 'rgba(15,23,42,0.55)',
            fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <RefreshCw
            size={13}
            color="rgba(15,23,42,0.55)"
            className={isSyncing ? 'animate-spin' : ''}
          />
          <span>
            {lastSyncedAt
              ? `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: false })} ago`
              : 'Not yet synced'}
          </span>
          <span style={{ color: 'rgba(15,23,42,0.40)' }}>·</span>
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            style={{
              background: 'none',
              border: 'none',
              color: '#F7931E',
              fontWeight: 700,
              fontSize: 12.5,
              padding: 0,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.5 : 1,
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OverviewView;
