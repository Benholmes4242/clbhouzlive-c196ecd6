import React from 'react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import FlagSilhouetteOverlay from '@/components/whs/FlagSilhouetteOverlay';
import { deriveHeroState } from './deriveHeroState';
import TopEyebrow from './TopEyebrow';
import MiniGlass from './MiniGlass';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #2d3a2d 0%, #4a5d4a 25%, #6b7a5a 50%, #8a9670 72%, #c4a574 88%, #d4956b 100%)';

const ATMOSPHERIC =
  'radial-gradient(ellipse 80% 60% at 50% 90%, rgba(0,0,0,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 70% 25%, rgba(255,200,140,0.18) 0%, transparent 60%)';

const LEGIBILITY_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)';

interface Props {
  friend: FriendYesterday;
  rank: number;
  onClick: () => void;
}

interface HintInfo {
  label: string;
  color: string;
}

function hintFor(friend: FriendYesterday): HintInfo {
  const state = deriveHeroState(friend);
  if (state === 'invite') return { label: '\u2197 INVITE', color: '#FED7AA' };
  if (state === 'nudge') return { label: '\u27F3 NUDGE TO SYNC', color: '#86EFAC' };
  if (state === 'syncing') return { label: '\u27F3 SYNCING', color: 'rgba(255,255,255,0.70)' };
  return {
    label: friend.is_counter ? 'COUNTER' : 'NON-COUNTER',
    color: 'rgba(255,255,255,0.55)',
  };
}

export const MiniCard: React.FC<Props> = ({ friend, rank, onClick }) => {
  const hint = hintFor(friend);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        width: 250,
        height: 168,
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        background: '#0F172A',
        border: '0.5px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        scrollSnapAlign: 'start',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
      }}
    >
      {friend.course_thumbnail_image ? (
        <img
          src={friend.course_thumbnail_image}
          alt={friend.course_name ?? ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <>
          <div style={{ position: 'absolute', inset: 0, background: FALLBACK_GRADIENT }} />
          <FlagSilhouetteOverlay opacity={0.20} />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, background: ATMOSPHERIC, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: LEGIBILITY_SCRIM, pointerEvents: 'none' }} />

      <TopEyebrow friend={friend} variant="mini" rightPill="rank" rank={rank} />

      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: 34,
          bottom: 30,
          display: 'flex',
          alignItems: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%' }}>
          <MiniGlass friend={friend} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 10,
          right: 10,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: hint.color,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {hint.label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.70)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          VIEW {'\u203A'}
        </span>
      </div>
    </button>
  );
};

export default MiniCard;
