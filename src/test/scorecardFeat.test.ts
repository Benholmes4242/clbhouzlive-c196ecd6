import { describe, expect, it } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import {
  FEAT_BAND_STYLE,
  scorecardFeatFor,
  type ScorecardFeatHole,
} from '@/features/courses/_shared/scorecard/scorecardFeat';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';

const round = (deltas: number[], pars: number[] = deltas.map(() => 4)): ScorecardFeatHole[] =>
  deltas.map((delta, index) => ({
    holeNo: index + 1,
    par: pars[index],
    strokes: pars[index] + delta,
  }));

describe('scorecardFeatFor', () => {
  it('finds each of the five permanent feats', () => {
    expect(scorecardFeatFor(round([0], [1]), false, 'member')).toMatchObject({ kind: 'ace', hole: 1 });
    expect(scorecardFeatFor(round([-3], [5]), false, 'member')).toMatchObject({ kind: 'albatross', hole: 1 });
    expect(scorecardFeatFor(round([-2]), false, 'member')).toMatchObject({ kind: 'eagle', hole: 1 });
    expect(scorecardFeatFor(round([-1, -1, -1, -1, -1]), false, 'member')).toEqual({ kind: 'birdies', count: 5, hole: null });
    expect(scorecardFeatFor(round(Array(18).fill(0)), false, 'member')).toEqual({ kind: 'clean', count: 18, hole: null });
    expect(scorecardFeatFor(round(Array(9).fill(0)), true, 'member')).toEqual({ kind: 'clean', count: 9, hole: null });
  });

  it('uses ace, albatross, eagle, birdies, clean precedence', () => {
    const holes = round([0, -1, -1, -1, -1, -1, -2, -3], [1, 4, 4, 4, 4, 4, 4, 5]);
    expect(scorecardFeatFor(holes, false, 'member')?.kind).toBe('ace');
  });

  it('matches exact score relationships and names only a single feat hole', () => {
    expect(scorecardFeatFor(round([-4]), false, 'member')).toBeNull();
    expect(scorecardFeatFor(round([0, -2, 0]), false, 'member')).toMatchObject({ kind: 'eagle', hole: 2 });
    expect(scorecardFeatFor(round([-2, 0, -2]), false, 'member')).toMatchObject({ kind: 'eagle', count: 2, hole: null });
  });

  it('suppresses empty rounds, partial clean rounds and every tour feat', () => {
    expect(scorecardFeatFor([], false, 'member')).toBeNull();
    expect(scorecardFeatFor(round(Array(14).fill(0)), false, 'member')).toBeNull();
    expect(scorecardFeatFor(round([-2]), false, 'tour')).toBeNull();
    expect(scorecardFeatFor(round([0], [1]), false, 'tour')).toBeNull();
  });

  it('keeps the flat band at the measured 37px cost', () => {
    expect(FEAT_BAND_STYLE).toMatchObject({
      minHeight: 37,
      background: 'none',
      borderBottom: '1px solid rgba(255,255,255,0.10)',
      padding: '9px 16px',
      alignItems: 'baseline',
      gap: 7,
    });
  });

  it('keeps the scorecard eagle as the existing double-ring grid mark', () => {
    const { container } = render(React.createElement(ScoreMark, {
      strokes: 2,
      par: 4,
      surface: 'dark',
      glassDoubleRings: true,
    }));
    expect(container.querySelectorAll('[data-score-ring]')).toHaveLength(2);
  });
});