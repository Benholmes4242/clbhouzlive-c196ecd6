/**
 * TeeTimeRow — Upcoming · imminent marquee group row.
 * §6.3.7 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import {
  INK,
  INK_15,
  INK_45,
  AMBER,
  NUMERIC_STYLE,
} from '../HybridHero.constants';

interface TeeTimeRowProps {
  time: string;
  holeStart: string;
  players: string[];
  isMarquee?: boolean;
  isLast?: boolean;
}

export function TeeTimeRow({ time, holeStart, players, isMarquee, isLast }: TeeTimeRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '62px 1fr 28px',
        gap: 12,
        padding: '12px 20px',
        alignItems: 'center',
        background: isMarquee ? 'rgba(247,147,30,0.05)' : 'transparent',
        borderBottom: 'none',
      }}
    >
      <div>
        <div
          style={{
            ...NUMERIC_STYLE,
            fontSize: 14,
            fontWeight: 700,
            color: isMarquee ? AMBER : INK,
            letterSpacing: '-0.01em',
          }}
        >
          {time}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: INK_45,
            letterSpacing: '0.12em',
            marginTop: 2,
          }}
        >
          {holeStart}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        {players.slice(0, 3).map((p, i) => (
          <div
            key={i}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {p}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        {players.slice(0, 3).map((_, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '34%',
              background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
