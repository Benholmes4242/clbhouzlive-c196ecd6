import React from 'react';
import FriendsHeaderSection from '../sections/friends-header/FriendsHeaderSection';
import RecentlyActiveRail from '../sections/recently-active/RecentlyActiveRail';
import FriendsEchoSection from '../sections/friends/FriendsEchoSection';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import RivalriesSection from '../sections/rivalries/RivalriesSection';
import FriendsLeaderboardSection from '../sections/friends-leaderboard-v2/FriendsLeaderboardSection';
import InviteToClbhouzV2 from '../sections/invite-to-clbhouz/InviteToClbhouzV2';

interface Props {
  userId: string;
  currentHandicap: number | null;
  connectionId: string;
  readOnly?: boolean;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap, connectionId, readOnly = false }) => {
  return (
    <div role="tabpanel" id="handicap-panel-friends" aria-labelledby="handicap-tab-friends">
      <FriendsHeaderSection userId={userId} />
      <RecentlyActiveRail userId={userId} />
      {!readOnly && <FriendsEchoSection connectionId={connectionId} />}
      <RecentlyPlayedFeed ownerUserId={userId} />
      <RivalriesSection userId={userId} />
      <FriendsLeaderboardSection userId={userId} />
      {!readOnly && <InviteToClbhouzV2 ownerUserId={userId} />}
    </div>
  );
};

export default FriendsView;

