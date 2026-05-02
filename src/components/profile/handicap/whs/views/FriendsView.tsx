import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ActivityFeedStrip from '../sections/ActivityFeedStrip';
import FriendsLeaderboard from '../sections/FriendsLeaderboard';
import FriendsLeaderboardV2 from '../sections/friends-leaderboard/FriendsLeaderboardV2';
import InvitesSection from '../sections/InvitesSection';

interface Props {
  userId: string;
  currentHandicap: number | null;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap }) => {
  // TEMP (Phase 2C sandbox): ?v2=1 swaps in FriendsLeaderboardV2.
  // Remove this toggle in the final swap-PR after Phase 2D + 2E.
  const [searchParams] = useSearchParams();
  const useV2 = searchParams.get('v2') === '1';

  return (
    <div
      role="tabpanel"
      id="handicap-panel-friends"
      aria-labelledby="handicap-tab-friends"
    >
      <ActivityFeedStrip ownerUserId={userId} />
      {useV2 ? (
        <FriendsLeaderboardV2
          ownerUserId={userId}
          currentUserHandicap={currentHandicap}
        />
      ) : (
        <FriendsLeaderboard ownerUserId={userId} currentUserHandicap={currentHandicap} />
      )}
      <InvitesSection ownerUserId={userId} />
    </div>
  );
};

export default FriendsView;
