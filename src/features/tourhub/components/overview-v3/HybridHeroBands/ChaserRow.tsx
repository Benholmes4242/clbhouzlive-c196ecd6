/**
 * ChaserRow + FinishRow — non-leader leaderboard rows.
 * §6.3.3 + §6.3.5 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  INK,
  INK_15,
  INK_45,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { getScoreColor } from '../../../_shared/scoreColor';
import { TrajectorySparkline } from './TrajectorySparkline';

function liveScoreColour(s: string): string {
  if (s.startsWith('\u2212') || s.startsWith('-')) return getScoreColor(-1, 'dark', 'standard');
  if (s.startsWith('+')) return getScoreColor(1, 'dark', 'standard');
  return getScoreColor(0, 'dark', 'standard');
}

interface ChaserRowProps {
  rank: string;
  name: string;
  country?: string | null;
  score: string;
  thru: string;
  today?: number | null;
  /** Ordered multi-folder candidate URLs (resolvePlayerAvatarCandidates output). */
  avatarCandidates?: (string | null | undefined)[];
  /** Stable id used to derive the deterministic initials colour. */
  playerId?: string | null;
  isResults?: boolean;
  isLast?: boolean;
  // Pass 3 additions:
  rounds?: number[];
  par?: number;
}

export function ChaserRow({
  rank,
  name,
  country,
  score,
  thru,
  today,
  avatarCandidates,
  playerId,
  isResults = false,
  isLast = false,
  rounds,
  par,
}: ChaserRowProps) {
  const hideThru = isResults;
  const todayDisplay = today != null ? (today === 0 ? 'E' : today > 0 ? `+${today}` : String(today)) : '—';
  const todayColor = today != null ? liveScoreColour(todayDisplay) : INK_45;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hideThru ? '32px 1fr 36px auto' : '32px 1fr 36px 42px 42px auto',
        gap: 12,
        height: 40,
        padding: '8px 20px',
        alignItems: 'center',
        background: 'transparent',
        borderBottom: 'none',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 13,
          fontWeight: 700,
          color: INK_45,
        }}
      >
        {rank}
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        <SquircleAvatar
          size={24}
          srcCandidates={avatarCandidates}
          alt={name}
          userId={playerId ?? name}
          hairlineRing
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.005em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {name}
          </span>
          {country && <CountryFlag country={country} size="sm" />}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <TrajectorySparkline rounds={rounds ?? []} par={par ?? 0} variant="solo" totalRounds={4} />
      </div>
      {!hideThru && (
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 11,
            fontWeight: 700,
            color: INK_45,
            textAlign: 'right',
          }}
        >
          {thru}
        </span>
      )}
      {!hideThru && (
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 13,
            fontWeight: 700,
            color: todayColor,
            textAlign: 'right',
          }}
        >
          {todayDisplay}
        </span>
      )}
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16,
          fontWeight: 700,
          color: isResults ? INK : liveScoreColour(score),
          letterSpacing: '-0.01em',
          fontFeatureSettings: '"tnum" 1, "kern" 1',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}


