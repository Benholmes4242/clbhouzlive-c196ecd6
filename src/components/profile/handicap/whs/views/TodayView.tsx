import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WhsConnection } from '@/lib/whs/types';
import HeroHandicapCardDark from '../sections/HeroHandicapCardDark';
import TodayGreeting from '../sections/TodayGreeting';
import LastRoundCard from '../sections/LastRoundCard';
import NextRoundWatch from '../sections/NextRoundWatch';
import Pattern14Card from '../sections/Pattern14Card';
import IndexHistoryCard from '../sections/IndexHistoryCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import StreaksSection from '../sections/StreaksSection';
import SinceLastVisitRail from '../sections/since-last-visit/SinceLastVisitRail';
import MorningMoment from '@/components/handicap/MorningMoment';

interface Props {
  connection: WhsConnection;
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  connectionCreatedAt: string;
  /** When true, hides personal-only sections (Streaks, Where You Stand, Since Last Visit, Echo Insights, footer, banners). */
  readOnly?: boolean;
  showReauthBanner?: boolean;
}

export const TodayView: React.FC<Props> = ({
  connection,
  connectionId,
  userId,
  currentHandicap,
  connectionCreatedAt: _connectionCreatedAt,
  readOnly = false,
  showReauthBanner = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-today"
      aria-labelledby="handicap-tab-today"
      style={{ paddingTop: 0 }}
    >
      {showReauthBanner && (
        <div
          className="mx-5 mt-5 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(220,38,38,0.06)', color: '#B91C1C' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your stored handicap-provider credentials no longer work. We can't refresh your data. Please
            disconnect and reconnect.
          </p>
        </div>
      )}

      <div
        style={{
          background: 'var(--hcp-bg-0)',
          borderBottom: '1px solid var(--hcp-line)',
        }}
      >
        {!readOnly && <TodayGreeting connectionId={connectionId} userId={userId} />}
        <HeroHandicapCardDark connection={connection} />
      </div>

      {!readOnly && <MorningMoment userId={userId} />}

      <NextRoundWatch connectionId={connectionId} currentHandicap={currentHandicap} />

      <Pattern14Card connectionId={connectionId} />

      <IndexHistoryCard connectionId={connectionId} />

      <LastRoundCard connectionId={connectionId} userId={userId} />

      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />

      {!readOnly && <StreaksSection connectionId={connectionId} userId={userId} />}

      {!readOnly && <SinceLastVisitRail userId={userId} />}
    </div>
  );
};

export default TodayView;
