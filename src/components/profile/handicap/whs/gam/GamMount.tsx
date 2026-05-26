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
  ownerFirstName?: string | null;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, ownerFirstName, readOnly }) => {
  return (
    <>
      <TrophyRoomSheet userId={ownerUserId} viewerUserId={viewerUserId} ownerFirstName={ownerFirstName ?? null} />
      {!readOnly && <NotificationsSheet userId={ownerUserId} />}
    </>
  );
};

export default GamMount;
