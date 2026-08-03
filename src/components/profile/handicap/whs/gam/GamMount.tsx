/**
 * Central mount for gam_* full-screen sheets driven by the event bus.
 * CareerRecordSheet replaces TrophyRoomSheet: same event bus, same entry
 * points, a record rather than a trophy cabinet.
 */
import React from 'react';
import NotificationsSheet from './NotificationsSheet';
import { CareerRecordSheet } from './trophy-room/career/CareerRecordSheet';

interface Props {
  ownerUserId: string;
  viewerUserId?: string;
  ownerFirstName?: string | null;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, ownerFirstName, readOnly }) => {
  return (
    <>
      <CareerRecordSheet userId={ownerUserId} viewerUserId={viewerUserId} ownerFirstName={ownerFirstName ?? null} />

      {!readOnly && <NotificationsSheet userId={ownerUserId} />}
    </>
  );
};

export default GamMount;
