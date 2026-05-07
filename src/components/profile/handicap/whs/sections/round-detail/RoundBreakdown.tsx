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

const SCORE_COLORS: Record<string, string> = {
  Eagle: '#FBBC2E',
  Birdie: '#F7931E',
  Par: 'rgba(15,23,42,0.40)',
  Bogey: '#DC2626',
  'Dbl+': '#991B1B',
};

export const RoundBreakdown: React.FC<Props> = ({ holes }) => {
  const buckets = useMemo<Bucket[]>(() => {
    let eagles = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let dblPlus = 0;
    for (const h of holes) {
      if (!h.played) continue;
      const strokes = h.adjusted_gross ?? h.actual_gross;
      if (strokes === null || strokes === undefined || h.par == null) continue;
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
    <div style={{ padding: '20px 16px 0' }}>
      <p
        style={{
          margin: '0 0 10px',
          padding: '0 4px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: INK_MUTE,
          textTransform: 'uppercase',
          fontFamily: FONT_DISPLAY,
        }}
      >
        Score breakdown
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {buckets.map((b) => {
          const has = b.count > 0;
          const color = SCORE_COLORS[b.label];
          return (
            <div
              key={b.label}
              style={{
                position: 'relative',
                background: '#fff',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 10,
                padding: '14px 6px 10px',
                textAlign: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: color,
                  opacity: has ? 1 : 0.25,
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: has ? INK : INK_FAINT,
                  fontFamily: FONT_DISPLAY,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {b.count}
              </p>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: INK_MUTE,
                  textTransform: 'uppercase',
                  fontFamily: FONT_DISPLAY,
                }}
              >
                {b.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoundBreakdown;
