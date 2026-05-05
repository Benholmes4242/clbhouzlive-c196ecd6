import React from 'react';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { useSharedRounds, useFriendRivalries } from '@/lib/whs/hooks';
import {
  ProfileHeader,
  HeroStatsRow,
  H2HBlock,
  RecentRoundsBlock,
  CourseBestsBlock,
  PinFooter,
} from './FriendProfileBlocks';

interface Props {
  friend: FriendLeaderboardEntry;
  ownerUserId: string;
  /** When true, render only the data-fetching hooks (no DOM) for prefetch warmup. */
  prefetchOnly?: boolean;
}

export const FriendProfileContent: React.FC<Props> = ({ friend, ownerUserId, prefetchOnly }) => {
  const { data: sharedRounds, isLoading: sharedLoading } = useSharedRounds(
    ownerUserId,
    friend.friend_user_id,
  );
  const { data: rivalries } = useFriendRivalries(ownerUserId);

  const pinnedSlot = rivalries?.find(r =>
    r.slot_kind === 'pinned' &&
    (
      (friend.friend_user_id && r.rival_user_id === friend.friend_user_id) ||
      (friend.friend_row_id && r.rival_friend_row_id === friend.friend_row_id)
    )
  );

  if (prefetchOnly) return null;

  return (
    <div>
      <ProfileHeader friend={friend} />
      <HeroStatsRow friend={friend} />
      <H2HBlock friend={friend} sharedRounds={sharedRounds} loading={sharedLoading} />
      <RecentRoundsBlock friend={friend} ownerUserId={ownerUserId} />
      <CourseBestsBlock friend={friend} ownerUserId={ownerUserId} />
      <PinFooter friend={friend} pinnedSlot={pinnedSlot} ownerUserId={ownerUserId} />
    </div>
  );
};

export default FriendProfileContent;
