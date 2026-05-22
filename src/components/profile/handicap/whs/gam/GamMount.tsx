/**
 * Central mount for gam_* full-screen sheets driven by the event bus.
 * The Trophy Room sheet replaces the old GamAchievementsSheet AND
 * the standalone LegendStatusSheet — both card sections (achievements
 * + legends) now live under one roof.
 */
import React from 'react';
import NotificationsSheet from './NotificationsSheet';
import { TrophyRoomSheet } from './trophy-room/TrophyRoomSheet';

interface Props {
  ownerUserId: string;
  viewerUserId?: string;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, readOnly }) => {
  return (
    <>
      <TrophyRoomSheet userId={ownerUserId} viewerUserId={viewerUserId} />
      {!readOnly && <NotificationsSheet userId={ownerUserId} />}
    </>
  );
};

export default GamMount;
