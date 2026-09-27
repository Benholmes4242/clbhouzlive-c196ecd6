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

describe('softStepPath — |rise|/2 and RADIUS_MAX clamps', () => {
  it('every coordinate stays within the series min/max y and radius <= 9', async () => {
    const { softStepPath } = await import('../IndexSection');
    for (let trial = 0; trial < 200; trial++) {
      const n = 2 + (trial % 30);
      let x = 0;
      const p: Array<[number, number]> = Array.from({ length: n }, () => {
        x += Math.random() * 120;
        return [x, 20 + Math.round(Math.random() * 10) * 9] as [number, number];
      });
      const d = softStepPath(p, x + 50);
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      const ys = nums.filter((_, i) => i % 2 === 1);
      const lo = Math.min(...p.map((q) => q[1]));
      const hi = Math.max(...p.map((q) => q[1]));
      ys.forEach((yy) => { expect(yy).toBeGreaterThanOrEqual(lo - 1e-9); expect(yy).toBeLessThanOrEqual(hi + 1e-9); });
    }
  });
});
