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
}

export const RecordsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  readOnly: _readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-records"
      aria-labelledby="handicap-tab-records"
      style={{ paddingTop: 16 }}
    >
      {/* 1. Personal Bests */}
      <PersonalBests connectionId={connectionId} currentHandicap={currentHandicap} />

      {/* 2. Recent Rounds (existing archive list also covers monthly history) */}
      <RecentRoundsCard connectionId={connectionId} />

      {/* 3. Achievements */}
      <AchievementsCard userId={userId} viewerUserId={userId} />
    </div>
  );
};

export default RecordsView;
