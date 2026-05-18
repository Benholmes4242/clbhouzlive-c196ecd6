/**
 * Central mount for gam_* full-screen sheets driven by the event bus
 * (see events.ts). Place once near the top of HandicapPage.
 *
 * Note: StreaksSheet has moved to `../../gam/streaks/StreaksSheetMount`
 * and is mounted from `TodayView` (owner-only).
 *
 * Note: The launch/welcome sheet has moved to
 * `../../gam/launch/LaunchSheetMount` (server-tracked via
 * `user_profiles.gam_launch_seen_at`) and is mounted from `TodayView`.
 * The legacy localStorage-keyed `LaunchSheet` here was removed to
 * prevent a double-welcome collision on launch day.
 */
import React from 'react';
import NotificationsSheet from './NotificationsSheet';
import GamAchievementsSheet from './GamAchievementsSheet';

interface Props {
  ownerUserId: string;
  viewerUserId?: string;
  readOnly?: boolean;
}

const GamMount: React.FC<Props> = ({ ownerUserId, viewerUserId, readOnly }) => {
  return (
    <>
      <GamAchievementsSheet userId={ownerUserId} viewerUserId={viewerUserId} />
      {!readOnly && <NotificationsSheet userId={ownerUserId} />}
    </>
  );
};

export default GamMount;
