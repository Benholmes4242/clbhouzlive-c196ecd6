import React from 'react';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { CinemaFriendCard } from './cinema-friend-card';
import { EgOnlyCard, ClbhouzNotSyncedCard } from './small-friend-cards';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  /** Triggered when the INVITE / ASK TO SYNC pill is tapped. Stop-propagated from `onClick`. */
  onInviteClick?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Top-level — branches by sync state.
//   - Clbhouz user + WHS synced → CinemaFriendCard (immersive 280px)
//   - Clbhouz user, no WHS sync → ClbhouzNotSyncedCard (identity-leading)
//   - EG-only                   → EgOnlyCard (media-leading)
// ─────────────────────────────────────────────────────────────────────

export const FriendRoundCard: React.FC<Props> = ({ activity, onClick, onInviteClick }) => {
  if (activity.is_clbhouz_user && activity.friend_connection_id) {
    return <CinemaFriendCard activity={activity} onClick={onClick} />;
  }
  if (activity.is_clbhouz_user) {
    return (
      <ClbhouzNotSyncedCard
        activity={activity}
        onClick={onClick}
        onInviteClick={onInviteClick}
      />
    );
  }
  return (
    <EgOnlyCard activity={activity} onClick={onClick} onInviteClick={onInviteClick} />
  );
};

export default FriendRoundCard;
