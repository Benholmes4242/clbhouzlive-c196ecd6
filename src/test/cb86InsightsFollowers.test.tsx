/**
 * CB86 — Insights section 5 "Followers". The i18n mock returns defaultValue
 * or '' so these assert structure (keys, options, data attributes, styles).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fs from 'fs';

const tCalls: { key: string; o?: Record<string, unknown> }[] = [];
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => { tCalls.push({ key: _k, o: o as Record<string, unknown> }); return o?.defaultValue ?? ''; } }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'b1', name: 'Pro Shop', club_id: 'c1' }, isLoading: false }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: 'owner', canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }) }));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => ({ data: [], isFetched: true, isPlaceholderData: false, isError: false }) }));
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio: vi.fn() }) } }));

import { InsightsFollowersSection, reachPct, lastFollowKind } from '@/components/business/insights/InsightsFollowersSection';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';

const YEAR = new Date().getFullYear();
const base = { period_days: 30, total: 120, followers: 100, new: 5, prev: 5, last_new_at: null as string | null, reached: 40, has_posts: true, merge_in_period: false };
const KEY = 'business.insights.followersCard.';
const last = (k: string) => [...tCalls].reverse().find(c => c.key === KEY + k);

const renderCard = (data: unknown, days = 30, error: unknown = null) => {
  rpc.mockResolvedValue({ data, error });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (d: number) => <QueryClientProvider client={qc}><InsightsFollowersSection businessId="b1" businessName="Pro Shop" days={d} /></QueryClientProvider>;
  const view = render(ui(days));
  return { ...view, qc, rerenderDays: (d: number) => view.rerender(ui(d)) };
};
const card = async (c: HTMLElement) => { await waitFor(() => expect(c.querySelector('[data-card="followers"]')).not.toBeNull()); return c.querySelector('[data-card="followers"]') as HTMLElement; };

beforeEach(() => { rpc.mockReset(); tCalls.length = 0; });

describe('CB86 title', () => {
  for (const days of [7, 30, 90]) {
    it(`n, 1 and 0 for ${days} days`, async () => {
      for (const n of [7, 1]) {
        tCalls.length = 0;
        const { container, unmount } = renderCard({ ...base, new: n }, days);
        await card(container);
        expect(last(`title_${days}`)?.o).toMatchObject({ count: n });
        unmount();
      }
      const { container } = renderCard({ ...base, new: 0 }, days);
      const c = await card(container);
      expect(c.querySelector('[data-title="zero"]')).not.toBeNull();
      expect(last(`titleZero_${days}`)).toBeTruthy();
    });
  }
  it('change: +abs under 20, +% from 20, grey fewer, none when equal, nowrap', async () => {
    const cases: [number, number, string | null, string | null][] = [[7, 5, 'up', '+2'], [73, 50, 'up', '+46%'], [5, 10, 'down', '5 fewer'], [30, 40, 'down', '25% fewer'], [4, 4, null, null], [0, 0, null, null]];
    for (const [n, p, dir, text] of cases) {
      const { container, unmount } = renderCard({ ...base, new: n, prev: p });
      const c = await card(container);
      const el = c.querySelector('[data-change]') as HTMLElement | null;
      if (!dir) expect(el).toBeNull();
      else {
        expect(el!.dataset.change).toBe(dir);
        expect(el!.dataset.changeText).toBe(text);
        expect(el!.style.color).toBe(dir === 'up' ? 'rgb(52, 211, 153)' : 'rgba(248, 250, 252, 0.42)');
      }
      unmount();
    }
    const css = fs.readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.insights-followers-change \{[^}]*white-space: nowrap/);
  });
});

describe('CB86 last-follow line', () => {
  it('date this year, past year, today, yesterday, absent when null', async () => {
    const now = new Date();
    const yday = new Date(now.getTime() - 86400000).toISOString();
    expect(lastFollowKind(now.toISOString())).toBe('today');
    expect(lastFollowKind(yday)).toBe('yesterday');
    const thisYear = `${YEAR}-01-13T10:00:00Z`;
    let r = renderCard({ ...base, last_new_at: thisYear });
    await card(r.container);
    expect(last('lastDate')?.o?.date).toBe('13 Jan'); r.unmount();
    r = renderCard({ ...base, last_new_at: '2025-10-13T10:00:00Z' });
    await card(r.container);
    expect(last('lastDate')?.o?.date).toBe(YEAR === 2025 ? '13 Oct' : '13 Oct 2025'); r.unmount();
    r = renderCard({ ...base, last_new_at: now.toISOString() });
    expect((await card(r.container)).querySelector('[data-last="today"]')).not.toBeNull(); r.unmount();
    r = renderCard({ ...base, last_new_at: yday });
    expect((await card(r.container)).querySelector('[data-last="yesterday"]')).not.toBeNull(); r.unmount();
    r = renderCard({ ...base, last_new_at: null });
    expect((await card(r.container)).querySelector('[data-last]')).toBeNull();
  });
});

describe('CB86 inset', () => {
  it('reached of followers with bar width', async () => {
    const { container } = renderCard(base);
    const c = await card(container);
    expect(c.querySelector('[data-reached]')!.getAttribute('data-reached')).toBe('40');
    expect(last('of')?.o).toMatchObject({ n: '100' });
    expect((c.querySelector('[data-bar]') as HTMLElement).style.width).toBe('40%');
    expect(last('saw_30')?.o).toMatchObject({ count: 100 });
  });
  it('2% minimum, empty at 0, singular count', async () => {
    expect(reachPct(1, 1000)).toBe(2);
    expect(reachPct(0, 100)).toBe(0);
    const { container } = renderCard({ ...base, followers: 1, reached: 0 });
    const c = await card(container);
    expect((c.querySelector('[data-bar]') as HTMLElement).style.width).toBe('0%');
    expect(last('saw_30')?.o).toMatchObject({ count: 1 });
    const en = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8')).business.insights.followersCard;
    expect(en.saw_30_one.startsWith('follower saw')).toBe(true);
  });
  it('absent when has_posts is false or followers is 0', async () => {
    let r = renderCard({ ...base, has_posts: false });
    expect((await card(r.container)).querySelector('[data-inset]')).toBeNull(); r.unmount();
    r = renderCard({ ...base, followers: 0, reached: 0 });
    expect((await card(r.container)).querySelector('[data-inset]')).toBeNull();
  });
});

describe('CB86 fine print and none state', () => {
  it('fine print only when merge_in_period', async () => {
    let r = renderCard({ ...base, merge_in_period: true });
    expect((await card(r.container)).querySelector('[data-fine="merge"]')).not.toBeNull(); r.unmount();
    r = renderCard(base);
    expect((await card(r.container)).querySelector('[data-fine]')).toBeNull();
  });
  it('total 0 shows only kicker and none title', async () => {
    const { container } = renderCard({ ...base, total: 0, followers: 0, new: 3, prev: 0, last_new_at: '2026-10-01T00:00:00Z', merge_in_period: true });
    const c = await card(container);
    expect(c.dataset.state).toBe('none');
    expect(last('noneTitle')?.o).toMatchObject({ business: 'Pro Shop' });
    expect(c.children).toHaveLength(2);
    expect(c.querySelector('[data-change],[data-last],[data-inset],[data-fine]')).toBeNull();
  });
});

describe('CB86 data', () => {
  it('query key includes the period; previous card kept during switch', async () => {
    const { container, qc, rerenderDays } = renderCard({ ...base, new: 9 });
    await card(container);
    expect(rpc).toHaveBeenCalledWith('get_business_followers', { p_business_id: 'b1', p_days: 30 });
    let resolve!: (v: unknown) => void;
    rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    rerenderDays(7);
    expect(container.querySelector('[data-new="9"]')).not.toBeNull();
    await act(async () => { resolve({ data: { ...base, new: 2 }, error: null }); });
    await waitFor(() => expect(container.querySelector('[data-new="2"]')).not.toBeNull());
    expect(qc.getQueryData(['business-followers', 'b1', 30])).toBeTruthy();
    expect(qc.getQueryData(['business-followers', 'b1', 7])).toBeTruthy();
  });
  it('nothing before first read; failed read renders no card', async () => {
    rpc.mockReturnValue(new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = render(<QueryClientProvider client={qc}><InsightsFollowersSection businessId="b1" businessName="P" days={30} /></QueryClientProvider>);
    expect(a.container.innerHTML).toBe(''); a.unmount();
    const { container } = renderCard(null, 30, { code: '42501' });
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 20));
    expect(container.querySelector('[data-card="followers"]')).toBeNull();
  });
});

describe('CB86 page', () => {
  it('Follower growth gone; sections 1–4, followers, ENGAGEMENT and REVIEWS render', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_business_followers' ? base : {}, error: null }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container, queryByText, getByText } = render(
      <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
      </MemoryRouter></QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-card="followers"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="posts"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-section="insights-funnel"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="visits"]')).not.toBeNull());
    expect(queryByText('Follower growth')).toBeNull();
    expect(queryByText('AUDIENCE')).toBeNull();
    expect(queryByText('Engagement rate')).toBeNull();
    expect(getByText('Reviews & reputation')).toBeTruthy();
  });
});
