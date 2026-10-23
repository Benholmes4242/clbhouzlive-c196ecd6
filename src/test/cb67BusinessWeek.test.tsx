import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

import {
  subKind, headlineBranch, daysSince, barShapes, visibleTaps,
  BusinessWeekCard, BusinessWeekView, BusinessWeekSkeleton,
} from '@/components/business/home/BusinessWeekCard';
import type { BusinessWeek } from '@/hooks/useBusinessWeek';

const base: BusinessWeek = {
  window_start: '', window_end: '', visits: 0, visits_prev: 0, seen_by: 0, seen_by_prev: 0,
  new_followers: 0, followers_total: 0, taps: { website: 0, directions: 0, call: 0, message: 0 },
  bars: { visits: [0, 0, 0, 0, 0, 0, 0], seen_by: [0, 0, 0, 0, 0, 0, 0], new_followers: [0, 0, 0, 0, 0, 0, 0] },
  created_at: '', first_week: false, last_post_at: null,
};
const wk = (o: Partial<BusinessWeek>) => ({ ...base, ...o });

const view = (w: BusinessWeek) => render(
  <MemoryRouter><BusinessWeekView week={w} businessId="b1" name="clbhouz" /></MemoryRouter>,
);

afterEach(cleanup);
beforeEach(() => rpc.mockReset());

describe('CB67 sub-lines', () => {
  it('up when this week beats last', () => expect(subKind(214, 176, false)).toBe('up'));
  it('down when below last week', () => expect(subKind(41, 53, false)).toBe('down'));
  it('same when equal', () => expect(subKind(7, 7, false)).toBe('same'));
  it('zero this week shows last week', () => expect(subKind(0, 2, false)).toBe('zero'));
  it('first week wins over everything', () => expect(subKind(0, 5, true)).toBe('first'));
  it('up renders green, down renders dim (never red)', () => {
    const { container } = view(wk({ visits: 10, visits_prev: 5, seen_by: 3, seen_by_prev: 9 }));
    const up = container.querySelector('[data-week-fig="visits"] [data-week-sub]') as HTMLElement;
    const down = container.querySelector('[data-week-fig="seen_by"] [data-week-sub]') as HTMLElement;
    expect(up.dataset.weekSub).toBe('up');
    expect(up.style.color).toBe('rgb(52, 211, 153)');
    expect(up.textContent).toBe('↑ 5');
    expect(down.dataset.weekSub).toBe('down');
    expect(down.style.color).toBe('rgba(248, 250, 252, 0.42)');
    expect(down.textContent).toBe('↓ 6');
  });
  it('new followers sub is always the total', () => {
    const { container } = view(wk({ followers_total: 1206 }));
    expect(container.querySelector('[data-week-fig="new_followers"] [data-week-sub]')?.getAttribute('data-week-sub')).toBe('total');
  });
});

describe('CB67 headline branches', () => {
  it('first week wins', () => expect(headlineBranch(wk({ first_week: true, visits: 27 }))).toBe('first_week'));
  it('visits above 0', () => expect(headlineBranch(wk({ visits: 1, seen_by: 9 }))).toBe('visits'));
  it('seen without visits', () => expect(headlineBranch(wk({ seen_by: 63 }))).toBe('seen'));
  it('quiet otherwise, with a reason line', () => {
    const { container } = view(wk({ last_post_at: null }));
    expect(container.querySelector('[data-week-headline]')?.getAttribute('data-week-headline')).toBe('quiet');
    expect(container.querySelector('[data-week-reason]')).not.toBeNull();
  });
  it('no reason line outside the quiet branch', () => {
    const { container } = view(wk({ seen_by: 4 }));
    expect(container.querySelector('[data-week-reason]')).toBeNull();
  });
  it('more is green, fewer is not, same has no delta span', () => {
    const more = view(wk({ visits: 10, visits_prev: 2 })).container;
    expect((more.querySelector('[data-week-head-delta="up"]') as HTMLElement).style.color).toBe('rgb(52, 211, 153)');
    cleanup();
    const fewer = view(wk({ visits: 2, visits_prev: 10 })).container;
    expect((fewer.querySelector('[data-week-head-delta="down"]') as HTMLElement).style.color).toBe('');
    cleanup();
    const same = view(wk({ visits: 4, visits_prev: 4 })).container;
    expect(same.querySelector('[data-week-head-delta]')).toBeNull();
  });
  it('days since last post: today 0, yesterday 1, n days', () => {
    const now = Date.parse('2026-10-23T12:00:00Z');
    expect(daysSince('2026-10-23T01:00:00Z', now)).toBe(0);
    expect(daysSince('2026-10-22T09:00:00Z', now)).toBe(1);
    expect(daysSince('2026-09-12T12:00:00Z', now)).toBe(41);
    expect(daysSince(null, now)).toBeNull();
  });
});

