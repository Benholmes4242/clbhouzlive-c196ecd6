/**
 * Central mount for gam_* full-screen sheets driven by the event bus
 * (see events.ts). Place once near the top of HandicapPage.
 */
import React from 'react';
import StreaksSheet from './StreaksSheet';
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
      <StreaksSheet userId={ownerUserId} />
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
