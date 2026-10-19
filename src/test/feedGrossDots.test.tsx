import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundTilePlot, feedHoleDots, feedNetSeries, feedStrokesReceived } from '@/components/feed/roundTilePlot';
import { SC_BOGEY_DARK, SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

afterEach(cleanup);

function round(strokes: number[]): HoleShape {
  let total = 0;
  return {
    coursePar: 72,
    series: [0, ...strokes.map((gross) => { total += gross - 4; return total; })],
    beads: [],
    played: strokes.length,
    birdies: strokes.filter((gross) => gross === 3).length,
    holes: strokes.map((gross, index) => ({
      holeNo: index + 1, par: 4, strokes: gross, sheetStrokes: gross,
      strokeIndex: index + 1, strokesAllowed: null,
    })),
  };
}

describe('FGD1 gross dots on the net trace', () => {
  it('renders a gross birdie on a stroke hole in the birdie tone, not gold', () => {
    const shape = round([3, ...Array(17).fill(4)]);
    const received = feedStrokesReceived(shape, 1);
    if (!received) throw new Error('Expected eighteen-hole allowance');
    expect(received[0]).toBe(1);
    expect(feedNetSeries(shape, received)[1]).toBe(-2);
    const { container } = render(<RoundTilePlot shape={shape} received={received} />);
    const firstDot = container.querySelector('circle');
    expect(firstDot?.getAttribute('fill')).toBe(TOPAR_UNDER_DARK);
    expect(firstDot?.getAttribute('fill')).not.toBe(SC_FILL_GOLD);
  });

  it('sixteen gross bogeys off twenty finish net four under with sixteen bogey dots', () => {
    const shape = round([...Array(16).fill(5), 4, 4]);
    const received = feedStrokesReceived(shape, 20);
    if (!received) throw new Error('Expected eighteen-hole allowance');
    expect(shape.series.at(-1)).toBe(16);
    expect(feedNetSeries(shape, received).at(-1)).toBe(-4);
    expect(feedHoleDots(shape).filter((dot) => dot.tone === SC_BOGEY_DARK)).toHaveLength(16);
  });

  it('five gross birdies off three retain five red dots and no allowance-created gold dots', () => {
    const shape = round([...Array(5).fill(3), ...Array(13).fill(4)]);
    const received = feedStrokesReceived(shape, 3);
    if (!received) throw new Error('Expected eighteen-hole allowance');
    const { container } = render(<RoundTilePlot shape={shape} received={received} />);
    const tones = Array.from(container.querySelectorAll('circle')).map((dot) => dot.getAttribute('fill'));
    expect(tones.filter((tone) => tone === TOPAR_UNDER_DARK)).toHaveLength(5);
    expect(tones.filter((tone) => tone === SC_FILL_GOLD)).toHaveLength(0);
  });
});