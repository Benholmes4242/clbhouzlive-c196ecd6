import { describe, it, expect } from 'vitest';
import { FLOOR_LADDER, floorTarget, floorScalePosition, countMeeting } from './floor';

describe('floorTarget (§6.2)', () => {
  it('the target is the next milestone below the current index', () => {
    expect(floorTarget(24)!.key).toBe('bogeyGolf');
    expect(floorTarget(24)!.index).toBe(18.0);
    expect(floorTarget(15)!.key).toBe('singleFigures');
    expect(floorTarget(7)!.key).toBe('categoryOne');
    expect(floorTarget(2)!.key).toBe('scratch');
  });

  it('a rung must be strictly BELOW the current index', () => {
    // Exactly on a rung: that rung is not below, so the next one down is the target.
    expect(floorTarget(9.9)!.key).toBe('categoryOne');
    expect(floorTarget(18.0)!.key).toBe('singleFigures');
  });

  it('at or below scratch there is no rung left and the section does not render', () => {
    expect(floorTarget(0)).toBeNull();
    expect(floorTarget(-0.4)).toBeNull();
  });

  it('above bogey golf the target is bogey golf', () => {
    expect(floorTarget(36)!.key).toBe('bogeyGolf');
  });

  it('the ladder is the four rungs of §6.2', () => {
    expect(FLOOR_LADDER.map((r) => r.index)).toEqual([18.0, 9.9, 5.4, 0.0]);
  });
});

describe('floorScalePosition (§6.3)', () => {
  it('0 at the twelve-month high, 1 at the target, proportional between', () => {
    expect(floorScalePosition(20, 9.9, 20)).toBe(0);
    expect(floorScalePosition(20, 9.9, 9.9)).toBe(1);
    expect(floorScalePosition(20, 9.9, 14.95)).toBeCloseTo(0.5, 5);
  });

  it('clamps to the bar', () => {
    expect(floorScalePosition(20, 9.9, 22)).toBe(0);
    expect(floorScalePosition(20, 9.9, 8)).toBe(1);
  });

  it('a degenerate scale (high at or below target) parks at the target end', () => {
    expect(floorScalePosition(9.9, 9.9, 12)).toBe(1);
  });
});

describe('countMeeting (§6.4)', () => {
  it('counts differentials at or better than the target', () => {
    const diffs = [8.2, 12.4, 9.9, 15.1, 9.8, 22.0];
    expect(countMeeting(diffs, 9.9)).toBe(3);
    expect(countMeeting(diffs, 5.4)).toBe(0);
    expect(countMeeting([], 9.9)).toBe(0);
  });
});
