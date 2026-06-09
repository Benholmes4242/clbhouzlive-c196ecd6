import React from 'react';
import YourCircleSection from '../sections/your-circle/YourCircleSection';
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
      className="[&>section:first-child]:!mt-0 [&>section:first-child>div:first-child]:!pt-0"
      style={{ paddingTop: 0 }}
    >
      {/* 1. Friends Yesterday — hero */}
      {!readOnly && <MorningMoment userId={userId} />}

      {/* 2. Your Circle — leaderboard header + recently active rail */}
      <YourCircleSection userId={userId} />

      {/* 3. Friends' Rounds */}
      <RecentlyPlayedFeed ownerUserId={userId} />

      {/* 4. Make Your Feed Louder — owner only */}
      {!readOnly && <InviteToClbhouzV2 ownerUserId={userId} />}
    </div>
  );
};

export default FriendsView;
