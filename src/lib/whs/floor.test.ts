import { describe, it, expect } from 'vitest';
import { FLOOR_LADDER, floorTarget, floorScalePosition, countMeeting } from './floor';

describe('floorTarget (§6.2)', () => {
  it.each([
    [1.5, 'scratch', 0.0],
    [5.0, 'scratch', 0.0],
    [7.0, 'categoryOne', 5.4],
    [10.0, 'singleFigures', 9.9],
    [17.0, 'categoryTwo', 11.4],
    [24.0, 'categoryThree', 18.4],
    [28.0, 'categoryFour', 26.4],
  ])('index %s selects %s at %s', (current, key, index) => {
    expect(floorTarget(current)).toEqual({ key, index });
  });

  it.each([
    [26.4, 'categoryThree', 18.4],
    [18.4, 'categoryTwo', 11.4],
    [11.4, 'singleFigures', 9.9],
    [9.9, 'categoryOne', 5.4],
    [5.4, 'scratch', 0.0],
  ])('index exactly %s selects the strictly lower %s at %s', (current, key, index) => {
    expect(floorTarget(current)).toEqual({ key, index });
  });

  it('at or below scratch there is no rung left and the section does not render', () => {
    expect(floorTarget(0)).toBeNull();
    expect(floorTarget(-0.4)).toBeNull();
  });

  it('above category four the target is category four', () => {
    expect(floorTarget(36)).toEqual({ key: 'categoryFour', index: 26.4 });
  });

  it('the ladder is the six rungs of amendment 6A', () => {
    expect(FLOOR_LADDER.map((r) => r.index)).toEqual([26.4, 18.4, 11.4, 9.9, 5.4, 0.0]);
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
