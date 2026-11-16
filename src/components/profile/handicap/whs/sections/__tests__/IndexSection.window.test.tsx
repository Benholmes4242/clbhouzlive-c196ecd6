import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

let history: Array<{ observed_at: string; handicap_index: number }> = [];
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: history, isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string, o?: any) => (o?.v ? `${k}:${o.v}` : o?.defaultValue ?? k) }) }));

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
const chartDays = (c: HTMLElement) => c.querySelector('[data-index-window-chart]')?.getAttribute('data-index-window-chart');

describe('Index block — window anchored to today, headline mutated in place', () => {
  it('inactive member: 30D lands flat at 0.0; uses the shared index chart; scrub parks at the start', () => {
    history = [{ observed_at: iso(200), handicap_index: 14.2 }, { observed_at: iso(45), handicap_index: 12.6 }];
    const { container } = render(<IndexSection connection={conn} />);
    expect(screen.getByText('90D').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('30D'));
    expect(chartDays(container)).toBe('30');
    expect(screen.getByText('30 days ago')).toBeTruthy();
    expect(screen.getByText('12.6')).toBeTruthy();
    expect(screen.getByText('0.0')).toBeTruthy();
    expect(screen.getByText('common:handicap.walk.window30')).toBeTruthy();
    expect(container.querySelector('[data-hcp-chart]')).toBeNull();
    const chart = screen.getByRole('img');
    chart.getBoundingClientRect = () => ({ left: 0 } as DOMRect);
    fireEvent.pointerDown(chart, { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(chart, { clientX: 0, pointerId: 1 });
    // parked after release: crosshair and active dot drawn, headline reads the point
    expect(screen.getByText('common:handicap.walk.firstInWindow')).toBeTruthy();
    expect(container.querySelector('[data-index-crosshair]')).toBeTruthy();
    expect(container.querySelector('[data-index-active-dot]')).toBeTruthy();
    // range change resets to landing
    fireEvent.click(screen.getByText('90D'));
    expect(screen.getByText('common:handicap.walk.headlineLabel')).toBeTruthy();
  });

  it('12M: landing movement is end minus start and the shared chart turns green', () => {
    history = [{ observed_at: iso(400), handicap_index: 14 }, { observed_at: iso(100), handicap_index: 12 }, { observed_at: iso(50), handicap_index: 12.5 }];
    const { container } = render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText('12M'));
    expect(screen.getByText('\u22121.5')).toBeTruthy();
    expect(container.querySelector('[data-index-line]')?.getAttribute('data-index-line')).toBe(INDEX_DELTA.dark.improved);
    expect(screen.getByText('12 months ago')).toBeTruthy();
  });

  it.each([['30D', 30], ['90D', 90], ['12M', 365]] as const)('active member: %s chart spans %i days ending today', (chip, days) => {
    history = Array.from({ length: 40 }, (_, i) => ({ observed_at: iso(i * 10), handicap_index: 10 + (i % 5) / 10 })).reverse();
    const { container } = render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText(chip));
    expect(chartDays(container)).toBe(String(days));
  });

  it.each([['30D', 30], ['90D', 90], ['12M', 365]] as const)('range labels follow the %s chip, computed over its window', (chip, _days) => {
    history = [{ observed_at: iso(300), handicap_index: 18 }, { observed_at: iso(200), handicap_index: 16 }, { observed_at: iso(60), handicap_index: 14 }, { observed_at: iso(20), handicap_index: 12 }, { observed_at: iso(5), handicap_index: 13 }];
    const { container } = render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText(chip));
    const row = container.querySelector('[data-hcp-range]');
    expect(row?.textContent).toContain(`${chip} high`);
    expect(row?.textContent).toContain('Low');
    // The lead edge carries the index in force at the window start.
    const high = { '30D': '14.0', '90D': '16.0', '12M': '18.0' }[chip];
    expect(row?.firstElementChild?.textContent).toBe(`${high}${chip} high`);
    expect(row?.lastElementChild?.textContent).toBe('12.0Low');
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

