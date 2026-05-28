import React from 'react';
import type { HoleDistribution } from '@/hooks/gam/useCourseHoleAnalysis';
import { C_BIRDIE, C_PAR, C_BOGEY, C_DOUBLE } from './_constants';

interface Props {
  dist: HoleDistribution;
  height?: number;
}

export const HoleDistributionBar: React.FC<Props> = ({ dist, height = 6 }) => {
  const segs: Array<{ v: number; c: string }> = [
    { v: dist.birdie_better, c: C_BIRDIE },
    { v: dist.par, c: C_PAR },
    { v: dist.bogey, c: C_BOGEY },
    { v: dist.double_worse, c: C_DOUBLE },
  ];
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height,
        borderRadius: height,
        overflow: 'hidden',
        background: '#eef1f5',
      }}
    >
      {segs.map((s, i) =>
        s.v > 0 ? (
          <div
            key={i}
            style={{ width: `${s.v}%`, background: s.c, height: '100%' }}
          />
        ) : null,
      )}
    </div>
  );
};

export default HoleDistributionBar;
