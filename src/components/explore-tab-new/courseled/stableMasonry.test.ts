import { describe, expect, it } from 'vitest';
import { splitMasonry } from '@/components/explore-tab-new/courseled/stableMasonry';
import { createMasonryAssignment, placeStable } from '@/components/explore-tab-new/courseled/stableMasonry';

const H = [206, 168, 146, 130, 122, 116];
const mk = (keys: string[]) => keys.map((slotKey, i) => ({ slotKey, height: H[Math.min(i, 5)] }));
const colOf = (cols: { slotKey: string }[][], k: string) =>
  cols.findIndex((c) => c.some((t) => t.slotKey === k));

describe('ATW masonry stability on a focus refetch', () => {
  const before = ['A', 'B', 'C', 'D', 'E', 'F'];
  const after = ['NEW', 'A', 'B', 'C', 'D', 'E'];

  it('greedy split reshuffles existing tiles (the defect)', () => {
    const b = splitMasonry(mk(before), (t) => t.height).columns;
    const a = splitMasonry(mk(after), (t) => t.height).columns;
    const moved = before.filter((k) => colOf(a, k) >= 0 && colOf(a, k) !== colOf(b, k));
    expect(moved).toEqual(['A', 'C', 'D', 'E']);
  });

  it('stable placement holds every surviving tile in its column', () => {
    const asg = createMasonryAssignment();
    const b = placeStable(mk(before), asg).columns;
    const a = placeStable(mk(after), asg).columns;
    const moved = before.filter((k) => colOf(a, k) >= 0 && colOf(a, k) !== colOf(b, k));
    expect(moved).toEqual([]);
  });

  it('new tiles go to the shorter column and are then remembered', () => {
    const asg = createMasonryAssignment();
    placeStable(mk(before), asg);
    const a = placeStable(mk(after), asg).columns;
    expect(colOf(a, 'NEW')).toBeGreaterThanOrEqual(0);
    const again = placeStable(mk(after), asg).columns;
    expect(colOf(again, 'NEW')).toBe(colOf(a, 'NEW'));
  });

  it('drops tiles that leave the page rather than resurrecting a stale column', () => {
    const asg = createMasonryAssignment();
    placeStable(mk(before), asg);
    placeStable(mk(['A', 'B']), asg);
    expect([...asg.byKey.keys()].sort()).toEqual(['A', 'B']);
  });
});
