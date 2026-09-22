import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

const row = {
  round_id: 'round-fill-test',
  front_nine_to_par: null,
  back_nine_to_par: null,
} as CircleRoundRow;

function shape(series: number[]): HoleShape {
  return {
    coursePar: null,
    series,
    beads: [],
    played: series.length - 1,
    birdies: 0,
    holes: series.slice(1).map((_, index) => ({
      holeNo: index + 1,
      par: 4,
      strokes: 4 + series[index + 1] - series[index],
      sheetStrokes: 4 + series[index + 1] - series[index],
    })),
  };
}

function trace(series: number[], underParFill = true) {
  return render(
    <RoundShape
      row={row}
      shape={shape(series)}
      exploreLineOnly
      underParFill={underParFill}
      showMeta={false}
    />,
  ).container;
}

describe('Explore RoundShape under-par fill', () => {
  it('does not render when the running score is never under par', () => {
    expect(trace([0, 1, 0, 2]).querySelector('[data-round-under-par-fill]')).toBeNull();
  });

  it('renders the smooth-path area and clips it below par when the round dips under then returns', () => {
    const container = trace([0, -1, -2, 0, 1]);
    const fill = container.querySelector<SVGPathElement>('[data-round-under-par-fill]');
    expect(fill).not.toBeNull();
    expect(fill?.getAttribute('d')).toContain('C');
    expect(fill?.getAttribute('clip-path')).toMatch(/^url\(#round-under-clip-/);
    const clipId = fill?.getAttribute('clip-path')?.match(/^url\(#(.+)\)$/)?.[1];
    const clip = clipId ? container.querySelector(`[id="${clipId}"] rect`) : null;
    expect(clip).not.toBeNull();
    expect(Number(clip?.getAttribute('y'))).toBeGreaterThan(0);
  });

  it('keeps the fill through the final point of a partial round finishing under par', () => {
    const fill = trace([0, -1, -1, -2]).querySelector<SVGPathElement>('[data-round-under-par-fill]');
    expect(fill).not.toBeNull();
    expect(fill?.getAttribute('d')).toMatch(/L218\.00,/);
  });

  it('renders no fill when the opt-in prop is false', () => {
    expect(trace([0, -1, -2], false).querySelector('[data-round-under-par-fill]')).toBeNull();
  });

  it('uses unique clip and gradient ids for two traces on screen', () => {
    const { container } = render(
      <>
        <RoundShape row={row} shape={shape([0, -1, 0])} exploreLineOnly underParFill showMeta={false} />
        <RoundShape row={{ ...row, round_id: 'round-fill-test-2' }} shape={shape([0, -2, -1])} exploreLineOnly underParFill showMeta={false} />
      </>,
    );
    const fills = Array.from(container.querySelectorAll('[data-round-under-par-fill]'));
    expect(fills).toHaveLength(2);
    expect(new Set(fills.map((fill) => fill.getAttribute('fill'))).size).toBe(2);
    expect(new Set(fills.map((fill) => fill.getAttribute('clip-path'))).size).toBe(2);
  });
});