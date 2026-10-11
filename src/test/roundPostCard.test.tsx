import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { goodHoleDots } from '@/features/explore-magazine/roundTreatment';
import { goodHoleCounts, headlineFigure, roundVerdict } from '@/features/explore-magazine/roundVerdict';
import { HistoryCell } from '@/features/explore-magazine/RoundPostCard';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

function shapeOf(strokes: number[], pars: number[]): HoleShape {
  let run = 0;
  const series = [0, ...strokes.map((s, i) => (run += s - pars[i]))];
  return {
    coursePar: pars.reduce((a, b) => a + b, 0), series, beads: [], played: strokes.length, birdies: 0,
    holes: strokes.map((s, i) => ({ holeNo: i + 1, par: pars[i], strokes: s, sheetStrokes: s })),
  } as unknown as HoleShape;
}

describe('round post trace key', () => {
  it('counts agree with the dots goodHoleDots draws for the same shape', () => {
    // ace on a par 3, eagle on a par 5, two birdies, pars and a double
    const shape = shapeOf([1, 3, 3, 4, 4, 6, 4], [3, 5, 4, 5, 4, 4, 4]);
    const dots = goodHoleDots(shape);
    const counts = goodHoleCounts(shape);
    expect(counts).toEqual({ birdies: 2, eagles: 2 });
    expect(dots.filter((d) => d.tone === SC_FILL_GOLD)).toHaveLength(counts.eagles);
    expect(dots.filter((d) => d.tone === TOPAR_UNDER_DARK)).toHaveLength(counts.birdies);
  });
});

describe('round post history cell', () => {
  const k = (key: string) => key;
  it('renders an em dash, never collapsing, when the course context is missing', () => {
    const { container } = render(<HistoryCell k={k} context={null} />);
    const cell = container.querySelector('[data-round-post-history]')!;
    expect(cell.getAttribute('data-round-post-history')).toBe('dash');
    expect(cell.textContent).toContain('history');
    expect(cell.textContent).toContain('\u2014');
  });
  it('renders an em dash for a first round here', () => {
    const { container } = render(<HistoryCell k={k} context={{ rank_here: 1, rounds_here: 1, best_here: 80 }} />);
    expect(container.querySelector('[data-round-post-history]')!.getAttribute('data-round-post-history')).toBe('dash');
  });
});

describe('round post verdict', () => {
  const base = { eagles: 0, holesInOne: 0, cleanCard: false, self: false };
  it('omits the comparative clause when rank_here is null', () => {
    const v = roundVerdict({ ...base, vsHcp: 2, context: { rank_here: null, rounds_here: 14, best_here: 72 } });
    expect(v).toEqual({ lead: null, emphasis: { key: 'hcpOver_other', opts: { count: 2 } } });
  });
  it('claims best here when the round ranks first of several', () => {
    const v = roundVerdict({ ...base, self: true, vsHcp: -1, context: { rank_here: 1, rounds_here: 5, best_here: 70 } });
    expect(v?.emphasis.key).toBe('bestHere_self');
    expect(v?.lead?.key).toBe('hcpUnder_self');
  });
  it('has nothing to say without a handicap or a feat', () => {
    expect(roundVerdict({ ...base, vsHcp: null, context: null })).toBeNull();
  });
});

describe('round post headline figure', () => {
  it('chooses points for a stableford round', () => {
    expect(headlineFigure({ stableford: 38, gross: 84, toPar: 12 })).toEqual({ kind: 'points', value: 38 });
  });
  it('chooses the gross for a medal round', () => {
    expect(headlineFigure({ stableford: null, gross: 74, toPar: 2 })).toEqual({ kind: 'gross', value: 74, toPar: 2 });
  });
});
