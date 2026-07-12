import React from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { HoleDistributionBar } from './HoleDistributionBar';
import { FONT, INK, MONO, SC_BIRDIE, SC_DOUBLE } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';

interface Props {
  hardest: CourseHole;
  easiest: CourseHole;
}

const Card: React.FC<{
  tone: 'hard' | 'easy';
  label: string;
  hole: CourseHole;
}> = ({ tone, label, hole }) => {
  // Tint derived from the actual scoring palette
  const tint = tone === 'hard' ? 'rgba(155,71,34,0.06)' : 'rgba(47,107,79,0.06)';
  const border = tone === 'hard' ? 'rgba(155,71,34,0.20)' : 'rgba(47,107,79,0.20)';
  const eyebrow = tone === 'hard' ? SC_DOUBLE : SC_BIRDIE;
  const playsTo = (hole.par + hole.avg_to_par).toFixed(1);
  return (
    <div
      style={{
        flex: 1,
        background: tint,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: eyebrow,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 300,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hole.hole_no}
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: INK_MUTE,
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Plays to {playsTo}
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginTop: -2,
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Par {hole.par}{hole.stroke_index != null ? ` · SI ${hole.stroke_index}` : ''}
      </div>
      <HoleDistributionBar dist={hole.dist} height={5} />
    </div>
  );
};

export const HoleFeatureCards: React.FC<Props> = ({ hardest, easiest }) => (
  <div
    style={{
      padding: '16px 16px',
      display: 'flex',
      gap: 12,
    }}
  >
    <Card tone="hard" label="Hardest" hole={hardest} />
    <Card tone="easy" label="Easiest" hole={easiest} />
  </div>
);

export default HoleFeatureCards;
