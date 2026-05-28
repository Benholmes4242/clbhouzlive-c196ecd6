import React from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { HoleDistributionBar } from './HoleDistributionBar';
import { FONT, INK } from './_constants';

interface Props {
  hardest: CourseHole;
  easiest: CourseHole;
}

const Card: React.FC<{
  tone: 'hard' | 'easy';
  label: string;
  hole: CourseHole;
}> = ({ tone, label, hole }) => {
  const tint = tone === 'hard' ? '#fef2f2' : '#f0fdf4';
  const border = tone === 'hard' ? 'rgba(220,38,38,0.18)' : 'rgba(22,163,74,0.18)';
  const eyebrow = tone === 'hard' ? '#dc2626' : '#16a34a';
  const playsTo = (hole.par + hole.avg_to_par).toFixed(1);
  return (
    <div
      style={{
        flex: 1,
        background: tint,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: '14px 14px 12px',
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
            fontFeatureSettings: '"kern" 1, "liga" 1',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hole.hole_no}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>
          Plays to {playsTo}
        </div>
      </div>
      <HoleDistributionBar dist={hole.dist} height={5} />
    </div>
  );
};

export const HoleFeatureCards: React.FC<Props> = ({ hardest, easiest }) => (
  <div
    style={{
      padding: '14px 18px 18px',
      display: 'flex',
      gap: 10,
    }}
  >
    <Card tone="hard" label="Hardest" hole={hardest} />
    <Card tone="easy" label="Easiest" hole={easiest} />
  </div>
);

export default HoleFeatureCards;
