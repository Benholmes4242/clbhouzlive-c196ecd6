import { describe, expect, it } from 'vitest';

import {
  SLOT_MS,
  selectDiscoverHeroCandidate,
  slotForTime,
} from '@/components/explore-tab-new/courseled/hooks/useDiscoverHero';
import { selectMoment, type Moment } from '@/components/explore-tab-new/courseled/roundMoment';
import { SC_BIRDIE_DARK } from '@/features/courses/components/holes/_constants';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

const row = (id: string, playDate: string) =>
  ({ round_id: id, score_id: id, play_date: playDate } as CircleRoundRow);

const moment = (kind: Moment['kind'], feat?: Moment['feat']): Moment => ({
  kind,
  feat,
  tone: '#FFFFFF',
  labelKey: kind === 'plain' ? null : kind,
  figureKey: null,
  figureRole: 'quantity',
  figure: null,
  sentenceKey: kind,
  markedHoles: [],
  facts: {},
});

/** The slot a round's play_date starts in, so lead windows can be pinned. */
const slotOf = (playDate: string) => slotForTime(Date.parse(`${playDate}T00:00:00Z`));

/** The hero's pool rule (AMENDMENT 1 §1): moments only, plain never qualifies. */
const heroPool = (all: readonly { row: CircleRoundRow; moment: Moment }[]) =>
  all.filter(({ moment }) => moment.kind !== 'plain');

describe('Discover hero rotation (BRIEF_DISCOVER_HERO_ROTATION)', () => {
  it('renders nothing for an all-plain fortnight — no fallback to the best plain round', () => {
    const all = [
      { row: row('plain-a', '2026-08-22'), moment: moment('plain') },
      { row: row('plain-b', '2026-08-23'), moment: moment('plain') },
    ];
    expect(selectDiscoverHeroCandidate(heroPool(all), slotOf('2026-08-24'))).toBeNull();
  });


  it('rotates over the pool in the section order for a fixed slot', () => {
    const pool = ['a', 'b', 'c'].map((id) => ({
      row: row(id, '2026-08-20'),
      moment: moment('plain'),
    }));
    const base = 3000;
    expect(selectDiscoverHeroCandidate(pool, base)?.row.round_id).toBe('a');
    expect(selectDiscoverHeroCandidate(pool, base + 1)?.row.round_id).toBe('b');
    expect(selectDiscoverHeroCandidate(pool, base + 2)?.row.round_id).toBe('c');
    expect(selectDiscoverHeroCandidate(pool, base + 3)?.row.round_id).toBe('a');
  });

  it('is stable within a slot and only changes at the boundary', () => {
    const pool = ['a', 'b'].map((id) => ({ row: row(id, '2026-08-20'), moment: moment('plain') }));
    const t0 = 12_345 * SLOT_MS;
    const first = selectDiscoverHeroCandidate(pool, slotForTime(t0));
    expect(selectDiscoverHeroCandidate(pool, slotForTime(t0 + SLOT_MS - 1))?.row.round_id).toBe(
      first?.row.round_id,
    );
    expect(selectDiscoverHeroCandidate(pool, slotForTime(t0 + SLOT_MS))?.row.round_id).not.toBe(
      first?.row.round_id,
    );
  });

  it('guards a negative slot rather than indexing out of the pool', () => {
    const pool = ['a', 'b', 'c'].map((id) => ({
      row: row(id, '2026-08-20'),
      moment: moment('plain'),
    }));
    expect(selectDiscoverHeroCandidate(pool, -1)?.row.round_id).toBe('c');
  });

  it('gives an ace the lead through two slots, but not three', () => {
    const ace = { row: row('ace', '2026-08-22'), moment: moment('eagle', 'ace') };
    const other = { row: row('eagle', '2026-08-23'), moment: moment('eagle') };
    const pool = [other, ace];
    const start = slotOf('2026-08-22');
    expect(selectDiscoverHeroCandidate(pool, start)?.row.round_id).toBe('ace');
    expect(selectDiscoverHeroCandidate(pool, start + 2)?.row.round_id).toBe('ace');
    expect(selectDiscoverHeroCandidate(pool, start + 3)?.row.round_id).not.toBe('ace');
  });

  it('keeps a late tee time leading the next morning (AMENDMENT 1 §5-6)', () => {
    /* Played 21:00 on the 22nd: play_date anchors slot(22nd 00:00Z), so 09:00 on
       the 23rd is start + 2. With the old bound of 1 this ace had expired. */
    const ace = { row: row('ace', '2026-08-22'), moment: moment('eagle', 'ace') };
    const pool = [{ row: row('eagle', '2026-08-23'), moment: moment('eagle') }, ace];
    const nextMorning = slotForTime(Date.parse('2026-08-23T09:00:00Z'));
    expect(nextMorning - slotOf('2026-08-22')).toBe(2);
    expect(selectDiscoverHeroCandidate(pool, nextMorning)?.row.round_id).toBe('ace');
  });


  it('lets a course record lead but lose to an ace in the same window', () => {
    const record = { row: row('record', '2026-08-22'), moment: moment('courseRecord') };
    const plain = { row: row('plain', '2026-08-22'), moment: moment('plain') };
    const start = slotOf('2026-08-22');
    expect(selectDiscoverHeroCandidate([plain, record], start)?.row.round_id).toBe('record');
    const ace = { row: row('ace', '2026-08-22'), moment: moment('eagle', 'ace') };
    expect(selectDiscoverHeroCandidate([record, ace], start)?.row.round_id).toBe('ace');
  });

  it('prefers the more recent feat when two share the same rarity', () => {
    const start = slotOf('2026-08-23');
    const picked = selectDiscoverHeroCandidate(
      [
        { row: row('older-ace', '2026-08-22'), moment: moment('eagle', 'ace') },
        { row: row('newer-albatross', '2026-08-23'), moment: moment('eagle', 'albatross') },
      ],
      start,
    );
    expect(picked?.row.round_id).toBe('newer-albatross');
  });

  it('renders nothing for an empty fortnight', () => {
    expect(selectDiscoverHeroCandidate([], 1000)).toBeNull();
  });

  it('detects ace and albatross rarity from existing hole shapes', () => {
    expect(selectMoment([{ holeNo: 4, par: 3, strokes: 1 }]).feat).toBe('ace');
    expect(selectMoment([{ holeNo: 7, par: 5, strokes: 2 }]).feat).toBe('albatross');
  });

  it('keeps the plain moment contract the hero depends on', () => {
    const plain = selectMoment([
      { holeNo: 1, par: 4, strokes: 5 },
      { holeNo: 2, par: 4, strokes: 4 },
    ]);
    expect(plain).toMatchObject({
      kind: 'plain',
      labelKey: null,
      figureKey: null,
      figureRole: 'score',
      figure: null,
      sentenceKey: 'plain',
    });
  });

  it('does not change any existing kind when the record fact is absent', () => {
    const holes = [{ holeNo: 7, par: 5, strokes: 3 }];
    expect(selectMoment(holes)).toEqual(selectMoment(holes, null));
  });

  it('uses one bright red for every dark under-par token', () => {
    expect(TOPAR_UNDER_DARK).toBe('#FF6B60');
    expect(SC_BIRDIE_DARK).toBe(TOPAR_UNDER_DARK);
    expect(A.RED).toBe(TOPAR_UNDER_DARK);
  });
});
