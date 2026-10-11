import { describe, expect, it } from 'vitest';
import { climbCross, climbOrder, climbPlaceholderHeight, climbShare } from '@/features/explore-magazine/climb';

const row = (user_id: string, pos: number, start: number | null, improvement: number, is_tie = false, is_viewer = false) =>
  ({ user_id, pos, is_tie, start_index: start, improvement, is_viewer });

describe('the climb — share', () => {
  it('is the cut over the starting index', () => {
    expect(climbShare({ start_index: 20, improvement: 5 })).toBe(0.25);
  });
  it('is not a number for a null, zero or plus start', () => {
    expect(climbShare({ start_index: null, improvement: 2 })).toBeNull();
    expect(climbShare({ start_index: 0, improvement: 2 })).toBeNull();
    expect(climbShare({ start_index: -1.2, improvement: 0.8 })).toBeNull();
  });
});

describe('the climb — orders', () => {
  const field = [
    row('a', 1, 20, 6), // 30%
    row('b', 2, 10, 4), // 40%
    row('c', 3, 8, 3.2), // 40% — tie with b on the unrounded value
    row('n', 4, null, 3),
    row('z', 5, 0, 2.5),
    row('p', 6, -1.2, 0.8),
    row('e', 7, 2, 0.5), // 25%
  ];
  it('strokes keeps the RPC positions', () => {
    expect(climbOrder(field, 'strokes').map((p) => [p.row.user_id, p.pos, p.tie])).toEqual([
      ['a', 1, false], ['b', 2, false], ['c', 3, false], ['n', 4, false], ['z', 5, false], ['p', 6, false], ['e', 7, false],
    ]);
  });
  it('share uses competition ranking with ties; uncomputable rows sort last with a null position', () => {
    expect(climbOrder(field, 'share').map((p) => [p.row.user_id, p.pos, p.tie])).toEqual([
      ['b', 1, true], ['c', 1, true], ['a', 3, false], ['e', 4, false],
      ['n', null, false], ['z', null, false], ['p', null, false],
    ]);
  });
  it('no tie when unrounded shares differ even if both round to 45%', () => {
    const s = climbOrder([row('x', 1, 10, 4.52), row('y', 2, 10, 4.48)], 'share');
    expect(s.map((p) => [p.pos, p.tie])).toEqual([[1, false], [2, false]]);
  });
});

describe('the climb — cross-order sentence', () => {
  it('viewer first on the other order', () => {
    const f = [row('a', 1, 30, 6), row('me', 2, 8, 4, false, true)];
    expect(climbCross(f, 'strokes', 'me')).toEqual({ kind: 'first', pos: 2, tie: false });
  });
  it('better but not first', () => {
    const f = [row('a', 1, 30, 6), row('b', 2, 5, 4), row('me', 3, 10, 3, false, true)];
    expect(climbCross(f, 'strokes', 'me')).toEqual({ kind: 'better', pos: 3, tie: false, otherPos: 2, otherTie: false });
  });
  it('worse on the other order: nothing', () => {
    const f = [row('me', 1, 30, 6, false, true), row('b', 2, 5, 4)];
    expect(climbCross(f, 'strokes', 'me')).toEqual({ kind: 'none' });
  });
  it('absent or signed out: nothing', () => {
    const f = [row('a', 1, 30, 6), row('b', 2, 5, 4)];
    expect(climbCross(f, 'strokes', 'me')).toEqual({ kind: 'none' });
    expect(climbCross(f, 'strokes', null)).toEqual({ kind: 'none' });
  });
});

describe('the climb — reserved height', () => {
  it('is 246 for three rows', () => {
    expect(climbPlaceholderHeight(3)).toBe(246);
  });
});
