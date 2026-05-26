import { describe, it, expect } from 'vitest';
import { buildLeaderboardSlots } from '../HybridHero.utils';

const e = (position: number, score: number) => ({ position, score });

describe('buildLeaderboardSlots', () => {
  it('no ties — 4 solo chasers fill all slots', () => {
    const chasers = [e(2, -8), e(3, -7), e(4, -6), e(5, -5)];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(4);
    expect(slots.every(s => s.kind === 'solo')).toBe(true);
    expect(slots.map(s => (s as any).entry.position)).toEqual([2, 3, 4, 5]);
  });

  it('3-way tie at T2 fits (group of 3 + 1 solo)', () => {
    const chasers = [e(2, -7), e(2, -7), e(2, -7), e(5, -5)];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(4);
    expect(slots.map(s => s.kind)).toEqual(['solo', 'solo', 'solo', 'solo']);
    expect((slots[3] as any).entry.position).toBe(5);
  });

  it('4-way tie at T2 collapses to a single tie slot', () => {
    const chasers = [e(2, -7), e(2, -7), e(2, -7), e(2, -7)];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ kind: 'tie', rank: 'T2', count: 4, score: -7 });
  });

  it('2-way at T2 (fits) + 3-way at T4 (collapses, no room left)', () => {
    const chasers = [e(2, -7), e(2, -7), e(4, -5), e(4, -5), e(4, -5)];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({ kind: 'solo' });
    expect(slots[1]).toMatchObject({ kind: 'solo' });
    expect(slots[2]).toMatchObject({ kind: 'tie', rank: 'T4', count: 3, score: -5 });
  });

  it('8-way tie at T2 collapses, then fills remaining slots from position 10', () => {
    const chasers = [
      ...Array.from({ length: 8 }, () => e(2, -6)),
      e(10, -4),
      e(11, -3),
      e(12, -2),
      e(13, -1),
    ];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(4);
    expect(slots[0]).toMatchObject({ kind: 'tie', rank: 'T2', count: 8 });
    expect(slots.slice(1).every(s => s.kind === 'solo')).toBe(true);
    expect(slots.slice(1).map(s => (s as any).entry.position)).toEqual([10, 11, 12]);
  });

  it('empty chasers → []', () => {
    expect(buildLeaderboardSlots([])).toEqual([]);
  });

  it('chasers shorter than maxSlots → returns however many fit', () => {
    const chasers = [e(2, -7), e(3, -6)];
    const slots = buildLeaderboardSlots(chasers);
    expect(slots).toHaveLength(2);
    expect(slots.every(s => s.kind === 'solo')).toBe(true);
  });
});
