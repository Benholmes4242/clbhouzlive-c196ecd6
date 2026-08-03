/**
 * Central mount for gam_* full-screen sheets driven by the event bus.
 * CareerRecordSheet replaces TrophyRoomSheet: same event bus, same entry
 * points, a record rather than a trophy cabinet.
 *
 * NotificationsSheet is retired: it queried gam_* source tables directly as a
 * parallel inbox. Game events are now read from the notifications table by the
 * Activity ledger (/notificationmessages?filter=crowns), one system only.
 */
import React from 'react';
import { CareerRecordSheet } from './trophy-room/career/CareerRecordSheet';

interface Props {
  ownerUserId: string;
  viewerUserId?: string;
  ownerFirstName?: string | null;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, ownerFirstName }) => {
  return (
    <CareerRecordSheet userId={ownerUserId} viewerUserId={viewerUserId} ownerFirstName={ownerFirstName ?? null} />
  );
};

export default GamMount;
