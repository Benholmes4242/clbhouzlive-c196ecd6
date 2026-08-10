import React from 'react';

const DIM = 'rgba(248,250,252,0.55)';
const AMBER = '#F7931E';

interface FeedFollowPillProps {
  onFollow: () => void;
  isFollowed: boolean;
}

const LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.4,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

/**
 * Follow state beside the timestamp. No capsule, no tint, no border — FOLLOW
 * is the only call to action (amber text), FOLLOWING is a muted status label
 * that remains tappable to unfollow.
 */
export const FeedFollowPill: React.FC<FeedFollowPillProps> = ({ onFollow, isFollowed }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFollowed ? 'Unfollow' : 'Follow'}
      style={{ ...LABEL, color: isFollowed ? DIM : AMBER }}
    >
      {isFollowed ? 'FOLLOWING' : 'FOLLOW'}
    </button>
  );
};
