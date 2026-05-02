import React, { useMemo } from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const INK_FAINT = 'rgba(15,23,42,0.25)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const FONT_DISPLAY =
  'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Bucket {
  label: string;
  count: number;
}

const Stat: React.FC<{ label: string; count: number }> = ({ label, count }) => {
  const has = count > 0;
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: has ? INK : INK_FAINT,
          fontFamily: FONT_DISPLAY,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {count}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.12em',
        }}
      >
        {label.toUpperCase()}
      </p>
    </div>
  );
};

export const RoundBreakdown: React.FC<Props> = ({ holes }) => {
  const buckets = useMemo<Bucket[]>(() => {
    const played = holes.filter((h) => h.played);
    let eagles = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let dblPlus = 0;
    for (const h of played) {
      const strokes = h.adjusted_gross ?? h.actual_gross;
      if (strokes === null || strokes === undefined) continue;
      const stp = strokes - h.par;
      if (stp <= -2) eagles++;
      else if (stp === -1) birdies++;
      else if (stp === 0) pars++;
      else if (stp === 1) bogeys++;
      else dblPlus++;
    }
    return [
      { label: 'Eagle', count: eagles },
      { label: 'Birdie', count: birdies },
      { label: 'Par', count: pars },
      { label: 'Bogey', count: bogeys },
      { label: 'Dbl+', count: dblPlus },
    ];
  }, [holes]);

  return (
    <div
      style={{
        margin: '20px 20px 0',
        padding: '16px',
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 12,
      }}
    >
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 11,
          fontWeight: 800,
          color: INK_MUTE,
          letterSpacing: '0.18em',
        }}
      >
        SCORE BREAKDOWN
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: 8,
        }}
      >
        {buckets.map((b) => (
          <Stat key={b.label} label={b.label} count={b.count} />
        ))}
      </div>
    </div>
  );
};

export default RoundBreakdown;
