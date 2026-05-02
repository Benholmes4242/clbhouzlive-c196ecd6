import React from 'react';
import ActivityFeedStrip from '../sections/ActivityFeedStrip';
import FriendsLeaderboard from '../sections/FriendsLeaderboard';
import InvitesSection from '../sections/InvitesSection';

interface Props {
  userId: string;
  currentHandicap: number | null;
}

export const FriendsView: React.FC<Props> = ({ userId, currentHandicap }) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-friends"
      aria-labelledby="handicap-tab-friends"
    >
      <ActivityFeedStrip ownerUserId={userId} />
      <FriendsLeaderboard ownerUserId={userId} currentUserHandicap={currentHandicap} />
      <InvitesSection ownerUserId={userId} />
    </div>
  );
};

export default FriendsView;
