import React from 'react';
import AchievementsStrip from '../sections/AchievementsStrip';
import LastRoundCard from '../sections/LastRoundCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';
import MorningMoment from '@/components/handicap/MorningMoment';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  connectionCreatedAt: string;
  /** When true, hides personal-only sections (Echo Insights, Head-to-Head). */
  readOnly?: boolean;
}

export const OverviewView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  connectionCreatedAt,
  readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-overview"
      aria-labelledby="handicap-tab-overview"
    >
      {!readOnly && <MorningMoment userId={userId} />}
      <LastRoundCard connectionId={connectionId} />
      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />
      {/* Echo Insights is an AI read of *your* game — hide on friend pages. */}
      {!readOnly && <EchoInsightsCard connectionId={connectionId} />}
      <AchievementsStrip
        connectionId={connectionId}
        connectionCreatedAt={connectionCreatedAt}
      />
    </div>
  );
};

export default OverviewView;
