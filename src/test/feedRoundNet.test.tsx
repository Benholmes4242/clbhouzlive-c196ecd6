/* FN1 — the Home feed round plot is NET, and the figure row leads with it. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import {
  RoundTilePlot,
  feedHoleDots,
  feedNetSeries,
  feedStrokesReceived,
} from '@/components/feed/roundTilePlot';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

afterEach(cleanup);

type H = { par: number; strokes: number; si: number; allowed?: number | null };

function shapeOf(holes: H[]): HoleShape {
  const series = [0];
  let cum = 0;
  for (const h of holes) { cum += h.strokes - h.par; series.push(cum); }
  return {
    coursePar: holes.reduce((s, h) => s + h.par, 0), series, beads: [], played: holes.length, birdies: 0,
    holes: holes.map((h, i) => ({
      holeNo: i + 1, par: h.par, strokes: h.strokes, sheetStrokes: h.strokes,
      strokeIndex: h.si, strokesAllowed: h.allowed ?? null,
    })),
  };
}

/** Eighteen par-4s, SI 1..18 in hole order, every hole the given gross. */
const flat = (strokes: number, allowed?: number) =>
  shapeOf(Array.from({ length: 18 }, (_, i) => ({ par: 4, strokes, si: i + 1, allowed })));

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

describe('FN1.1 net series', () => {
  it('a whole eighteen handicap receives one stroke on every hole', () => {
    const received = feedStrokesReceived(flat(5), 18)!;
    expect(received).toEqual(Array(18).fill(1));
    expect(feedNetSeries(flat(5), received).at(-1)).toBe(0);
  });

  it('a handicap of 20 gives two strokes on SI 1 and 2, one elsewhere', () => {
    const received = feedStrokesReceived(flat(5), 20)!;
    expect(received.slice(0, 2)).toEqual([2, 2]);
    expect(received.slice(2)).toEqual(Array(16).fill(1));
    expect(sum(received)).toBe(20);
  });

  it('a handicap of 5 strokes SI 1 to 5 only', () => {
    const received = feedStrokesReceived(flat(4), 5)!;
    expect(received).toEqual([1, 1, 1, 1, 1, ...Array(13).fill(0)]);
    expect(feedNetSeries(flat(4), received).at(-1)).toBe(-5);
  });

  it('a plus three gives strokes back on SI 18, 17 and 16 and the net line sits above gross', () => {
    const shape = flat(4);
    const received = feedStrokesReceived(shape, -3)!;
    expect(received.slice(15)).toEqual([-1, -1, -1]);
    expect(sum(received)).toBe(-3);
    expect(feedNetSeries(shape, received).at(-1)).toBe(3);
  });

  it('uses the provider allocation when present and not uniformly zero', () => {
    const shape = flat(4, 1);
    expect(feedStrokesReceived(shape, 5)).toEqual(Array(18).fill(1));
  });

  it('computes when the provider allocation is all zeros', () => {
    expect(sum(feedStrokesReceived(flat(4, 0), 5)!)).toBe(5);
  });

  it('cannot net without a handicap or with a missing stroke index', () => {
    expect(feedStrokesReceived(flat(4), null)).toBeNull();
    const noSi = flat(4);
    noSi.holes[3].strokeIndex = null;
    expect(feedStrokesReceived(noSi, 10)).toBeNull();
  });

  it('a nine-hole card is not computed until a convention is ruled', () => {
    const nine = shapeOf(Array.from({ length: 9 }, (_, i) => ({ par: 4, strokes: 5, si: i * 2 + 1 })));
    expect(feedStrokesReceived(nine, 9)).toBeNull();
  });
});

