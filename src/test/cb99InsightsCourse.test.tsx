import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const calls: { key: string; o?: Record<string, unknown> }[] = [];
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => { calls.push({ key: _k, o: o as Record<string, unknown> }); return o?.defaultValue ?? ''; } }) }));
const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'b1', name: 'Sundridge Park Golf Club', club_id: 'c1' }, isLoading: false }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: 'owner', canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => ({ data: [], isFetched: true, isPlaceholderData: false, isError: false }) }));
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio: vi.fn() }) } }));

import { InsightsCourseSection, courseActivityClubName } from '@/components/business/insights/InsightsCourseSection';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';
const base = { available: true, period_days: 30, rounds: 38, prev_rounds: 32, golfers: 17, member_rounds: 29, visitor_rounds: 6, unknown_rounds: 3, visitors: 4, repeat_visitors: 1, courses: [{ course_id: 'e', name: 'Sundridge Park Golf Club (East Course)', rounds: 22 }, { course_id: 'w', name: 'Sundridge Park Golf Club (West Course)', rounds: 16 }], regions: null, elsewhere: null, last_round: null };
const nav = vi.fn();
const last = (key: string) => [...calls].reverse().find(c => c.key === `business.insights.courseCard.${key}`);
const client = (gcTime = 0) => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime } } });
function setup(data: unknown = base, error: unknown = null, gcTime = 0) {
  rpc.mockResolvedValue({ data, error });
  const qc = client(gcTime);
  const ui = (days: number) => <QueryClientProvider client={qc}><InsightsCourseSection businessId="b1" businessName="Sundridge Park Golf Club" days={days} onNavigate={nav} /></QueryClientProvider>;
  const view = render(ui(30));
  return { ...view, qc, switchDays: (days: number) => view.rerender(ui(days)) };
}
const ready = async (container: HTMLElement) => { await waitFor(() => expect(container.querySelector('[data-card="course"]')).not.toBeNull()); return container; };
const settled = async (qc: QueryClient, days = 30) => waitFor(() => expect(qc.getQueryState(['business-course-activity', 'b1', days])?.fetchStatus).toBe('idle'));
beforeEach(() => { rpc.mockReset(); nav.mockReset(); calls.length = 0; });

describe('CB99 availability and changes', () => {
  it('unavailable renders no card', async () => { const v = setup({ available: false }); await settled(v.qc); expect(v.container.innerHTML).toBe(''); });
  it('failed read renders no card', async () => { const v = setup(null, { code: '42501' }); await settled(v.qc); expect(v.container.innerHTML).toBe(''); });
  it('first pending read renders nothing', () => { rpc.mockReturnValue(new Promise(() => {})); const qc = client(); const v = render(<QueryClientProvider client={qc}><InsightsCourseSection businessId="b1" businessName="Club" days={30} onNavigate={nav} /></QueryClientProvider>); expect(v.container.innerHTML).toBe(''); });
  for (const [rounds, prev, dir, text] of [[38, 32, 'up', '+19%'], [412, 453, 'down', '9% fewer'], [6, 6, null, null], [6, 4, 'up', '+2']] as const) {
    it(`shared change ${rounds}/${prev}`, async () => { const c = await ready(setup({ ...base, rounds, prev_rounds: prev }).container); const mark = c.querySelector('[data-change]'); expect(mark?.getAttribute('data-change') ?? null).toBe(dir); expect(mark?.getAttribute('data-change-text') ?? null).toBe(text); });
  }
  it('singular counts and trimmed club are passed to plural selectors', async () => { await ready(setup({ ...base, rounds: 1, golfers: 1, visitors: 1, repeat_visitors: 0 }).container); expect(last('title')?.o).toMatchObject({ count: 1, n: '1', club: 'Sundridge Park', days: 30 }); expect(last('golfers')?.o).toMatchObject({ count: 1 }); expect(last('visitorNote')?.o).toMatchObject({ count: 1 }); });
  it('trims only trailing Golf Club, Golf Course and GC', () => { expect(['Sundridge Park Golf Club', 'Park Golf Course', 'Park GC', 'Golf Club Park', 'Park Country Club'].map(courseActivityClubName)).toEqual(['Sundridge Park', 'Park', 'Park', 'Golf Club Park', 'Park Country Club']); });
});

