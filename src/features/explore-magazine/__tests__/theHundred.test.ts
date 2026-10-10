import { describe, expect, it } from 'vitest';
import {
  firstUnplayedIndex, hundredRailScroll, hundredSlab, hundredPlaceholderHeight,
  HUNDRED_SLAB_HEIGHT, HUNDRED_STRIP_HEIGHT, HUNDRED_ROWS_HEIGHT,
} from '../theHundred';

const row = (user_id: string, value: number, pos: number, is_viewer = false) => ({
  user_id, display_name: user_id, value, pos, total_members: 58, is_viewer,
});

describe('The Hundred slab', () => {
  it('mid-table: behind the leader by the gap', () => {
    expect(hundredSlab([row('a', 37, 1), row('b', 20, 2), row('me', 12, 3, true)], 'me'))
      .toEqual({ kind: 'played', n: 12, pos: 3, total: 58, clause: { kind: 'behind', gap: 25, leader: 'a' } });
  });
  it('leading: clear of second', () => {
    const s = hundredSlab([row('me', 37, 1, true), row('b', 30, 2)], 'me');
    expect(s.kind === 'played' && s.clause).toEqual({ kind: 'clear', gap: 7, second: 'b' });
  });
  it('leading alone or tied at the top: no clause', () => {
    const alone = hundredSlab([row('me', 37, 1, true)], 'me');
    const tied = hundredSlab([row('me', 37, 1, true), row('b', 37, 1)], 'me');
    expect(alone.kind === 'played' && alone.clause).toBeNull();
    expect(tied.kind === 'played' && tied.clause).toBeNull();
  });
  it('tied with the leader but not first: no clause', () => {
    const s = hundredSlab([row('a', 37, 1), row('me', 37, 1, true)], 'me');
    expect(s.kind === 'played' && s.clause).toBeNull();
  });
  it('absent: zero', () => {
    expect(hundredSlab([row('a', 37, 1)], 'me')).toEqual({ kind: 'absent', n: 0 });
  });
});

describe('The Hundred rail scroll', () => {
  it('first unplayed at 0 or none unplayed leaves the rail at the start', () => {
    expect(firstUnplayedIndex([{ is_viewer_played: false }])).toBeNull();
    expect(firstUnplayedIndex([{ is_viewer_played: true }])).toBeNull();
    expect(hundredRailScroll(null, 16)).toBe(0);
  });
  it('index × (108 + 8) − 16', () => {
    expect(hundredRailScroll(1, 16)).toBe(100);
    expect(hundredRailScroll(37, 16)).toBe(4276);
  });
});

describe('The Hundred placeholders', () => {
  it('heights', () => {
    expect(HUNDRED_SLAB_HEIGHT).toBe(88);
    expect(HUNDRED_STRIP_HEIGHT).toBe(118);
    expect(HUNDRED_ROWS_HEIGHT).toBe(144);
    expect(hundredPlaceholderHeight(false)).toBe(334);
    expect(hundredPlaceholderHeight(true)).toBe(552);
  });
});
