/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
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
            fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
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
