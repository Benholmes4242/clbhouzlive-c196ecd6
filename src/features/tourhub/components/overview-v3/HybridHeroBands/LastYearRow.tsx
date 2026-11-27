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
import { Trophy } from 'lucide-react';
import { HERO_POS_TYPE } from '../../../tournament-v2/sections/HeroBoardRows';
import { NUMERIC_STYLE } from '../HybridHero.constants';
import { getScoreColor } from '../../../_shared/scoreColor';
import { BoardFlag } from '../../../_shared/BoardFlag';

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
  /** Brief 44 — flag after the name; none without a country. */
  country?: string | null;
}

export function LastYearRow({
  rank,
  name,
  score,
  isWinner,
  avatarCandidates,
  playerId,
  isLast,
  country,
}: LastYearRowProps) {
  /* Upcoming hero new order §3: 26 | 1fr | 44 rows at min-height 31px; winner mark is a
     neutral 14px Trophy here only (completed/recap keep the gold one). */
  return (
    <div data-last-year-row style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) 44px', minHeight: 31, padding: '4px 0', alignItems: 'center' }}>
      {isWinner ? (
        <Trophy data-last-year-trophy size={14} strokeWidth={2} color="rgba(248,250,252,.78)" aria-hidden />
      ) : (
        <span style={{ ...NUMERIC_STYLE, ...HERO_POS_TYPE, color: 'rgba(248,250,252,.62)' }}>{rank}</span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, fontSize: 13 }}>
        <span style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        <BoardFlag country={country} />
      </span>
      <span style={{ ...NUMERIC_STYLE, fontSize: 15, fontWeight: 700, textAlign: 'right', color: getScoreColor(score.trim() === 'E' ? 0 : Number(score.replace('−', '-')), 'dark') }}>{score}</span>
    </div>
  );
}
