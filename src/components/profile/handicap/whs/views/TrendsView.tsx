import React from 'react';
import TrendCardsStack from '../sections/trends/TrendCardsStack';
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
  userId: _userId,
  currentHandicap,
  readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-trends"
      aria-labelledby="handicap-tab-trends"
    >
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} splitAt="hero-only" />
      <TrendCardsStack connectionId={connectionId} currentHandicap={currentHandicap} splitAt="rest" />
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
    </div>
  );
};

export default TrendsView;
