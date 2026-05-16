import React, { useMemo } from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';

interface Props {
  holes: WhsScoreHole[];
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = '#0F172A';
const INK_45 = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const RED = '#EF4444';
const MAROON = '#991B1B';

interface ChipDef {
  color: string;
  value: number;
  label: string;
  alwaysShow?: boolean;
}

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

  const chips: ChipDef[] = [];
  if (counts.ace > 0)
    chips.push({ color: AMBER, value: counts.ace, label: counts.ace === 1 ? 'ACE' : 'ACES' });
  if (counts.eagle > 0)
    chips.push({ color: AMBER, value: counts.eagle, label: counts.eagle === 1 ? 'EAGLE' : 'EAGLES' });
  if (counts.birdie > 0)
    chips.push({ color: AMBER, value: counts.birdie, label: counts.birdie === 1 ? 'BIRDIE' : 'BIRDIES' });
  chips.push({ color: INK_45, value: counts.par, label: counts.par === 1 ? 'PAR' : 'PARS', alwaysShow: true });
  chips.push({ color: RED, value: counts.bogey, label: counts.bogey === 1 ? 'BOGEY' : 'BOGEYS', alwaysShow: true });
  if (counts.doublePlus > 0)
    chips.push({ color: MAROON, value: counts.doublePlus, label: 'DBL+' });

  return (
    <div style={{ padding: '12px 0 16px', fontFamily: FONT_GEIST }}>
      <div style={{ height: 0.5, background: 'rgba(15,23,42,0.15)', margin: '0 18px' }} />
      <div style={{ padding: '0 18px', margin: '12px 0 10px' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          BREAKDOWN
        </span>
      </div>
      <div style={{ padding: '0 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((c, i) => (
          <span
            key={`c-${i}-${c.label}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'var(--hcp-bg-1)',
              border: `0.5px solid ${HAIRLINE}`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: c.color,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--hcp-t-100)',
                fontFamily: FONT_MONO,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {c.value}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: INK_45,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              {c.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default RoundBreakdown;
