// SALVAGED — claimed by Tour Overview rebuild Phase 4 (last year's top four on an upcoming event). Do not sweep as unreachable.
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
 * LastYearRow — Upcoming · far variant — historical finisher row.
 * §6.3.6 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 * Historical rows consume MiniBoard's hero tracks so upcoming geometry cannot
 * drift from the condensed live board; winner styling never changes row size.
 */

import React from 'react';
import { NUMERIC_STYLE } from '../HybridHero.constants';
import { INK, LEADER_GOLD } from '../../../_shared/tokens';
import { getScoreColor } from '../../../_shared/scoreColor';
import { HERO_PAD_X, HERO_POS_W, HERO_TOT_W, HERO_GAP } from '../../../tournament-v2/sections/MiniBoard';

interface LastYearRowProps {
  rank: string;
  name: string;
  score: string;
  isWinner?: boolean;
  /** Ordered multi-folder candidate URLs (resolvePlayerAvatarCandidates output). */
  avatarCandidates?: (string | null | undefined)[];
  /** Stable id used to derive the deterministic initials colour. */
  playerId?: string | null;
  isLast?: boolean;
}

export function LastYearRow({
  rank,
  name,
  score,
  isWinner,
  avatarCandidates,
  playerId,
  isLast,
}: LastYearRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${HERO_POS_W}px minmax(0,1fr) ${HERO_TOT_W}px`,
        gap: HERO_GAP,
        padding: 0,
        minHeight: 31,
        alignItems: 'center',
        background: 'transparent',
        borderBottom: 'none',
      }}
    >
      {isWinner ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill={LEADER_GOLD} aria-hidden="true">
          <path d="M7 4h10v3a5 5 0 0 1-10 0V4z M9 13h6l-1 4h-4z M8 19h8v2H8z" />
        </svg>
      ) : (
        <span style={{ ...NUMERIC_STYLE, fontSize: 12.5, fontWeight: 700, color: INK }}>
          {rank}
        </span>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span
            style={{
              minWidth: 0,
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.15,
              color: INK,
              letterSpacing: 0,
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
          ...NUMERIC_STYLE,
          fontSize: 15,
          fontWeight: 700,
          // Upcoming history uses the board's score colour, never winner gold.
          color: getScoreColor(score.trim() === 'E' ? 0 : Number(score.replace('−', '-')), 'dark'),
          textAlign: 'center',
          letterSpacing: 0,
        }}
      >
        {score}
      </span>
    </div>
  );
}
