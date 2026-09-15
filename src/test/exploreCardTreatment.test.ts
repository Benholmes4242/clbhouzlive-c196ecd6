import { describe, expect, it } from 'vitest';

import { calloutFor, isNotableRound } from '@/features/explore-magazine/cardTreatment';
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

/** §2 THE PREDICATE THAT SURVIVED: it blocks PAIRING, nothing else. */
describe('isNotableRound blocks pairing', () => {
  it.each([
    ['record taken', item('a', { consequence: { kind: 'record_taken' } })],
    ['record lost', item('a', { consequence: { kind: 'record_lost' } })],
    ['rank up', item('a', { consequence: { kind: 'rank_up' } })],
    ['ace', item('a', { facts: { holes_in_one: 1 } })],
    ['albatross', item('a', { facts: { albatrosses: 1 } })],
    ['under par', item('a', { facts: { to_par: -1 } })],
    ['eagle', item('a', { facts: { eagles: 1 } })],
    ['five birdies', item('a', { facts: { birdies: 5 } })],
    ['clean card', item('a', { facts: { clean_card: true } })],
  ])('admits %s', (_label, candidate) => {
    expect(isNotableRound(candidate)).toBe(true);
  });

  it('lets ordinary rounds pair', () => {
    expect(isNotableRound(item('plain'))).toBe(false);
    expect(isNotableRound(item('down', { consequence: { kind: 'rank_down' } }))).toBe(false);
    expect(isNotableRound(item('four', { facts: { birdies: 4 } }))).toBe(false);
    expect(isNotableRound(item('unknown', { facts: { clean_card: null } }))).toBe(false);
    expect(isNotableRound(item('dirty', { facts: { clean_card: false } }))).toBe(false);
    expect(isNotableRound(item('noeagle', { facts: { eagles: 0 } }))).toBe(false);
  });
});

/** §5 THE ACHIEVEMENT CALLOUT: one per card, the highest priority, good news only. */
describe('achievement callout', () => {
  it('follows the ruled priority order', () => {
    expect(
      calloutFor(
        item('all', {
          consequence: { kind: 'record_taken' },
          facts: { holes_in_one: 1, eagles: 2, birdies: 6, clean_card: true },
        }),
      ),
    ).toEqual({ kind: 'record' });
    expect(calloutFor(item('rank', { consequence: { kind: 'rank_up', n: 3 }, facts: { eagles: 1 } })))
      .toEqual({ kind: 'rank_up', rank: 3 });
    expect(calloutFor(item('ace', { facts: { holes_in_one: 1, eagles: 1, birdies: 5 } })))
      .toEqual({ kind: 'ace', hole: null });
    expect(calloutFor(item('alb', { facts: { albatrosses: 1, eagles: 1 } })))
      .toEqual({ kind: 'albatross', hole: null });
    expect(calloutFor(item('eagle', { facts: { eagles: 1, birdies: 6 } })))
      .toEqual({ kind: 'eagle', hole: null });
    expect(calloutFor(item('birdies', { facts: { birdies: 5, clean_card: true } })))
      .toEqual({ kind: 'birdies', count: 5 });
    expect(calloutFor(item('clean', { facts: { clean_card: true } }))).toEqual({ kind: 'clean' });
  });

  it('marks nothing for a loss, a drop, a plain round or under par alone', () => {
    expect(calloutFor(item('lost', { consequence: { kind: 'record_lost' }, facts: { is_course_record: true } }))).toBeNull();
    expect(calloutFor(item('down', { consequence: { kind: 'rank_down', n: 4 } }))).toBeNull();
    expect(calloutFor(item('plain'))).toBeNull();
    expect(calloutFor(item('under', { facts: { to_par: -1 } }))).toBeNull();
    expect(calloutFor(item('review', { kind: 'review', facts: { rating: 9 } }))).toBeNull();
  });

  it('gives a backlog round no record or rank callout, but keeps its feats', () => {
    expect(calloutFor(item('bl', { lane: 'backlog', consequence: { kind: 'record_taken' } }))).toBeNull();
    expect(calloutFor(item('bl2', { lane: 'backlog', consequence: { kind: 'rank_up', n: 2 } }))).toBeNull();
    expect(calloutFor(item('bl3', { lane: 'backlog', facts: { eagles: 1 } })))
      .toEqual({ kind: 'eagle', hole: null });
  });

  it('names a hole only when exactly one hole carries the feat', () => {
    const holes = [
      { holeNo: 4, par: 4, strokes: 2 },
      { holeNo: 7, par: 3, strokes: 1 },
      { holeNo: 12, par: 5, strokes: 5 },
    ];
    expect(calloutFor(item('ace', { facts: { holes_in_one: 1 } }), holes))
      .toEqual({ kind: 'ace', hole: 7 });
    /* The 7th is an ace AND two under its par, so the eagle hole is ambiguous:
       two candidates means NO subline rather than an invented one. */
    expect(calloutFor(item('eagle', { facts: { eagles: 1 } }), holes))
      .toEqual({ kind: 'eagle', hole: null });
    expect(calloutFor(item('rank', { consequence: { kind: 'rank_up' } })))
      .toEqual({ kind: 'rank_up', rank: null });
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