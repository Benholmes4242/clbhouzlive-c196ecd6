import React from 'react';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import FriendRoundCardV2 from './FriendRoundCardV2';

interface Props {
  activity: WhsFriendActivityWithImage;
  onClick: () => void;
  /** Triggered when the INVITE / ASK TO SYNC pill is tapped. Stop-propagated from `onClick`. */
  onInviteClick?: () => void;
}

export const FriendRoundCard: React.FC<Props> = ({
  activity,
  onClick,
  onInviteClick,
}) => {
  const variant: 'clbhouz-synced' | 'clbhouz-not-synced' | 'eg-only' =
    activity.is_clbhouz_user && activity.friend_connection_id
      ? 'clbhouz-synced'
      : activity.is_clbhouz_user
        ? 'clbhouz-not-synced'
        : 'eg-only';

  return (
    <FriendRoundCardV2
      activity={activity}
      variant={variant}
      onClick={onClick}
      onInviteClick={onInviteClick}
    />
  );
};

export default FriendRoundCard;
