import React from 'react';
import {
  inkSoft, inkFaint, inkGhost,
  hairlineDark,
  gold, greenLive, danger,
} from '../../utils/heroAtmosphere';

export interface StatsShape {
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
}

/**
 * <StatsGrid> — single rounded panel with internal hairline dividers.
 * BIRDIES uses the celebration colour:
 *   - `gold` for finished tournaments (results state, completed scorecard)
 *   - `greenLive` for live rounds
 * EAGLES/BOGEYS/DOUBLES ghost to `inkGhost` when the value is 0.
 */
export function StatsGrid({ stats }: { stats: StatsShape }) {
  const positiveColor = gold; // Birdies are always gold across all states

  const items = [
    { v: stats.eagles, label: 'EAGLES', color: stats.eagles > 0 ? '#fff' : inkGhost },
    { v: stats.birdies, label: 'BIRDIES', color: stats.birdies > 0 ? positiveColor : inkGhost },
    { v: stats.pars, label: 'PARS', color: inkSoft },
    { v: stats.bogeys, label: 'BOGEYS', color: stats.bogeys > 0 ? danger : inkGhost },
    { v: stats.doubleBogeys, label: 'DOUBLES', color: stats.doubleBogeys > 0 ? danger : inkGhost },
  ];

  return (
    <div
      style={{
        display: 'flex',
        background: 'transparent',
        borderTop: `1px solid ${hairlineDark}`,
        borderBottom: `1px solid ${hairlineDark}`,
        padding: '10px 0',
        marginBottom: 14,
      }}
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: 1, textAlign: 'center', minWidth: 0,
            borderLeft: i > 0 ? `1px solid ${hairlineDark}` : 'none',
          }}
        >
          <div
            style={{
              fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {s.v}
          </div>
          <div
            style={{
              fontSize: 8, fontWeight: 800, color: inkFaint,
              letterSpacing: '0.12em', marginTop: 6,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
