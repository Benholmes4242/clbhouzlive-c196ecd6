import React from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { HoleDistributionBar } from './HoleDistributionBar';
import { AMBER, C_BIRDIE, C_BOGEY, C_DOUBLE, C_PAR, FONT, INK } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

interface Props {
  h: CourseHole;
  maxAvg: number;
  isHardest?: boolean;
  isEasiest?: boolean;
}

export const HoleRow: React.FC<Props> = ({ h, maxAvg, isHardest, isEasiest }) => {
  const pct = Math.max(0, Math.min(1, h.avg_to_par / maxAvg));
  // Difficulty ramp — independent of celebrate-amber: slate → red → maroon
  const avgColor = pct > 0.75 ? C_DOUBLE : pct > 0.45 ? C_BOGEY : C_PAR;
  const tag = isHardest ? { label: 'HARDEST', c: C_DOUBLE } : isEasiest ? { label: 'EASIEST', c: AMBER } : null;
  const sign = h.avg_to_par > 0 ? '+' : '';
  const avgFmt = `${sign}${h.avg_to_par.toFixed(2).replace(/\.?0+$/, (m) => (m.includes('.') ? '' : m))}`;

  const metaParts: string[] = [`Par ${h.par}`];
  if (h.yards != null) metaParts.push(`${h.yards} yds`);
  if (h.stroke_index != null) metaParts.push(`SI ${h.stroke_index}`);

  return (
    <div
      style={{
        padding: '14px 18px',
        borderTop: '1px solid rgba(15,23,42,0.06)',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '34%',
            background: '#F1F5F9',
            border: '1px solid rgba(15,23,42,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: INK,
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {h.hole_no}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: INK_MUTE,
              letterSpacing: '0.01em',
            }}
          >
            {metaParts.join(' · ')}
          </div>
          {tag && (
            <div
              style={{
                marginTop: 3,
                display: 'inline-block',
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: tag.c,
              }}
            >
              {tag.label}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: avgColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
          }}
        >
          {avgFmt}
        </div>
      </div>

      {/* Difficulty slider */}
      <div
        style={{
          width: '100%',
          height: 3,
          borderRadius: 3,
          background: '#eef1f5',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: avgColor,
            transition: 'width 240ms cubic-bezier(.22,.61,.36,1)',
          }}
        />
      </div>

      <HoleDistributionBar dist={h.dist} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.02em',
          color: INK_MUTE,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: C_BIRDIE }}>{h.dist.birdie_better}%</span>
          <span style={{ color: C_PAR }}>{h.dist.par}%</span>
          <span style={{ color: C_BOGEY }}>{h.dist.bogey}%</span>
          <span style={{ color: C_DOUBLE }}>{h.dist.double_worse}%</span>
        </div>
        <div>
          {h.rounds.toLocaleString()} round{h.rounds === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
};

export default HoleRow;
