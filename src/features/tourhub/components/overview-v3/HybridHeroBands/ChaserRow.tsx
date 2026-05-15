/**
 * ChaserRow + FinishRow — non-leader leaderboard rows.
 * §6.3.3 + §6.3.5 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import {
  INK,
  INK_15,
  INK_45,
  AMBER,
  GREEN_LIVE,
  FONT_MONO,
} from '../HybridHero.constants';

function PlayerHead({ size = 28, src }: { size?: number; src?: string | null }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: src
          ? `url(${src}) center/cover`
          : 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}

function liveScoreColour(s: string): string {
  if (s.startsWith('\u2212') || s.startsWith('-')) return GREEN_LIVE;
  if (s.startsWith('+')) return AMBER;
  return INK;
}

interface ChaserRowProps {
  rank: string;
  name: string;
  score: string;
  thru: string;
  avatarUrl?: string | null;
  isResults?: boolean;
  isLast?: boolean;
}

export function ChaserRow({
  rank,
  name,
  score,
  thru,
  avatarUrl,
  isResults = false,
  isLast = false,
}: ChaserRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto 42px',
        gap: 12,
        padding: '12px 20px',
        alignItems: 'center',
        background: 'transparent',
        borderBottom: isLast ? 'none' : `0.5px solid ${INK_15}`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          fontWeight: 700,
          color: INK_45,
        }}
      >
        {rank}
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <PlayerHead size={28} src={avatarUrl} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 700,
          color: isResults ? INK : liveScoreColour(score),
          letterSpacing: '-0.01em',
          fontFeatureSettings: '"tnum" 1, "kern" 1',
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
        }}
      >
        {thru}
      </span>
    </div>
  );
}
