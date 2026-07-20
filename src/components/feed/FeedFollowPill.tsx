import React, { useEffect, useRef, useState } from 'react';

const AMBER = '#F7931E';
const INK = '#0E1013';

interface FeedFollowPillProps {
  onFollow: () => void;
  isFollowed: boolean;
}

const BASE_STYLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.4,
  padding: '2px 8px',
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
          color: AMBER,
          background: 'transparent',
          border: `1px solid ${AMBER}`,
        }}
      >
        FOLLOWING ✓
      </span>
    );
  }

  // Two-state pill (mirrors the Clubhouse card):
  // - Not following → amber outline FOLLOW cta
  // - Following    → subdued glass "Following" chip (non-interactive)
  if (isFollowed) {
    return (
      <span
        aria-label="Following"
        style={{
          ...BASE_STYLE,
          color: 'rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          cursor: 'default',
        }}
      >
        FOLLOWING
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
