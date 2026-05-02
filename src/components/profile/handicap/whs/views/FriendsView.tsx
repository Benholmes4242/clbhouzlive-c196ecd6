import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ActivityFeedStrip from '../sections/ActivityFeedStrip';
import FriendsLeaderboard from '../sections/FriendsLeaderboard';
import InvitesSection from '../sections/InvitesSection';
import FriendsLeaderboardV2 from '../sections/friends-leaderboard/FriendsLeaderboardV2';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';

interface Props {
  userId: string;
  currentHandicap: number | null;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap }) => {
  // TEMP (Phase 2C/2D sandbox): ?v2=1 swaps in V2 components.
  // Remove this toggle in the final swap-PR after Phase 2E.
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

      {/* Invites is still V1 — Phase 2E will V2 it. */}
      <InvitesSection ownerUserId={userId} />
    </div>
  );
};

export default FriendsView;
