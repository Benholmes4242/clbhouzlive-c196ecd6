import React from 'react';
import CourseFormCard from '../sections/CourseFormCard';
import TryNextCourses from '../sections/TryNextCourses';
import RecentRoundsList from '../sections/RecentRoundsList';
import TrendCardsStack from '../sections/trends/TrendCardsStack';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
}

export const TrendsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
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
