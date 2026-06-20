import React from 'react';
import ForecastCard from '../sections/ForecastCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import IndexHistoryCard from '../sections/IndexHistoryCard';
import CourseFormCard from '../sections/trends/CourseFormCard';

import TrendCardsStack from '../sections/trends/TrendCardsStack';


interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections (Echo Insights, Where You Stand). */
  readOnly?: boolean;
  /** First name of the profile owner — used to name-prefix friend-view copy. */
  ownerFirstName?: string | null;
}

export const TrendsView: React.FC<Props> = ({
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
      id="handicap-panel-trends"
      aria-labelledby="handicap-tab-trends"
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 34 }}
    >
      {/* 1. Forecast */}
      <ForecastCard
        connectionId={connectionId}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />


      {/* 2. Where You Stand — owner only */}
      {!readOnly && <WhereYouStandSection userId={userId} />}

      {/* 3. Rounds That Count */}
      <RoundsThatCountCard
        connectionId={connectionId}
        currentHandicap={currentHandicap}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

      {/* 4. Index History */}
      <IndexHistoryCard connectionId={connectionId} />

      {/* 5. Stableford distribution */}
      <TrendCardsStack
        connectionId={connectionId}
        userId={userId}
        currentHandicap={currentHandicap}
        splitAt="rest"
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />


      {/* 6. Course Form */}
      <CourseFormCard
        connectionId={connectionId}
        currentHandicap={currentHandicap ?? undefined}
        viewMode={viewMode}
        ownerFirstName={ownerFirstName}
      />

    </div>
  );
};

export default TrendsView;
