import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ActivityFeedStrip from '../sections/ActivityFeedStrip';
import FriendsLeaderboard from '../sections/FriendsLeaderboard';
import InvitesSection from '../sections/InvitesSection';
import FriendsLeaderboardV2 from '../sections/friends-leaderboard/FriendsLeaderboardV2';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import InviteToClbhouzV2 from '../sections/invite-to-clbhouz/InviteToClbhouzV2';

interface Props {
  userId: string;
  currentHandicap: number | null;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap }) => {
  // TEMP (Phase 2C/2D/2E sandbox): ?v2=1 swaps in V2 components.
  // Remove this toggle in the final swap-PR.
  const [searchParams] = useSearchParams();
  const useV2 = searchParams.get('v2') === '1';

  return (
    <div
      role="tabpanel"
      id="handicap-panel-friends"
      aria-labelledby="handicap-tab-friends"
    >
      {useV2 ? (
        <RecentlyPlayedFeed ownerUserId={userId} />
      ) : (
        <ActivityFeedStrip ownerUserId={userId} />
      )}

      {useV2 ? (
        <FriendsLeaderboardV2
          ownerUserId={userId}
          currentUserHandicap={currentHandicap}
        />
      ) : (
        <FriendsLeaderboard ownerUserId={userId} currentUserHandicap={currentHandicap} />
      )}

      {useV2 ? (
        <InviteToClbhouzV2 ownerUserId={userId} />
      ) : (
        <InvitesSection ownerUserId={userId} />
      )}
    </div>
  );
};

export default FriendsView;