describe('FN1.2 / FN1.4 dots and fill follow net', () => {
  it('a gross birdie on a stroke hole grades as a net eagle', () => {
    const shape = shapeOf([{ par: 4, strokes: 3, si: 1 }, ...Array.from({ length: 17 }, (_, i) => ({ par: 4, strokes: 4, si: i + 2 }))]);
    const received = feedStrokesReceived(shape, 1)!;
    expect(feedHoleDots(shape, received)[0].tone).toBe(SC_FILL_GOLD);
  });

  it('a gross bogey on a stroke hole grades as a net par, not a bogey', () => {
    const received = feedStrokesReceived(flat(5), 18)!;
    const dots = feedHoleDots(flat(5), received);
    expect(new Set(dots.map((d) => d.tone)).size).toBe(1);
    expect(dots[0].tone).not.toBe(TOPAR_UNDER_DARK);
  });

  it('a round under its handicap renders the fill; one that never is renders none', () => {
    const under = render(<RoundTilePlot shape={flat(4)} received={feedStrokesReceived(flat(4), 5)} />);
    expect(under.container.querySelector('clipPath')).not.toBeNull();
    cleanup();
    const over = render(<RoundTilePlot shape={flat(6)} received={feedStrokesReceived(flat(6), 5)} />);
    expect(over.container.querySelector('clipPath')).toBeNull();
  });
});

describe('FN1.5 the Home figure row', () => {
  const base = (facts: Record<string, unknown>, shape: HoleShape | null): React.ReactElement => {
    const item: StreamItem = {
      id: 'round:s', kind: 'round', ring: null, lane: 'news', score: 0, consequence: null,
      subject: { course_id: null, course_name: 'Knebworth', region: null, sub_country: null, image_url: null, pending: false },
      who: { user_id: 'p', display_name: 'P', photo_url: null, is_viewer: false },
      facts: { score_id: 's', play_date: '2026-09-15', ...facts },
      payload: {}, seen: false,
    } as StreamItem;
    return <ExploreCard item={item} size="std" onTap={vi.fn()} feedPlot shape={shape} />;
  };
  const cells = (c: HTMLElement) =>
    Array.from(c.querySelectorAll('[data-round-figures="true"] [data-explore-stat]')).map((n) => n.getAttribute('data-explore-stat'));

  it('orders NET, GROSS, HANDICAP and keeps four columns', () => {
    const v = render(base({ gross: 82, to_par: 11, net: 77, course_par: 71, course_handicap: 5 }, flat(5)));
    const grid = v.container.querySelector<HTMLElement>('[data-round-figures="true"]')!;
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(cells(v.container).length).toBe(3);
    expect(v.container.querySelector('[data-round-figure="net"]')?.textContent).toContain('77');
    expect(v.container.querySelector('[data-round-figure="net"]')?.textContent).toContain('+6');
    expect(v.container.querySelector('[data-round-figure="gross"]')?.textContent).toContain('82');
    expect(v.container.querySelector('[data-round-figure="gross"]')?.textContent).toContain('+11');
    expect(v.container.querySelector('[data-round-figure="handicap"]')?.textContent).toContain('5');
    expect(v.container.querySelector('[data-round-figure="handicap"]')?.textContent).not.toContain('5.0');
  });

  it('writes a plus handicap with a leading plus', () => {
    const v = render(base({ gross: 72, to_par: 1, net: 75, course_par: 71, course_handicap: -3 }, flat(4)));
    expect(v.container.querySelector('[data-round-figure="handicap"]')?.textContent).toContain('+3');
  });

  it('a round with no handicap: no plot, NET and HANDICAP empty, GROSS kept', () => {
    const v = render(base({ gross: 90, to_par: 19, net: null, course_par: 71, course_handicap: null }, flat(5)));
    expect(v.container.querySelector('[data-feed-round-plot="true"]')).toBeNull();
    expect(v.container.querySelector('[data-round-figure="net"]')?.textContent).not.toMatch(/\d/);
    expect(v.container.querySelector('[data-round-figure="handicap"]')?.textContent).not.toMatch(/\d/);
    expect(v.container.querySelector('[data-round-figure="gross"]')?.textContent).toContain('90');
  });

  it('a course with no stroke index: no plot, NET and HANDICAP empty', () => {
    const noSi = flat(5);
    noSi.holes.forEach((h) => { h.strokeIndex = null; });
    const v = render(base({ gross: 90, to_par: 18, net: 70, course_par: 72, course_handicap: 20 }, noSi));
    expect(v.container.querySelector('[data-feed-round-plot="true"]')).toBeNull();
    expect(v.container.querySelector('[data-round-figure="net"]')?.textContent).not.toMatch(/\d/);
  });
});
