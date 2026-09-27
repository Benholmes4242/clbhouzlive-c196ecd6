import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { format } from 'date-fns';

let history: Array<{ observed_at: string; handicap_index: number }> = [];
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: history, isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string, o?: any) => (o?.v ? `${k}:${o.v}` : k) }) }));

import IndexSection from '../IndexSection';

const DAY = 86_400_000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 350 });
  (HTMLElement.prototype as any).setPointerCapture = () => {};
  (HTMLElement.prototype as any).hasPointerCapture = () => false;
});

const conn = { id: 'c1' } as any;
const axisStart = () => screen.getByText('common:handicap.walk.today').previousSibling?.textContent;

describe('Index block — window anchored to today, headline mutated in place', () => {
  it('inactive member: 30D lands flat at 0.0; scrub parks and reads FIRST IN WINDOW at the start', () => {
    history = [{ observed_at: iso(200), handicap_index: 14.2 }, { observed_at: iso(45), handicap_index: 12.6 }];
    const { container } = render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText('30D'));
    expect(axisStart()).toBe(format(new Date(Date.now() - 30 * DAY), 'MMM yyyy'));
    expect(screen.getByText('12.6')).toBeTruthy();
    expect(screen.getByText('0.0')).toBeTruthy();
    expect(screen.getByText('common:handicap.walk.window30')).toBeTruthy();
    expect(container.querySelectorAll('path[data-tone="flat"]').length).toBe(1);
    expect(container.querySelector('path[data-fill]')).toBeNull();
    expect(container.querySelector('path[data-tone="down"]')).toBeNull();
    const chart = screen.getByRole('img');
    chart.getBoundingClientRect = () => ({ left: 0 } as DOMRect);
    fireEvent.pointerDown(chart, { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(chart, { clientX: 0, pointerId: 1 });
    // parked after release
    expect(screen.getByText('common:handicap.walk.firstInWindow')).toBeTruthy();
    // range change resets to landing
    fireEvent.click(screen.getByText('90D'));
    expect(screen.getByText('common:handicap.walk.headlineLabel')).toBeTruthy();
  });

  it('12M: landing movement is end minus start; ONE line in the net tone, fill from the same path', () => {
    history = [{ observed_at: iso(400), handicap_index: 14 }, { observed_at: iso(100), handicap_index: 12 }, { observed_at: iso(50), handicap_index: 12.5 }];
    const { container } = render(<IndexSection connection={conn} />);
    expect(screen.getByText('\u22121.5')).toBeTruthy();
    const paths = container.querySelectorAll('path[data-tone]');
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('data-tone')).toBe('down');
    const fill = container.querySelector('path[data-fill]')!.getAttribute('d')!;
    expect(fill.startsWith(paths[0].getAttribute('d')!)).toBe(true);
  });

  it.each([['30D', 30], ['90D', 90], ['12M', 365]] as const)('active member: %s axis spans %i days ending today', (chip, days) => {
    history = Array.from({ length: 40 }, (_, i) => ({ observed_at: iso(i * 10), handicap_index: 10 + (i % 5) / 10 })).reverse();
    render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText(chip));
    expect(axisStart()).toBe(format(new Date(Date.now() - days * DAY), 'MMM yyyy'));
  });

  it('no history: no chart, quiet line, chips still live', () => {
    history = [];
    const { container } = render(<IndexSection connection={conn} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('common:handicap.walk.empty')).toBeTruthy();
    fireEvent.click(screen.getByText('90D'));
    expect(screen.getByText('90D').getAttribute('aria-pressed')).toBe('true');
  });
});

/** Sample every cubic along its length; return the y extent. */
function sampledExtent(d: string): [number, number] {
  const tok = d.match(/[MLC]|-?\d+(?:\.\d+)?(?:e-?\d+)?/g)!;
  let i = 0; let cx = 0; let cy = 0; let lo = Infinity; let hi = -Infinity;
  const see = (y: number) => { lo = Math.min(lo, y); hi = Math.max(hi, y); };
  while (i < tok.length) {
    const c = tok[i++];
    if (c === 'M' || c === 'L') { cx = +tok[i++]; cy = +tok[i++]; see(cy); }
    else if (c === 'C') {
      const [, y1, , y2, x3, y3] = tok.slice(i, i + 6).map(Number); i += 6;
      for (let k = 0; k <= 200; k++) {
        const u = k / 200; const v = 1 - u;
        see(v * v * v * cy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3);
      }
      cx = x3; cy = y3;
    }
  }
  void cx;
  return [lo, hi];
}

describe('monotonePath — Fritsch–Carlson, no overshoot', () => {
  it('sampled y extent equals the series min/max (random series)', async () => {
    const { monotonePath } = await import('../IndexSection');
    for (let trial = 0; trial < 300; trial++) {
      const n = 2 + (trial % 30);
      let x = 0;
      const p: Array<[number, number]> = Array.from({ length: n }, () => {
        x += Math.random() < 0.1 ? 0 : Math.random() * 120;
        return [x, 20 + Math.round(Math.random() * 10) * 9] as [number, number];
      });
      const [lo, hi] = sampledExtent(monotonePath(p, x + 50));
      expect(lo).toBeCloseTo(Math.min(...p.map((q) => q[1])), 6);
      expect(hi).toBeCloseTo(Math.max(...p.map((q) => q[1])), 6);
    }
  });

  it('prototype shape: extent 14 to 96 against data 14 to 96', async () => {
    const { monotonePath } = await import('../IndexSection');
    const p: Array<[number, number]> = [[0, 60], [40, 60], [80, 14], [120, 96], [160, 50], [200, 50]];
    expect(sampledExtent(monotonePath(p, 240))).toEqual([14, 96]);
  });

  it('a window with no rounds is entirely flat — no sag, no lift', async () => {
    const { monotonePath } = await import('../IndexSection');
    const [lo, hi] = sampledExtent(monotonePath([[0, 55], [300, 55]], 300));
    expect(lo).toBeCloseTo(55, 9); expect(hi).toBeCloseTo(55, 9);
  });

  it('lead and trail stretches stay flat around a change', async () => {
    const { monotonePath } = await import('../IndexSection');
    const d = monotonePath([[0, 40], [100, 40], [150, 80], [300, 80]], 300);
    const segs = d.split(/(?=[CL])/).slice(1);
    const nums = (s: string) => s.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(nums(segs[0]).filter((_, i) => i % 2 === 1)).toEqual([40, 40, 40]);
    expect(nums(segs[2]).filter((_, i) => i % 2 === 1)).toEqual([80, 80, 80]);
  });

  it('staircase code is gone', async () => {
    const mod = await import('../IndexSection');
    expect((mod as Record<string, unknown>).softStepPath).toBeUndefined();
  });
});
