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
 */

import React from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  INK,
  INK_15,
  INK_45,
  GOLD_DARK,
  NUMERIC_STYLE,
} from '../HybridHero.constants';

interface LastYearRowProps {
  rank: string;
  name: string;
  country?: string | null;
  score: string;
  year: string;
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
  country,
  score,
  year,
  isWinner,
  avatarCandidates,
  playerId,
  isLast,
}: LastYearRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto 42px',
        gap: 12,
        padding: isWinner ? '14px 20px' : '12px 20px',
        alignItems: 'center',
        background: isWinner ? 'rgba(251,188,46,0.10)' : 'transparent',
        borderBottom: 'none',
      }}
    >
      {isWinner ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={GOLD_DARK} aria-hidden="true">
          <path d="M7 4h10v3a5 5 0 0 1-10 0V4z M9 13h6l-1 4h-4z M8 19h8v2H8z" />
        </svg>
      ) : (
        <span style={{ ...NUMERIC_STYLE, fontSize: 13, fontWeight: 700, color: INK_45 }}>
          {rank}
        </span>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <SquircleAvatar
          size={isWinner ? 36 : 28}
          srcCandidates={avatarCandidates}
          alt={name}
          userId={playerId ?? name}
          hairlineRing
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: isWinner ? 16 : 14,
              fontWeight: isWinner ? 700 : 700,
              color: INK,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </span>
          {country && <CountryFlag country={country} size="sm" />}
        </div>
      </div>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: isWinner ? 22 : 16,
          fontWeight: 700,
          color: isWinner ? GOLD_DARK : INK,
          letterSpacing: '-0.02em',
        }}
      >
        {score}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
          fontWeight: 700,
          color: INK_45,
          textAlign: 'right',
          letterSpacing: '0.04em',
        }}
      >
        {year}
      </span>
    </div>
  );
}
