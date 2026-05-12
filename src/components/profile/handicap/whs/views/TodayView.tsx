import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WhsConnection } from '@/lib/whs/types';
import MorningMoment from '@/components/handicap/MorningMoment';
import HeroHandicapCard from '../sections/HeroHandicapCard';
import LastRoundCard from '../sections/LastRoundCard';
import StreaksSection from '../sections/StreaksSection';
import SinceLastVisitRail from '../sections/since-last-visit/SinceLastVisitRail';
import WhsConnectionCaption from '../sections/WhsConnectionCaption';

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
  currentHandicap: _currentHandicap,
  connectionCreatedAt: _connectionCreatedAt,
  readOnly = false,
  showReauthBanner = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-today"
      aria-labelledby="handicap-tab-today"
    >
      {!readOnly && <MorningMoment userId={userId} />}

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

      <HeroHandicapCard connection={connection} />

      <LastRoundCard connectionId={connectionId} />

      {!readOnly && <StreaksSection connectionId={connectionId} userId={userId} />}

      {!readOnly && <SinceLastVisitRail userId={userId} />}

      {!readOnly && <WhsConnectionCaption membershipNumber={connection.membership_number} />}
    </div>
  );
};

export default TodayView;
