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

  /* "NEW COURSE RECORD" IS A CLAIM ABOUT NOW. A record that has since been
     beaten must draw no crown, whoever beat it. */
  it('draws no crown for a beaten record', () => {
    /* Another member beat it later: the round's own stored flag is stale and is
       no longer sufficient on its own. */
    expect(calloutFor(item('stale', { facts: { is_course_record: true, gross: 69 } }))).toBeNull();
    /* The stale flag cannot be rescued by a feat-free round of any kind. */
    expect(calloutFor(item('stale2', { facts: { is_course_record: true, to_par: -3 } }))).toBeNull();
    /* The viewer's own round that has since lost the record. */
    expect(
      calloutFor(item('mine', {
        who: { user_id: 'v', display_name: 'You', photo_url: null, is_viewer: true },
        consequence: { kind: 'record_lost' },
        facts: { is_course_record: true },
      })),
    ).toBeNull();
  });

  it('draws the crown only from a live record consequence', () => {
    expect(calloutFor(item('live', { consequence: { kind: 'record_taken', n: 69 } })))
      .toEqual({ kind: 'record' });
  });

  /* THE CONSEQUENCE ENGINE IS THE CURRENCY CHECK: record_taken is emitted only
     while this round still matches the CURRENT rank-1 row in the record book. */
  it('the consequence engine stops emitting record_taken once the record moves', () => {
    const input = {
      courseId: 'c1', userId: 'u1', gross: 69, playDate: '2026-05-01',
      isSelf: true, isCircle: false, isNotable: true,
    };
    const sources = (holderGross: number, holderId: string) => ({
      standing: new Map(),
      records: {
        holders: new Map([['c1', { course_id: 'c1', user_id: holderId, value: holderGross, attained_on: '2026-05-01' }]]),
        lostToViewer: new Set<string>(),
        isFetched: true,
      },
      bests: new Map<string, number>(),
      shortlist: new Set<string>(),
    });
    expect(roundConsequence(input, sources(69, 'u1'))?.kind).toBe('record_taken');
    /* A later 67 by another member now holds the board: no record_taken, so no
       crown on the older round. */
    const beaten = roundConsequence(input, sources(67, 'u2'));
    expect(beaten?.kind).not.toBe('record_taken');
    expect(calloutFor(item('beaten', { consequence: beaten, facts: { is_course_record: true } }))).toBeNull();
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