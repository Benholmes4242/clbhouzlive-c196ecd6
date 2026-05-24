import React from 'react';
import ForecastCard from '../sections/ForecastCard';
import WhereYouStandSection from '../sections/WhereYouStandSection';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import IndexHistoryCard from '../sections/IndexHistoryCard';
import CourseFormCard from '../sections/trends/CourseFormCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';
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
      style={{ paddingTop: 16 }}
    >
      {/* 1. Forecast */}
      <ForecastCard connectionId={connectionId} currentHandicap={currentHandicap} />


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

      {/* 5. Course Form */}
      <CourseFormCard connectionId={connectionId} currentHandicap={currentHandicap ?? undefined} />

      {/* 6. Echo Insights — owner only */}
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}

      {/* 7. Stableford distribution */}
      <TrendCardsStack
        connectionId={connectionId}
        currentHandicap={currentHandicap}
        splitAt="rest"
      />
    </div>
  );
};

export default TrendsView;
