import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoundTilePlot } from '@/components/feed/roundTilePlot';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

function shape(series: number[]): HoleShape {
  return {
    coursePar: null, series, beads: [], played: series.length - 1, birdies: 0,
    holes: series.slice(1).map((value, i) => ({
      holeNo: i + 1, par: 4,
      strokes: 4 + value - series[i], sheetStrokes: 4 + value - series[i],
    })),
  };
}

describe('FUP1 Home earned under-par area', () => {
  it('renders an area when the round finishes under par', () => {
    const { container } = render(<RoundTilePlot shape={shape([0, -1, -2])} />);
    const area = container.querySelector('[data-round-under-par-fill]');
    expect(area).not.toBeNull();
    expect(area?.getAttribute('d')).toMatch(/C.* Z$/);
    const clip = container.querySelector('[data-under-clip]');
    expect(area?.getAttribute('clip-path')).toBe(`url(#${clip?.id})`);
  });

  it('keeps the area for a round that dipped under and finished over', () => {
    const { container } = render(<RoundTilePlot shape={shape([0, -2, -1, 1])} />);
    expect(container.querySelector('[data-round-under-par-fill]')).not.toBeNull();
  });

  it('adds no under-par fill, gradient or level rule when a round never dipped under', () => {
    const { container } = render(<RoundTilePlot shape={shape([0, 2, 1, 3])} />);
    expect(container.querySelector('[data-round-under-par-fill]')).toBeNull();
    expect(container.querySelector('linearGradient')).toBeNull();
    expect(container.querySelector('[data-plot-level]')).toBeNull();
    expect(container.querySelectorAll('[data-plot-trace]')).toHaveLength(1);
  });

  it('keeps a flat level round without an area', () => {
    const { container } = render(<RoundTilePlot shape={shape([0, 0, 0])} />);
    expect(container.querySelector('[data-round-under-par-fill]')).toBeNull();
    expect(container.querySelector('linearGradient')).toBeNull();
    expect(container.querySelector('[data-plot-level]')).toBeNull();
  });

  it('gives two mixed rounds distinct clip and gradient ids with local references', () => {
    const { container } = render(<>
      <RoundTilePlot shape={shape([0, -1, 1])} />
      <RoundTilePlot shape={shape([0, -2, 1])} />
    </>);
    const ids = Array.from(container.querySelectorAll('[id]'), el => el.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    for (const plot of container.querySelectorAll('svg')) {
      const area = plot.querySelector('[data-round-under-par-fill]');
      expect(area?.getAttribute('fill')).toBe(`url(#${plot.querySelector('linearGradient')?.id})`);
      expect(area?.getAttribute('clip-path')).toBe(`url(#${plot.querySelector('[data-under-clip]')?.id})`);
    }
  });
});