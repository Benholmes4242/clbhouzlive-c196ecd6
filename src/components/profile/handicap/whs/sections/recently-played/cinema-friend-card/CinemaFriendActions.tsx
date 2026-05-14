import React from 'react';
import { useToggleRoundReaction } from '@/lib/whs/hooks';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  scoreId: string | null;
  reactionCount: number;
  viewerHasReacted: boolean;
}

const HeartIcon: React.FC<{ filled: boolean; color: string }> = ({ filled, color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const CinemaFriendActions: React.FC<Props> = ({ scoreId, reactionCount, viewerHasReacted }) => {
  const toggle = useToggleRoundReaction();

  const onReact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scoreId || toggle.isPending) return;
    toggle.mutate({ scoreId });
  };

  const reactInactive = {
    background: 'rgba(255,255,255,0.10)',
    border: '0.5px solid rgba(255,255,255,0.25)',
    color: '#FFFFFF',
  };
  const reactActive = {
    background: 'rgba(239,68,68,0.20)',
    border: '0.5px solid rgba(239,68,68,0.45)',
    color: '#FCA5A5',
  };
  const reactStyle = viewerHasReacted ? reactActive : reactInactive;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        right: 14,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      {scoreId ? (
        <button
          type="button"
          onClick={onReact}
          disabled={toggle.isPending}
          aria-pressed={viewerHasReacted}
          aria-label={
            reactionCount > 0
              ? `${reactionCount} reaction${reactionCount === 1 ? '' : 's'}. ${viewerHasReacted ? 'You reacted.' : 'Tap to react.'}`
              : 'Tap to react with a heart'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 13px',
            borderRadius: 999,
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            fontSize: 12,
            fontWeight: 600,
            cursor: toggle.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            ...reactStyle,
          }}
        >
          <HeartIcon filled={viewerHasReacted} color={reactStyle.color} />
          {reactionCount > 0 ? reactionCount : 'React'}
        </button>
      ) : (
        <span />
      )}

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 13px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          border: '0.5px solid rgba(255,255,255,0.25)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        SCORECARD
        <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u203A'}</span>
      </span>
    </div>
  );
};

export default CinemaFriendActions;
