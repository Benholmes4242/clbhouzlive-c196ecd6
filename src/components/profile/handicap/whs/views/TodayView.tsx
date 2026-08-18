import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WhsConnection } from '@/lib/whs/types';
import HeroHandicapCardDark from '../sections/HeroHandicapCardDark';
import TodayGreeting from '../sections/TodayGreeting';
import AchievementsPanel from '../sections/AchievementsPanel';
import LastRoundCard from '../sections/LastRoundCard';



import NextRoundWatch from '../sections/NextRoundWatch';
import StreaksCard from '../../gam/streaks/StreaksCard';
import { LaunchSheetMount } from '../../gam/launch/LaunchSheetMount';
import { PulseSection } from '../sections/PulseSection';

interface Props {
  connection: WhsConnection;
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  connectionCreatedAt: string;
  /** When true, hides personal-only sections (e.g. banners). */
  readOnly?: boolean;
  showReauthBanner?: boolean;
  /** First name of the profile owner — used to name-prefix friend-view copy. */
  ownerFirstName?: string | null;
}

export const TodayView: React.FC<Props> = ({
  connection,
  connectionId,
  userId,
  currentHandicap,
  connectionCreatedAt: _connectionCreatedAt,
  readOnly = false,
  showReauthBanner = false,
  ownerFirstName = null,
}) => {
  const viewMode: 'owner' | 'friend' = readOnly ? 'friend' : 'owner';

  return (
    <div
      role="tabpanel"
      id="handicap-panel-today"
      aria-labelledby="handicap-tab-today"
      style={{ paddingTop: 32 }}
    >
      {showReauthBanner && (
        <div
          className="mx-4 mt-4 mb-3 p-3 rounded-xl flex gap-2.5 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444' }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="leading-snug">
            Your stored handicap-provider credentials no longer work. We can't refresh your data. Please
            disconnect and reconnect.
          </p>
        </div>
      )}

      {/* 1. Hero — greeting + handicap ring */}
      <div
        style={{
          background: 'var(--hcp-bg-0)',
        }}
      >
        {!readOnly && <TodayGreeting connectionId={connectionId} userId={userId} />}
        <HeroHandicapCardDark connection={connection} />
      </div>

      {/* 2. Achievements — one entry point: figures, action, recent unlocks */}
      <AchievementsPanel userId={userId} viewMode={viewMode} ownerFirstName={ownerFirstName} />

      {/* 3. Streaks — owner only */}
      {!readOnly && <StreaksCard userId={userId} readOnly={readOnly} />}

      {/* 4. Next round — verdict, band, explanation */}
      <NextRoundWatch connectionId={connectionId} currentHandicap={currentHandicap} />


      {/* 5. Find a player + Pulse — owner only */}
      {!readOnly && <PulseSection userId={userId} />}

      {/* 6. Last Round */}
      <LastRoundCard
        connectionId={connectionId}
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />



      {/* StreaksSheetMount now lives at page level in HandicapPage. */}
      <LaunchSheetMount userId={userId} />
    </div>
  );
};

export default TodayView;
