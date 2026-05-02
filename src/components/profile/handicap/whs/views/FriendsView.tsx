import React from 'react';
import FriendsLeaderboardV2 from '../sections/friends-leaderboard/FriendsLeaderboardV2';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import InviteToClbhouzV2 from '../sections/invite-to-clbhouz/InviteToClbhouzV2';

interface Props {
  userId: string;
  currentHandicap: number | null;
  connectionId: string;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap, connectionId }) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-friends"
      aria-labelledby="handicap-tab-friends"
    >
      <FriendsLeaderboardV2
        ownerUserId={userId}
        currentUserHandicap={currentHandicap}
        connectionId={connectionId}
      />
      <RecentlyPlayedFeed ownerUserId={userId} />
      <InviteToClbhouzV2 ownerUserId={userId} />
    </div>
  );
};

export default FriendsView;
