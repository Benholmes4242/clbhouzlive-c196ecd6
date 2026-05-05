import React from 'react';
import TryNextCourses from '../sections/TryNextCourses';
import RecentRoundsCard from '../sections/trends/RecentRoundsCard';
import TrendCardsStack from '../sections/trends/TrendCardsStack';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /**
   * API consistency — TrendsView is purely visual data with no actions
   * today. Plumb the prop so future actions can be gated on !readOnly.
   */
  readOnly?: boolean;
}

export const TrendsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  readOnly: _readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-trends"
      aria-labelledby="handicap-tab-trends"
    >
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} />
      <TryNextCourses userId={userId} />
      <RecentRoundsCard connectionId={connectionId} />)
    </div>
  );
};

export default TrendsView;
