import React from 'react';
import TrendCardsStack from '../sections/trends/TrendCardsStack';
import WhereYouStandSection from '../sections/WhereYouStandSection';
import EchoInsightsCard from '../sections/EchoInsightsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  /** When true, hides personal-only sections (Echo Insights, Where You Stand). */
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
      style={{ paddingTop: 16 }}
    >
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} splitAt="hero-only" topMargin={0} />
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} splitAt="rest" />
      {!readOnly && <WhereYouStandSection userId={userId} />}
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
    </div>
  );
};

export default TrendsView;
