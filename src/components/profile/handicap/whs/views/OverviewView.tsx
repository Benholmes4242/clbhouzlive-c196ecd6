import React from 'react';
import HeadToHeadCard from '../sections/HeadToHeadCard';
import AchievementsStrip from '../sections/AchievementsStrip';
import LastRoundCard from '../sections/LastRoundCard';
import RoundsThatCountCard from '../sections/RoundsThatCountCard';
import EchoInsightsCard from '../sections/EchoInsightsCard';

interface Props {
  connectionId: string;
  userId: string;
  currentHandicap: number | null;
  connectionCreatedAt: string;
}

export const OverviewView: React.FC<Props> = ({
  connectionId,
  userId,
  currentHandicap,
  connectionCreatedAt,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-overview"
      aria-labelledby="handicap-tab-overview"
    >
      <LastRoundCard connectionId={connectionId} />
      <RoundsThatCountCard connectionId={connectionId} currentHandicap={currentHandicap} />
      <EchoInsightsCard connectionId={connectionId} />
      <HeadToHeadCard ownerUserId={userId} currentUserHandicap={currentHandicap} />
      <AchievementsStrip
        connectionId={connectionId}
        connectionCreatedAt={connectionCreatedAt}
      />
    </div>
  );
};

export default OverviewView;
