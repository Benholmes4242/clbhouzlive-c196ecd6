import React from 'react';
import TryNextCourses from '../sections/TryNextCourses';
import RecentRoundsCard from '../sections/trends/RecentRoundsCard';
import TrendCardsStack from '../sections/trends/TrendCardsStack';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections (Echo Insights). */
  readOnly?: boolean;
}

export const TrendsView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-trends"
      aria-labelledby="handicap-tab-trends"
    >
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} />
      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
      <TryNextCourses userId={userId} />
      <RecentRoundsCard connectionId={connectionId} />
    </div>
  );
};

export default TrendsView;
