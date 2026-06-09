import React from 'react';
import RecentRoundsCard from '../sections/trends/RecentRoundsCard';
import PersonalBests from '../sections/records/PersonalBests';
import AchievementsCard from '../sections/records/AchievementsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections. */
  readOnly?: boolean;
  /** First name of the profile owner — used for friend-view copy. */
  ownerFirstName?: string | null;
}

export const RecordsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  readOnly = false,
  ownerFirstName = null,
}) => {
  const viewMode: 'owner' | 'friend' = readOnly ? 'friend' : 'owner';
  return (
    <div
      role="tabpanel"
      id="handicap-panel-records"
      aria-labelledby="handicap-tab-records"
      style={{ paddingTop: 2 }}
    >
      {/* 1. Personal Bests */}
      <PersonalBests
        connectionId={connectionId}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 2. Recent Rounds (existing archive list also covers monthly history) */}
      <RecentRoundsCard
        connectionId={connectionId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 3. Achievements */}
      <AchievementsCard
        userId={userId}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />
    </div>
  );
};

export default RecordsView;
