import React from 'react';
import type { HoleDistribution } from '@/hooks/gam/useCourseHoleAnalysis';
import {
  SC_ACE,
  SC_ALBATROSS,
  SC_EAGLE,
  SC_BIRDIE,
  SC_PAR,
  SC_BOGEY,
  SC_DOUBLE,
} from './_constants';

interface Props {
  dist: HoleDistribution;
  height?: number;
}

export const HoleDistributionBar: React.FC<Props> = ({ dist, height = 6 }) => {
  const segs: Array<{ v: number; c: string }> = [
    { v: dist.ace,       c: SC_ACE },
    { v: dist.albatross, c: SC_ALBATROSS },
    { v: dist.eagle,     c: SC_EAGLE },
    { v: dist.birdie,    c: SC_BIRDIE },
    { v: dist.par,       c: SC_PAR },
    { v: dist.bogey,     c: SC_BOGEY },
    { v: dist.double,    c: SC_DOUBLE },
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
