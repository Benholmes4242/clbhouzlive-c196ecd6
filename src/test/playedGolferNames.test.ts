/** COURSES PAGE — NAME THE GOLFERS: the faces line names golfers instead of counting them. */
import { describe, expect, it } from 'vitest';
import { golfersLine, orderGolfers } from '@/components/courses/browse/playedRings';

const row = (id: string, user: string, date: string, name: string | null = null) => ({ whs_score_id: id, user_id: user, play_date: date, display_name: name });
const NO = new Map();

describe('golfersLine names the golfers', () => {
  it('1 golfer: full name', () => {
    expect(golfersLine(['Andrew Yetzes'], false, 1, true)).toEqual({ bold: 'Andrew Yetzes', rest: ' played here lately' });
  });
  it('2 and 3 golfers: first names', () => {
    expect(golfersLine(['Andrew Yetzes', 'Ben Hall'], false, 2, true).bold).toBe('Andrew and Ben');
    expect(golfersLine(['Andrew Yetzes', 'Ben Hall', 'Tom Lee'], false, 3, true).bold).toBe('Andrew, Ben and Tom');
  });
  it('4+ golfers: two first names and N others', () => {
    expect(golfersLine(['Andrew Yetzes', 'Ben Hall', 'Tom Lee', 'Al B', 'C D', 'E F', 'G H', 'I J'], false, 8, true))
      .toEqual({ bold: 'Andrew, Ben and 6 others', rest: ' played here lately' });
  });
  it('the viewer first as You in 1, 2 and 4+ golfer groups', () => {
    expect(golfersLine(['Me Myself'], true, 1, true).bold).toBe('You');
    expect(golfersLine(['Me Myself', 'Andrew Yetzes'], true, 2, true).bold).toBe('You and Andrew');
    expect(golfersLine(['Me Myself', 'Andrew Yetzes', 'Ben Hall', 'a b', 'c d', 'e f', 'g h', 'i j'], true, 8, true).bold).toBe('You, Andrew and 6 others');
  });
  it('shared-only wording', () => {
    expect(golfersLine(['Andrew Yetzes', 'Ben Hall'], false, 2, false)).toEqual({ bold: 'Andrew and Ben', rest: ' shared it lately' });
  });
  it('a nameless golfer is not named but still counted', () => {
    expect(golfersLine(['Andrew Yetzes', null], false, 2, true).bold).toBe('Andrew and 1 other');
    expect(golfersLine(['Andrew Yetzes', null, 'Ben Hall', 'Tom Lee'], false, 4, true).bold).toBe('Andrew, Ben and 2 others');
  });
});

describe('orderGolfers', () => {
  it('falls back to faces displayName, then username', () => {
    const faces = new Map([['a', { displayName: null, username: 'andyy' }], ['b', { displayName: 'Ben Hall', username: 'bh' }]]);
    const g = orderGolfers([row('1', 'a', '2026-11-10'), row('2', 'b', '2026-11-09')], [], faces, null);
    expect(g.names).toEqual(['andyy', 'Ben Hall']);
    expect(golfersLine(g.names, g.viewer, g.total, true).bold).toBe('andyy and Ben');
  });
  it('orders by most recent round, ties by whs_score_id desc, distinct golfers', () => {
    const g = orderGolfers([row('1', 'old', '2026-11-01', 'Old Timer'), row('5', 'tie', '2026-11-08', 'Tie High'), row('3', 'low', '2026-11-08', 'Tie Low'), row('9', 'old', '2026-11-02', 'Old Timer'), row('2', 'new', '2026-11-10', 'New Kid')], [], NO, null);
    expect(g.names).toEqual(['New Kid', 'Tie High', 'Tie Low', 'Old Timer']);
    expect(g.total).toBe(4);
  });
  it('puts the viewer first', () => {
    const g = orderGolfers([row('1', 'a', '2026-11-10', 'Andrew Yetzes'), row('2', 'me', '2026-11-01', 'Me Myself')], [], NO, 'me');
    expect(g.viewer).toBe(true);
    expect(golfersLine(g.names, g.viewer, g.total, true).bold).toBe('You and Andrew');
  });
  it('uses group faces when there are no rounds', () => {
    const g = orderGolfers([], [{ userId: 'a', name: 'Andrew Yetzes' }, { userId: 'b', name: 'Ben Hall' }], NO, null);
    expect(golfersLine(g.names, g.viewer, g.total, false)).toEqual({ bold: 'Andrew and Ben', rest: ' shared it lately' });
  });
});
