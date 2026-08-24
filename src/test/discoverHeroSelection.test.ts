import { describe, expect, it } from 'vitest';

import { selectDiscoverHeroCandidate } from '@/components/explore-tab-new/courseled/hooks/useDiscoverHero';
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

describe('Discover hero amendment 1', () => {
  it('uses the most recent notable round instead of the highest-ranked kind', () => {
    const picked = selectDiscoverHeroCandidate([
      { row: row('older-eagle', '2026-08-18'), moment: moment('eagle', 'eagle') },
      { row: row('newer-run', '2026-08-22'), moment: moment('run') },
    ]);
    expect(picked?.row.round_id).toBe('newer-run');
  });

  it('lets the newest ace or albatross hold against a newer ordinary moment', () => {
    const picked = selectDiscoverHeroCandidate([
      { row: row('ace', '2026-08-18'), moment: moment('eagle', 'ace') },
      { row: row('albatross', '2026-08-19'), moment: moment('eagle', 'albatross') },
      { row: row('newer-score', '2026-08-22'), moment: moment('finishedInRed') },
    ]);
    expect(picked?.row.round_id).toBe('albatross');
  });

  it('suppresses the hero when every round is plain', () => {
    expect(selectDiscoverHeroCandidate([{ row: row('plain', '2026-08-22'), moment: moment('plain') }])).toBeNull();
  });

  it('detects ace and albatross rarity from existing hole shapes', () => {
    expect(selectMoment([{ holeNo: 4, par: 3, strokes: 1 }]).feat).toBe('ace');
    expect(selectMoment([{ holeNo: 7, par: 5, strokes: 2 }]).feat).toBe('albatross');
  });

  it('uses one bright red for every dark under-par token', () => {
    expect(TOPAR_UNDER_DARK).toBe('#FF6B60');
    expect(SC_BIRDIE_DARK).toBe(TOPAR_UNDER_DARK);
    expect(A.RED).toBe(TOPAR_UNDER_DARK);
  });
});