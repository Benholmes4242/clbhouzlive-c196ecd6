import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WhsConnection } from '@/lib/whs/types';
import HeroHandicapCardDark from '../sections/HeroHandicapCardDark';
import TodayGreeting from '../sections/TodayGreeting';
import TrophyRoomEntryRow from '../sections/TrophyRoomEntryRow';
import LastRoundCard from '../sections/LastRoundCard';
import NextRoundWatch from '../sections/NextRoundWatch';
import Pattern14Card from '../sections/Pattern14Card';


import RecentUnlocksStrip from '../gam/RecentUnlocksStrip';
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

      {/* 1. Hero — greeting + handicap ring */}
      <div
        style={{
          background: 'var(--hcp-bg-0)',
        }}
      >
        {!readOnly && <TodayGreeting connectionId={connectionId} userId={userId} />}
        <HeroHandicapCardDark connection={connection} />
        <TrophyRoomEntryRow userId={userId} viewMode={viewMode} ownerFirstName={ownerFirstName} />
      </div>


      {/* 2. Find a player + Pulse — owner only */}
      {!readOnly && <PulseSection userId={userId} />}

      {/* 3. Recent Unlocks */}
      <RecentUnlocksStrip userId={userId} readOnly={readOnly} />

      {/* 3. Next Round Watch — owner only */}
      {!readOnly && (
        <NextRoundWatch connectionId={connectionId} currentHandicap={currentHandicap} />
      )}

      {/* 4. Last Round */}
      <LastRoundCard
        connectionId={connectionId}
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 5. Last 14 Rounds */}
      <Pattern14Card connectionId={connectionId} />

      <LaunchSheetMount userId={userId} />
    </div>
  );
};

export default TodayView;
