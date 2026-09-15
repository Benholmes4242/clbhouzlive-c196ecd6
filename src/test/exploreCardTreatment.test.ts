import { describe, expect, it } from 'vitest';

import {
  cardTreatments,
  earnsHeroTreatment,
} from '@/features/explore-magazine/cardTreatment';
import { shelfDueAt, shelfForOrdinal } from '@/features/explore-magazine/shelfCadence';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

function item(id: string, patch: Partial<StreamItem> = {}): StreamItem {
  return {
    id,
    kind: 'round',
    ring: 'own',
    lane: 'news',
    score: 1,
    consequence: null,
    subject: null,
    who: null,
    facts: {},
    payload: {},
    seen: false,
    ...patch,
  };
}

describe('earned Explore card treatment', () => {
  it.each([
    ['record taken', item('a', { consequence: { kind: 'record_taken' } })],
    ['record lost', item('a', { consequence: { kind: 'record_lost' } })],
    ['rank up', item('a', { consequence: { kind: 'rank_up' } })],
    ['ace', item('a', { facts: { holes_in_one: 1 } })],
    ['albatross', item('a', { facts: { albatrosses: 1 } })],
    ['under par', item('a', { facts: { to_par: -1 } })],
  ])('admits %s', (_label, candidate) => {
    expect(earnsHeroTreatment(candidate)).toBe(true);
  });

  it('rejects ordinary rounds and consequences outside the ruling', () => {
    expect(earnsHeroTreatment(item('plain'))).toBe(false);
    expect(earnsHeroTreatment(item('down', { consequence: { kind: 'rank_down' } }))).toBe(false);
  });

  it('keeps the lead heroic and demotes eligible cards until three standards intervene', () => {
    const rows = [
      item('lead'),
      item('eligible-2', { facts: { to_par: -1 } }),
      item('plain-3'),
      item('plain-4'),
      item('eligible-5', { facts: { holes_in_one: 1 } }),
    ];
    expect([...cardTreatments(rows).values()]).toEqual([
      'hero',
      'standard',
      'standard',
      'standard',
      'hero',
    ]);
  });

  it('never reorders or omits an item when the cap binds', () => {
    const rows = [item('a'), item('b', { facts: { to_par: -2 } }), item('c')];
    expect([...cardTreatments(rows).keys()]).toEqual(rows.map((row) => row.id));
  });
});

describe('Explore shelf cadence', () => {
  const scores = ['clubWeek', 'standing', 'coursesCounty', 'people'] as const;

  it('starts after three cards and then leaves four cards between slots', () => {
    expect([0, 1, 2, 3, 4].map(shelfDueAt)).toEqual([3, 7, 11, 15, 19]);
  });

  it('restarts Scores from This week without ever adding circle', () => {
    const sequence = Array.from({ length: 9 }, (_, ordinal) => shelfForOrdinal(scores, ordinal, true));
    expect(sequence).toEqual([
      'clubWeek', 'standing', 'coursesCounty', 'people',
      'clubWeek', 'standing', 'coursesCounty', 'people',
      'clubWeek',
    ]);
    expect(sequence).not.toContain('circle');
  });

  it('keeps an ordinal slot even when its renderer later resolves empty', () => {
    expect(shelfForOrdinal(scores, 1, true)).toBe('standing');
    expect(shelfDueAt(2) - shelfDueAt(1)).toBe(4);
  });

  it('allows finite shelf sequences to stop after one pass', () => {
    expect(shelfForOrdinal(['a', 'b'], 2, false)).toBeNull();
  });
});