describe('CB67 bars', () => {
  it('scales to the max of the seven values', () => {
    const b = barShapes([1, 2, 4, 0, 0, 0, 2]);
    expect(b[2]).toEqual({ kind: 'bar', pct: 100, latest: false });
    expect(b[0]).toEqual({ kind: 'bar', pct: 25, latest: false });
    expect(b[6]).toEqual({ kind: 'bar', pct: 50, latest: true });
  });
  it('zero values are stubs; all-zero is seven stubs', () => {
    expect(barShapes([0, 1, 0, 0, 0, 0, 0])[0]).toEqual({ kind: 'stub' });
    expect(barShapes([0, 0, 0, 0, 0, 0, 0]).every((x) => x.kind === 'stub')).toBe(true);
  });
  it('index 6 renders ink, others 22% white, stubs 2px', () => {
    const { container } = view(wk({ visits: 3, bars: { ...base.bars, visits: [0, 1, 1, 1, 1, 1, 2] } }));
    const bars = container.querySelectorAll('[data-week-fig="visits"] [data-week-spark] i');
    expect(bars).toHaveLength(7);
    expect((bars[6] as HTMLElement).style.background).toBe('rgb(248, 250, 252)');
    expect((bars[1] as HTMLElement).style.background).toBe('rgba(255, 255, 255, 0.22)');
    expect((bars[0] as HTMLElement).style.height).toBe('2px');
    expect((bars[0] as HTMLElement).style.background).toBe('rgba(255, 255, 255, 0.14)');
  });
});

describe('CB67 taps row', () => {
  it('leaves out zero items in fixed order', () => {
    expect(visibleTaps({ website: 6, directions: 0, call: 1, message: 0 }).map((x) => x.key)).toEqual(['website', 'call']);
  });
  it('omits the row when all four are 0', () => {
    expect(view(wk({})).container.querySelector('[data-week-taps]')).toBeNull();
  });
  it('renders the row when any is above 0', () => {
    const { container } = view(wk({ taps: { website: 31, directions: 12, call: 4, message: 2 } }));
    expect(container.querySelectorAll('[data-week-taps] [data-tap]')).toHaveLength(4);
  });
});

const wrap = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
};

describe('CB67 loading and error', () => {
  it('loading keeps kicker, three labels and link; no bars, no figures', () => {
    const { container } = render(<MemoryRouter><BusinessWeekSkeleton businessId="b1" /></MemoryRouter>);
    expect(container.querySelector('[data-week-kicker]')).not.toBeNull();
    expect(container.querySelector('[data-sk="headline"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-week-fig]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-sk="figure"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-sk="sub"]')).toHaveLength(3);
    expect(container.querySelectorAll('i')).toHaveLength(0);
    expect(container.querySelector('[data-week-link]')).not.toBeNull();
  });
  it('a failed RPC renders the error card, never zeros, and retries', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    const { findByText, container } = wrap(<BusinessWeekCard businessId="b1" name="clbhouz" />);
    await findByText('Try again');
    expect(container.querySelector('[data-business-week="error"]')).not.toBeNull();
    expect(container.querySelector('[data-week-fig]')).toBeNull();
    expect(rpc).toHaveBeenCalledWith('get_business_week', { p_business_id: 'b1' });
    fireEvent.click(container.querySelector('[data-week-retry]') as HTMLElement);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
