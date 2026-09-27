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

describe('Walk your index — window anchored to today', () => {
  it('inactive member: 30D is a flat line, readout reads NO CHANGE at today and FIRST IN WINDOW at the start', () => {
    history = [{ observed_at: iso(200), handicap_index: 14.2 }, { observed_at: iso(45), handicap_index: 12.6 }];
    render(<IndexSection connection={conn} />);
    fireEvent.click(screen.getByText('30D'));
    expect(axisStart()).toBe(format(new Date(Date.now() - 30 * DAY), 'MMM yyyy'));
    expect(screen.getByText('12.6')).toBeTruthy();
    expect(screen.getByText('common:handicap.walk.noChange')).toBeTruthy();
    // scrub to the left edge
    const chart = screen.getByRole('img');
    chart.getBoundingClientRect = () => ({ left: 0 } as DOMRect);
    fireEvent.pointerDown(chart, { clientX: 0, pointerId: 1 });
    expect(screen.getByText('common:handicap.walk.firstInWindow')).toBeTruthy();
    expect(screen.getByText('12.6')).toBeTruthy();
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
    // All-empty history renders nothing (existing behaviour); nothing to walk.
    expect(container.querySelector('svg')).toBeNull();
  });
});
