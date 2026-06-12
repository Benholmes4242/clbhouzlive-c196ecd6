import React, { useEffect, useRef, useState } from 'react';

const AMBER = '#F7931E';
const INK = '#0E1013';

interface FeedFollowPillProps {
  onFollow: () => void;
  isFollowed: boolean;
}

const BASE_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.5,
  padding: '3px 9px',
  borderRadius: 999,
  cursor: 'pointer',
  transition: 'all 220ms ease',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

export const FeedFollowPill: React.FC<FeedFollowPillProps> = ({ onFollow, isFollowed }) => {
  // Track whether the pill was idle on mount — used to suppress the confirm
  // flash when isFollowed is already true on first render.
  const initiallyFollowedRef = useRef(isFollowed);
  const [justFollowed, setJustFollowed] = useState(false);
  const prevFollowedRef = useRef(isFollowed);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevFollowedRef.current;
    if (!prev && isFollowed && !initiallyFollowedRef.current) {
      setJustFollowed(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setJustFollowed(false), 700);
    } else if (prev && !isFollowed) {
      // rollback — clear confirm flash, show idle
      if (timerRef.current) clearTimeout(timerRef.current);
      setJustFollowed(false);
    }
    prevFollowedRef.current = isFollowed;
  }, [isFollowed]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (isFollowed && !justFollowed) return null;
  if (initiallyFollowedRef.current && !justFollowed) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowed) return;
    onFollow();
  };

  if (justFollowed) {
    return (
      <span
        style={{
          ...BASE_STYLE,
          color: INK,
          background: AMBER,
          border: `1px solid ${AMBER}`,
        }}
      >
        FOLLOWING ✓
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        ...BASE_STYLE,
        color: AMBER,
        background: 'transparent',
        border: `1px solid ${AMBER}`,
      }}
    >
      FOLLOW
    </button>
  );
};
