import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';
import {
  SC_EAGLE_DARK,
  SC_BIRDIE_DARK,
  SC_BOGEY_DARK,
  SC_DOUBLE_DARK,
} from '@/features/courses/components/holes/_constants';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  holes: WhsScoreHole[];
}

interface Dot {
  size: number;
  color: string; // 'transparent' for par/no-data
  borderColor?: string;
  key: string | number;
}

function dotFor(h: WhsScoreHole): Dot {
  if (!h.played || h.actual_gross == null || h.par == null) {
    return { size: 4, color: 'transparent', borderColor: 'rgba(255,255,255,0.15)', key: h.hole_no };
  }
  const diff = h.actual_gross - h.par;
  const abs = Math.abs(diff);
  if (diff === 0) {
    return { size: 4, color: 'transparent', borderColor: 'rgba(255,255,255,0.35)', key: h.hole_no };
  }
  // Cinema card sits on a charcoal surface — use the SC_*_DARK ramp.
  let color = SC_BIRDIE_DARK;
  if (diff <= -2) color = SC_EAGLE_DARK;
  else if (diff === -1) color = SC_BIRDIE_DARK;
  else if (diff === 1) color = SC_BOGEY_DARK;
  else if (diff >= 2) color = SC_DOUBLE_DARK;
  const size = abs === 1 ? 6 : 8;
  return { size, color, key: h.hole_no };
}

export const CinemaCardShapeStrip: React.FC<Props> = ({ holes }) => {
  // Take first 18 holes ordered by hole_no
  const ordered = [...holes].sort((a, b) => a.hole_no - b.hole_no).slice(0, 18);
  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    fontFamily: FONT_SF,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={labelStyle}>HOLE 1</span>
        <span style={labelStyle}>SHAPE OF THE ROUND</span>
        <span style={labelStyle}>18</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 12 }}>
        {ordered.map((h) => {
          const d = dotFor(h);
          return (
            <div
              key={d.key}
              style={{
                width: d.size,
                height: d.size,
                borderRadius: 999,
                background: d.color,
                border: d.borderColor ? `1px solid ${d.borderColor}` : 'none',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CinemaCardShapeStrip;
