/**
 * ChaserRow + FinishRow — non-leader leaderboard rows.
 * §6.3.3 + §6.3.5 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import CountryFlag from '@/components/ui/country-flag';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import {
  INK,
  INK_15,
  INK_45,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { getScoreColor } from '../../../_shared/scoreColor';
import { TrajectorySparkline } from './TrajectorySparkline';


function PlayerHead({ size = 28, src }: { size?: number; src?: string | null }) {
  return (
    <img
      src={src || PLAYER_SILHOUETTE_URL}
      alt=""
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== PLAYER_SILHOUETTE_URL) t.src = PLAYER_SILHOUETTE_URL;
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        objectFit: 'cover',
        objectPosition: 'center 18%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)',
        border: `0.5px solid rgba(15,23,42,0.10)`,
      }}
    />
  );
}

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
  avatarUrl?: string | null;
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
  avatarUrl,
  isResults = false,
  isLast = false,
  rounds,
  par,
}: ChaserRowProps) {
  const hideThru = isResults;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hideThru ? '32px 1fr 36px auto' : '32px 1fr 36px auto 42px',
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
        <PlayerHead size={24} src={avatarUrl} />
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
    </div>
  );
}


