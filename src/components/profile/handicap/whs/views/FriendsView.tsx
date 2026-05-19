import React from 'react';
import FriendsHeaderSection from '../sections/friends-header/FriendsHeaderSection';
import RecentlyActiveRail from '../sections/recently-active/RecentlyActiveRail';
import FriendsEchoSection from '../sections/friends/FriendsEchoSection';
import RecentlyPlayedFeed from '../sections/recently-played/RecentlyPlayedFeed';
import InviteToClbhouzV2 from '../sections/invite-to-clbhouz/InviteToClbhouzV2';
import MorningMoment from '@/components/handicap/MorningMoment';

interface Props {
  userId: string;
  currentHandicap: number | null;
  connectionId: string;
  readOnly?: boolean;
}

export const FriendsView: React.FC<Props> = ({
  userId,
  currentHandicap: _currentHandicap,
  connectionId,
  readOnly = false,
}) => {
  return (
    <div
      role="tabpanel"
      id="handicap-panel-friends"
      aria-labelledby="handicap-tab-friends"
      style={{ paddingTop: 16 }}
    >
      {/* 1. Friends Yesterday — hero */}
      {!readOnly && <MorningMoment userId={userId} />}

      {/* 2. Friends Yesterday — header section */}
      <FriendsHeaderSection userId={userId} />

      {/* 3. Recently Active */}
      <RecentlyActiveRail userId={userId} />

      {/* 4. Echo on Your Circle — owner only */}
      {!readOnly && <FriendsEchoSection connectionId={connectionId} />}

      {/* 5. Friends' Rounds */}
      <RecentlyPlayedFeed ownerUserId={userId} />

      {/* 6. Make Your Feed Louder — owner only */}
      {!readOnly && <InviteToClbhouzV2 ownerUserId={userId} />}
    </div>
  );
};

export default FriendsView;
