import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoundTilePlot } from '@/components/feed/roundTilePlot';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { SC_FILL_GOLD, SC_BOGEY_DARK, SC_DOUBLE_DARK } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import { FEED_CARD_SURFACE } from '@/lib/tokens/surfaces';

const shape = (diff: (number | null)[]): HoleShape => {
  let sum = 0;
  return { coursePar: diff.length * 4, series: [0, ...diff.map(d => sum += d ?? 0)], played: diff.length, beads: [], birdies: 0,
    holes: diff.map((d, i) => ({ holeNo: i + 1, par: 4, strokes: d == null ? null : 4 + d, sheetStrokes: d == null ? null : 4 + d, strokeIndex: i + 1, strokesAllowed: 1 })) };
};
let intersection: (entries: Partial<IntersectionObserverEntry>[]) => void;
let resize: (entries: { contentRect: { width: number } }[]) => void;
let raf: FrameRequestCallback;
let clock = 0;
let originalResizeObserver: typeof window.ResizeObserver;
let originalIntersectionObserver: typeof window.IntersectionObserver;
const trigger = (ratio: number) => act(() => intersection([{ isIntersecting: true, intersectionRatio: ratio }]));
const frame = (time: number) => act(() => { clock = time; raf(time); });
const plot = (id = 'animation', diff = [1, 0, 1]) => render(<RoundTilePlot shape={shape(diff)} scoreId={id} />);

