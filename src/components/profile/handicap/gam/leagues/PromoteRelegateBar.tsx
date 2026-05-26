import React from 'react';
import {
  POD_SIZE,
  PROMOTE_PCT,
  RELEGATE_PCT,
  SAFE_PCT,
  ZONE_COLORS,
} from './leagueTokens';

interface Props {
  /** 1-based rank in pod (1..30). */
  rank: number;
  /** Bar height in px. Card uses 6, sheet hero uses 10. */
  height?: number;
  /** Dot size in px. */
  dotSize?: number;
}

/**
 * The promote/relegate bar — the visual signature of the Leagues card.
 * Green left segment (top 7), grey middle (8..25), red right (bottom 5).
 * Amber dot marks user's position above the bar.
 */
export const PromoteRelegateBar: React.FC<Props> = ({
  rank,
  height = 6,
  dotSize = 12,
}) => {
  const clampedRank = Math.min(Math.max(1, rank), POD_SIZE);
  // Centered position of the rank slot (each slot ~3.33%).
  const posPct = ((clampedRank - 0.5) / POD_SIZE) * 100;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: dotSize + 4 }}>
      {/* Dot */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: `calc(${posPct}% - ${dotSize / 2}px)`,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: ZONE_COLORS.self,
          boxShadow: '0 0 12px rgba(247,147,30,0.55), 0 0 0 2px var(--hcp-bg-1)',
        }}
      />
      {/* Bar */}
      <div
        style={{
          display: 'flex',
          height,
          width: '100%',
          borderRadius: height / 2,
          overflow: 'hidden',
          background: 'rgba(148,163,184,0.18)',
        }}
      >
        <div
          style={{
            width: `${PROMOTE_PCT}%`,
            background: ZONE_COLORS.promotion,
          }}
        />
        <div
          style={{
            width: `${SAFE_PCT}%`,
            background: ZONE_COLORS.safe,
          }}
        />
        <div
          style={{
            width: `${RELEGATE_PCT}%`,
            background: ZONE_COLORS.relegation,
          }}
        />
      </div>
    </div>
  );
};

export default PromoteRelegateBar;
