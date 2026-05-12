import React, { useMemo } from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
}

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const AMBER = '#F7931E';

export const RoundBreakdown: React.FC<Props> = ({ holes }) => {
  const counts = useMemo(() => {
    const c = { ace: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, doublePlus: 0 };
    for (const h of holes) {
      if (!h.played) continue;
      const strokes = h.adjusted_gross ?? h.actual_gross;
      if (strokes === null || strokes === undefined || h.par == null) continue;
      if (strokes === 1) {
        c.ace++;
        continue;
      }
      const diff = strokes - h.par;
      if (diff <= -2) c.eagle++;
      else if (diff === -1) c.birdie++;
      else if (diff === 0) c.par++;
      else if (diff === 1) c.bogey++;
      else c.doublePlus++;
    }
    return c;
  }, [holes]);

  const chips: Array<{ color: string; value: number; label: string }> = [];
  if (counts.ace > 0) chips.push({ color: HOLE_GOLD, value: counts.ace, label: 'ACE' });
  if (counts.eagle > 0)
    chips.push({
      color: EAGLE_GREEN,
      value: counts.eagle,
      label: counts.eagle === 1 ? 'EAGLE' : 'EAGLES',
    });
  if (counts.birdie > 0)
    chips.push({
      color: BIRDIE_GREEN,
      value: counts.birdie,
      label: counts.birdie === 1 ? 'BIRDIE' : 'BIRDIES',
    });
  chips.push({
    color: INK_55,
    value: counts.par,
    label: counts.par === 1 ? 'PAR' : 'PARS',
  });
  chips.push({
    color: BOGEY_RED,
    value: counts.bogey,
    label: counts.bogey === 1 ? 'BGY' : 'BGYS',
  });
  if (counts.doublePlus > 0)
    chips.push({ color: DOUBLE_RED, value: counts.doublePlus, label: 'DBL+' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 14,
        padding: '14px 16px 12px',
        borderTop: `1px solid rgba(15,23,42,0.08)`,
      }}
    >
      {chips.map((c, i) => (
        <span
          key={`c-${i}-${c.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: c.color,
              alignSelf: 'center',
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {c.value}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: INK_55,
              letterSpacing: '0.10em',
            }}
          >
            {c.label}
          </span>
        </span>
      ))}
    </div>
  );
};

export default RoundBreakdown;