beforeEach(() => {
  clock = 0;
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ width: 390, height: 0, top: 0, left: 0, right: 390, bottom: 0, x: 0, y: 0, toJSON() {} }) });
  originalResizeObserver = window.ResizeObserver;
  originalIntersectionObserver = window.IntersectionObserver;
  window.ResizeObserver = class { constructor(cb: typeof resize) { resize = cb; } observe() {} disconnect() {} } as unknown as typeof window.ResizeObserver;
  window.IntersectionObserver = class { constructor(cb: typeof intersection) { intersection = cb; } observe() {} disconnect() {} } as unknown as typeof window.IntersectionObserver;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { raf = cb; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  window.ResizeObserver = originalResizeObserver;
  window.IntersectionObserver = originalIntersectionObserver;
  Reflect.deleteProperty(HTMLElement.prototype, 'getBoundingClientRect');
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
const geometry = () => {
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', { configurable: true, value: () => 358 });
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', { configurable: true, value: (n: number) => ({ x: 16 + n, y: 50 }) });
};
afterEach(() => { Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength'); Reflect.deleteProperty(SVGElement.prototype, 'getPointAtLength'); });

describe('Signed-off round line and strip', () => {
  it('draws at observed width without stretching circles', () => {
    const v = plot('width');
    act(() => resize([{ contentRect: { width: 375 } }]));
    expect(v.container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 375 96');
    expect(v.container.querySelector('svg')?.hasAttribute('preserveAspectRatio')).toBe(false);
    expect(v.container.querySelector('[data-plot-end]')?.getAttribute('cx')).toBe('359');
  });
  it('replaces per-hole dots with one neutral bordered endpoint', () => {
    const v = plot('end');
    expect(v.container.querySelectorAll('circle:not([data-plot-head])')).toHaveLength(1);
    const end = v.container.querySelector('[data-plot-end]');
    expect(end?.getAttribute('r')).toBe('4'); expect(end?.getAttribute('stroke')).toBe(FEED_CARD_SURFACE);
  });
  it('grades one strip cell per hole by gross rather than net', () => {
    const v = render(<RoundTilePlot shape={shape([-2, -1, 0, 1, 2, null])} received={[1,1,1,1,1,1]} />);
    const cells = Array.from(v.container.querySelectorAll('[data-plot-hole]'));
    expect(cells.map(c => c.getAttribute('fill'))).toEqual([SC_FILL_GOLD, TOPAR_UNDER_DARK, 'rgba(255,255,255,0.14)', SC_BOGEY_DARK, SC_DOUBLE_DARK, 'rgba(255,255,255,0.06)']);
    expect(cells[3].getAttribute('fill-opacity')).toBe('0.55');
    cells.forEach((c, i) => { const x = Number(c.getAttribute('x')); const right = x + Number(c.getAttribute('width')); expect(x).toBeGreaterThanOrEqual(16 + i / 6 * 358); expect(right).toBeLessThanOrEqual(16 + (i + 1) / 6 * 358); });
  });
  it('keeps outer strip edges flush and widens only the eighteen-hole turn', () => {
    const v = plot('turn', Array(18).fill(0));
    const cells = v.container.querySelectorAll('[data-plot-hole]');
    const right = (i: number) => Number(cells[i].getAttribute('x')) + Number(cells[i].getAttribute('width'));
    expect(cells[0].getAttribute('x')).toBe('16'); expect(right(17)).toBe(374);
    expect(Number(cells[9].getAttribute('x')) - right(8)).toBe(7);
    expect(Number(cells[1].getAttribute('x')) - right(0)).toBeCloseTo(2.5);
    cleanup();
    const nine = plot('nine-gap', Array(9).fill(0)).container.querySelectorAll('[data-plot-hole]');
    expect(Number(nine[1].getAttribute('x')) - Number(nine[0].getAttribute('x')) - Number(nine[0].getAttribute('width'))).toBeCloseTo(2.5);
  });
  it('earns red fill, red stroke and rule only by dipping net under par', () => {
    const v = plot('red', [-1,2]);
    expect(v.container.querySelectorAll('[data-round-under-par-fill], [data-plot-under-stroke], [data-plot-level]')).toHaveLength(3);
    expect(Array.from(v.container.querySelectorAll('stop')).map(s => s.getAttribute('stop-opacity'))).toEqual(['0.06','0.32']);
    cleanup(); const over = plot('over', [1,1]);
    expect(over.container.querySelectorAll('[data-round-under-par-fill], [data-plot-under-stroke], [data-plot-level]')).toHaveLength(0);
  });
  it('prints net OUT and IN only for complete eighteen-hole cards', () => {
    const v = plot('foot', [-1,...Array(8).fill(0),6,...Array(8).fill(0)]);
    expect(v.container.querySelector('[data-plot-foot]')?.textContent).toBe('OUT −1IN +6');
    cleanup(); expect(plot('nine', Array(9).fill(0)).container.querySelector('[data-plot-foot]')).toBeNull();
  });
  it('prints E for level nines', () => {
    expect(plot('even', Array(18).fill(0)).container.querySelector('[data-plot-foot]')?.textContent).toBe('OUT EIN E');
  });
  it('keeps the strip, foot and rule outside the animated group', () => {
    const v = plot('static', [-1,...Array(17).fill(0)]);
    const g = v.container.querySelector('[data-plot-animated]');
    for (const el of v.container.querySelectorAll('[data-plot-hole], [data-plot-foot], [data-plot-level]')) expect(g?.contains(el)).toBe(false);
  });
  it('never draws before threshold and plays after the 120ms delay', () => {
    geometry(); const v = plot('threshold'); const reveal = v.container.querySelector('[data-plot-reveal]');
    expect(reveal?.getAttribute('width')).toBe('0'); trigger(0.59); expect(requestAnimationFrame).not.toHaveBeenCalled();
    trigger(0.6); act(() => vi.advanceTimersByTime(119)); expect(requestAnimationFrame).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1)); frame(600); expect(Number(reveal?.getAttribute('width'))).toBe(195);
    frame(1200); expect(reveal?.getAttribute('width')).toBe('390');
    expect(v.container.querySelector<SVGCircleElement>('[data-plot-end]')?.style.opacity).toBe('1');
  });
  it('renders a remounted round finished without replaying', () => {
    geometry(); plot('remount'); trigger(0.6); act(() => vi.advanceTimersByTime(120)); frame(1200); cleanup(); vi.mocked(requestAnimationFrame).mockClear();
    const v = plot('remount'); expect(v.container.querySelector('[data-plot-reveal]')?.getAttribute('width')).toBe('390'); trigger(0.6); expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('finishes immediately with reduced motion', () => {
    geometry(); vi.stubGlobal('matchMedia', () => ({ matches: true })); const v = plot('reduced');
    expect(v.container.querySelector('[data-plot-reveal]')?.getAttribute('width')).toBe('390'); expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('finishes immediately when path geometry is unavailable', () => {
    const v = plot('missing'); expect(v.container.querySelector('[data-plot-reveal]')?.getAttribute('width')).toBe('390');
  });
  it('cancels pending animation on unmount', () => {
    geometry(); const v = plot('cancel'); trigger(0.6); v.unmount(); act(() => vi.advanceTimersByTime(120)); expect(requestAnimationFrame).not.toHaveBeenCalled(); expect(cancelAnimationFrame).toHaveBeenCalled();
  });
  it('a plot tap still reaches the card scorecard action during draw', () => {
    geometry(); const onTap = vi.fn();
    const item = { id: 'round:tap', kind: 'round', ring: null, lane: 'news', score: 0, consequence: null, subject: { course_id: null, course_name: 'Sample', region: null, sub_country: null, image_url: null, pending: false }, who: { user_id: 'p', display_name: 'P', photo_url: null, is_viewer: false }, facts: { score_id: 'tap', course_handicap: 18, gross: 90, net: 72, course_par: 72 }, payload: {}, seen: false } as StreamItem;
    const v = render(<ExploreCard item={item} size="std" onTap={onTap} feedPlot feedLayout="scoreLed" shape={shape(Array(18).fill(1))} />);
    trigger(0.6); const svg = v.container.querySelector('svg'); if (!svg) throw new Error('Missing plot'); fireEvent.click(svg); expect(onTap).toHaveBeenCalledTimes(1);
  });
});
