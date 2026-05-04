import React from 'react';
import CourseFormCard from '../sections/CourseFormCard';
import TryNextCourses from '../sections/TryNextCourses';
import RecentRoundsList from '../sections/RecentRoundsList';
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
      <TrendCardsStack connectionId={connectionId} />
      <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap} />
      <TryNextCourses userId={userId} />
      <RecentRoundsList connectionId={connectionId} />
    </div>
  );
};

export default TrendsView;
