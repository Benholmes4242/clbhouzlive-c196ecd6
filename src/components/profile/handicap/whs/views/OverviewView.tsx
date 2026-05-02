import React from 'react';
import HeadToHeadCard from '../sections/HeadToHeadCard';
import AchievementsStrip from '../sections/AchievementsStrip';
import PredictionsCard from '../sections/PredictionsCard';
import LastRoundCard from '../sections/LastRoundCard';
import CountersStrip from '../sections/CountersStrip';

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
      <HeadToHeadCard ownerUserId={userId} currentUserHandicap={currentHandicap} />
      <AchievementsStrip
        connectionId={connectionId}
        connectionCreatedAt={connectionCreatedAt}
      />
      <CountersStrip connectionId={connectionId} />
      <PredictionsCard connectionId={connectionId} />
    </div>
  );
};

export default OverviewView;