describe('CB99 server rows', () => {
  it('split counts and legend preserve server totals', async () => { const c = await ready(setup().container); expect([...c.querySelectorAll('[data-split] i')].map(e => [(e as HTMLElement).dataset.segment, (e as HTMLElement).style.flexGrow])).toEqual([['member', '29'], ['visitor', '6'], ['unknown', '3']]); expect([...c.querySelectorAll('[data-rounds]')].map(e => e.textContent)).toEqual(['29', '6', '3']); });
  it('zero segments omitted, first two legend rows retained', async () => { const c = await ready(setup({ ...base, member_rounds: 0, visitor_rounds: 38, unknown_rounds: 0 }).container); expect([...c.querySelectorAll('[data-split] i')].map(e => e.getAttribute('data-segment'))).toEqual(['visitor']); expect([...c.querySelectorAll('[data-legend]')].map(e => e.getAttribute('data-legend'))).toEqual(['member', 'visitor']); });
  it('multiple courses use shared labels in server order', async () => { const c = await ready(setup().container); expect([...c.querySelectorAll('[data-course]')].map(e => e.getAttribute('data-course'))).toEqual(['e', 'w']); expect([...c.querySelectorAll('.insights-course-name')].map(e => e.textContent)).toEqual(['East Course', 'West Course']); });
  it('one course has no course rows', async () => { const c = await ready(setup({ ...base, courses: base.courses.slice(0, 1) }).container); expect(c.querySelector('[data-courses]')).toBeNull(); });
  it('null regions hide the block even with elsewhere', async () => { const c = await ready(setup({ ...base, elsewhere: 11 }).container); expect(c.querySelector('[data-regions]')).toBeNull(); });
  it('server regions retained below five; positive Elsewhere last with shared maximum', async () => { const c = await ready(setup({ ...base, regions: [{ region: 'London', count: 31 }, { region: 'Surrey', count: 2 }], elsewhere: 62 }).container); const rows = [...c.querySelectorAll('[data-region]')]; expect(rows.map(e => e.getAttribute('data-region'))).toEqual(['London', 'Surrey', '']); expect(rows[2].hasAttribute('data-elsewhere')).toBe(true); expect((rows[0].querySelector('i') as HTMLElement).style.width).toBe('50%'); expect((rows[2].querySelector('i') as HTMLElement).style.width).toBe('100%'); });
  it('zero Elsewhere omitted', async () => { const c = await ready(setup({ ...base, regions: [], elsewhere: 0 }).container); expect(c.querySelector('[data-regions]')).not.toBeNull(); expect(c.querySelector('[data-elsewhere]')).toBeNull(); });
  it('plural visitor note and repeat clause use server counts', async () => { const c = await ready(setup().container); expect(last('visitorNote')?.o).toMatchObject({ count: 4, n: '4' }); expect(c.querySelector('[data-repeat="1"]')).not.toBeNull(); });
  it('no repeat clause at zero', async () => { const c = await ready(setup({ ...base, repeat_visitors: 0 }).container); expect(c.querySelector('[data-repeat]')).toBeNull(); });
  it('no visitor note at zero', async () => { const c = await ready(setup({ ...base, visitors: 0 }).container); expect(c.querySelector('[data-visitors]')).toBeNull(); });
});

describe('CB99 empty and period states', () => {
  it('zero rounds with last date has short fine print and link', async () => { const c = await ready(setup({ ...base, rounds: 0, last_round: '2026-10-12' }).container); expect(c.querySelector('[data-state="empty"]')).not.toBeNull(); expect(c.querySelector('[data-last-round="2026-10-12"]')).not.toBeNull(); expect(c.querySelector('[data-fine="empty"]')).not.toBeNull(); expect(c.querySelector('[data-total], [data-split], [data-regions], [data-visitors], [data-change]')).toBeNull(); fireEvent.click(c.querySelector('.insights-course-link') as HTMLElement); expect(nav).toHaveBeenCalledWith('/business/b1/course'); });
  it('zero rounds without last date omits the line', async () => { const c = await ready(setup({ ...base, rounds: 0 }).container); expect(c.querySelector('[data-last-round]')).toBeNull(); expect(last('lastRound')).toBeUndefined(); });
  it('date helper includes the year for a prior year', async () => { await ready(setup({ ...base, rounds: 0, last_round: '2020-10-12' }).container); expect(last('lastRound')?.o?.date).toBe('12 Oct 2020'); });
  it('query key and arguments include each picker period; old snapshot remains until settled', async () => {
    const v = setup(base, null, Infinity); await ready(v.container);
    for (const days of [7, 90]) {
      let resolve: ((v: unknown) => void) | undefined;
      rpc.mockReturnValue(new Promise(r => { resolve = r; }));
      v.switchDays(days);
      expect(v.container.querySelector('[data-total="38"]')).not.toBeNull();
      expect(last('title')?.o?.days).toBe(days === 7 ? 30 : 7);
      await waitFor(() => expect(rpc).toHaveBeenCalledWith('get_business_course_activity', { p_business_id: 'b1', p_days: days }));
      await act(async () => { resolve?.({ data: { ...base, period_days: days }, error: null }); });
      await waitFor(() => expect(last('title')?.o?.days).toBe(days));
      expect(v.qc.getQueryData(['business-course-activity', 'b1', days])).toBeTruthy();
    }
    expect(v.qc.getQueryData(['business-course-activity', 'b1', 30])).toBeTruthy();
  });
  it('a failed period switch hides previous card', async () => { const v = setup(); await ready(v.container); rpc.mockResolvedValue({ data: null, error: { code: '42501' } }); v.switchDays(7); await settled(v.qc, 7); await waitFor(() => expect(v.container.querySelector('[data-card="course"]')).toBeNull()); });
  it('course card follows Reviews; the other sections still settle', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_business_course_activity' ? base : name === 'get_business_review_summary' ? { linked: true, total: 0, courses: [], scores: [] } : name === 'get_business_engagement' ? { has_posts: true, reached: 0 } : {}, error: null }));
    const qc = client();
    const v = render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}><Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes></MemoryRouter></QueryClientProvider>);
    for (const selector of ['[data-section="insights-funnel"]', ...['visits', 'followers', 'posts', 'engagement', 'reviews', 'course'].map(s => `[data-card="${s}"]`)]) await waitFor(() => expect(v.container.querySelector(selector)).not.toBeNull());
    const cards = [...v.container.querySelectorAll('[data-card]')].map(e => e.getAttribute('data-card'));
    expect(cards.slice(-2)).toEqual(['reviews', 'course']);
  });
});