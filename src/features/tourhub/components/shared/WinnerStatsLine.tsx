/**
 * WinnerStatsLine — compact stat summary shown below the winning margin on finished cards.
 * Shows holes-in-one (if any) · eagles (if any) · birdies (if any) · round count.
 * Omits any segment that is 0. Returns null when no stats are available.
 */

import React from 'react';
import type { WinnerStats } from '../../hooks/useWinnerScorecardStats';

interface WinnerStatsLineProps {
  stats: WinnerStats | null | undefined;
}

const DOT = (
  <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px', userSelect: 'none' }}>·</span>
);

export function WinnerStatsLine({ stats }: WinnerStatsLineProps) {
  if (!stats) return null;

  const segments: React.ReactNode[] = [];

  if (stats.holesInOne > 0) {
    segments.push(
      <span key="hio" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 500 }}>
        {stats.holesInOne} hole-in-one{stats.holesInOne > 1 ? 's' : ''}
      </span>
    );
  }

  if (stats.eagles > 0) {
    segments.push(
      <span key="eagles" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 500 }}>
        {stats.eagles} {stats.eagles === 1 ? 'eagle' : 'eagles'}
      </span>
    );
  }

  if (stats.birdies > 0) {
    segments.push(
      <span key="birdies" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 500 }}>
        {stats.birdies} {stats.birdies === 1 ? 'birdie' : 'birdies'}
      </span>
    );
  }

  segments.push(
    <span key="rounds" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 500 }}>
      {stats.rounds} {stats.rounds === 1 ? 'round' : 'rounds'}
    </span>
  );

  // Nothing meaningful to show (shouldn't happen but guard anyway)
  if (segments.length === 1 && stats.birdies === 0 && stats.eagles === 0 && stats.holesInOne === 0) {
    return null;
  }

  const interleaved = segments.reduce<React.ReactNode[]>((acc, seg, i) => {
    if (i > 0) acc.push(<React.Fragment key={`dot-${i}`}>{DOT}</React.Fragment>);
    acc.push(seg);
    return acc;
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
      {interleaved}
    </div>
  );
}
