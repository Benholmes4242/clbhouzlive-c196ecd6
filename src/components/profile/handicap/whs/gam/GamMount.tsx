/**
 * Central mount for gam_* full-screen sheets driven by the event bus
 * (see events.ts). Place once near the top of HandicapPage.
 *
 * Note: StreaksSheet has moved to `../../gam/streaks/StreaksSheetMount`
 * and is mounted from `TodayView` (owner-only).
 */
import React from 'react';
import NotificationsSheet from './NotificationsSheet';
import GamAchievementsSheet from './GamAchievementsSheet';
import LaunchSheet from './LaunchSheet';

interface Props {
  ownerUserId: string;
  viewerUserId?: string;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, readOnly }) => {
  return (
    <>
      <GamAchievementsSheet userId={ownerUserId} viewerUserId={viewerUserId} />
      {!readOnly && (
        <>
          <NotificationsSheet userId={ownerUserId} />
          <LaunchSheet userId={ownerUserId} />
        </>
      )}
    </>
  );
};

export default GamMount;
