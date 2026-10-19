import { describe, expect, it } from 'vitest';
import { MIN_ROUND_PLOT_SPAN, roundPlotRange } from '@/components/feed/roundTilePlot';

describe('ROUND_PLOT_1_R per-round range', () => {
  it('uses a six-stroke floor and pads a level round symmetrically', () => {
    expect(MIN_ROUND_PLOT_SPAN).toBe(6);
    expect(roundPlotRange([0, 0, 0])).toEqual({ lo: -3, hi: 3 });
  });

  it('pads a two-over round equally below and above its range', () => {
    expect(roundPlotRange([0, 1, 2])).toEqual({ lo: -2, hi: 4 });
  });

  it('includes level par when all supplied cumulative values are under par', () => {
    expect(roundPlotRange([-2, -1])).toEqual({ lo: -4, hi: 2 });
  });

  it('keeps a six-stroke range without further padding', () => {
    expect(roundPlotRange([0, -2, 4])).toEqual({ lo: -2, hi: 4 });
  });

  it('keeps the actual extrema of a sixteen-over round', () => {
    expect(roundPlotRange([0, 5, 16])).toEqual({ lo: 0, hi: 16 });
  });
});