import { describe, expect, it } from 'vitest';

import { trajectoryPoints } from '@/features/tourhub/components/overview-v3/HybridHeroBands/TrajectorySparkline';
import { classifyTrajectory } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

// Par 70: 62-67-68-71 is -8,-3,-2,+1; 71-68-67-62 is +1,-2,-3,-8.
const fast = [-8, -3, -2, 1];
const late = [1, -2, -3, -8];

describe('TrajectorySparkline reads round_N as to-par', () => {
  it('plots a plain cumulative to-par sum', () => {
    expect(trajectoryPoints([-8, -3, -2])).toEqual([-8, -11, -13]);
  });
  it('opposite rounds produce opposite shapes', () => {
    expect(trajectoryPoints(fast)).toEqual([-8, -11, -13, -12]);
    expect(trajectoryPoints(late)).toEqual([1, -1, -4, -12]);
    const steps = (p: number[]) => p.slice(1).map((v, i) => v - p[i]);
    expect(steps(trajectoryPoints(fast))).toEqual([-3, -2, 1]);
    expect(steps(trajectoryPoints(late))).toEqual([-2, -3, -8]);
  });
  it('classifies without a par term', () => {
    expect(classifyTrajectory(fast)).toBe('faded');
    expect(classifyTrajectory(late)).toBe('climbed');
    expect(classifyTrajectory([-2, -2, -2])).toBe('steady');
  });
});
