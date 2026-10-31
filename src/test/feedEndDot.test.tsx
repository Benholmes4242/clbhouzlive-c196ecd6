import { render } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { RoundTilePlot } from '@/components/feed/roundTilePlot';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import { SC_DOUBLE_DARK } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { goodHoleDots } from '@/features/explore-magazine/roundTreatment';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ width: 340, height: 0, top: 0, left: 0, right: 340, bottom: 0, x: 0, y: 0, toJSON() {} }) });
});
afterEach(() => { Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect'); vi.restoreAllMocks(); });

const row = { round_id: 'finish-marker', front_nine_to_par: null, back_nine_to_par: null } as CircleRoundRow;

function shape(lastStrokes: number | null): HoleShape {
  const strokes = [4, lastStrokes];
  return {
    coursePar: null,
    series: [0, 0, lastStrokes == null ? 0 : lastStrokes - 4],
    beads: [],
    played: lastStrokes == null ? 1 : 2,
    birdies: lastStrokes === 3 ? 1 : 0,
    holes: strokes.map((value, i) => ({ holeNo: i + 1, par: 4, strokes: value, sheetStrokes: value })),
  };
}

function finalMarks(container: HTMLElement, x: number) {
  return Array.from(container.querySelectorAll('svg circle')).filter((circle) => Number(circle.getAttribute('cx')) === x);
}

describe('FED1 Home finish marker', () => {
  it('last-hole birdie has the neutral end mark and gross birdie strip', () => {
    const { container } = render(<RoundTilePlot shape={shape(3)} received={[0, 0]} />);
    const marks = finalMarks(container, 324);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe('#F2F4F7');
    expect(marks[0].getAttribute('r')).toBe('4');
  });

  it('last-hole par has the neutral end mark and quiet par strip', () => {
    const { container } = render(<RoundTilePlot shape={shape(4)} received={[0, 0]} />);
    const marks = finalMarks(container, 324);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe('#F2F4F7');
    expect(marks[0].getAttribute('r')).toBe('4');
  });

  it('last-hole double has the neutral end mark and gross double strip', () => {
    const { container } = render(<RoundTilePlot shape={shape(6)} received={[0, 0]} />);
    const marks = finalMarks(container, 324);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe('#F2F4F7');
    expect(marks[0].getAttribute('r')).toBe('4');
  });

  it('an unscored final point has the neutral four-pixel terminus', () => {
    const { container } = render(<RoundTilePlot shape={shape(null)} received={[0, 0]} />);
    const marks = finalMarks(container, 324);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe('#F2F4F7');
    expect(marks[0].getAttribute('r')).toBe('4');
  });
});

describe('FED1 Explore finish marker', () => {
  it('last-hole supplied birdie keeps its tone with no ink overlay', () => {
    const input = shape(3);
    const { container } = render(<RoundShape row={row} shape={input} exploreLineOnly exploreDots={goodHoleDots(input)} showMeta={false} />);
    const marks = finalMarks(container, 218);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe(TOPAR_UNDER_DARK);
    expect(marks[0].getAttribute('r')).toBe('2.8');
  });

  it('a final point with no supplied dot retains the unchanged ink terminus', () => {
    const input = shape(null);
    const { container } = render(<RoundShape row={row} shape={input} exploreLineOnly exploreDots={goodHoleDots(input)} showMeta={false} />);
    const marks = finalMarks(container, 218);
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('fill')).toBe(A.INK);
    expect(marks[0].getAttribute('r')).toBe('2.6');
  });
});