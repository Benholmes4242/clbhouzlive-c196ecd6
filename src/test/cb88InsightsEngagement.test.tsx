/**
 * CB88 — Insights section 6 "Engagement". The i18n mock returns defaultValue
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

import { InsightsEngagementSection } from '@/components/business/insights/InsightsEngagementSection';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';

const base = { period_days: 30, reached: 21, engaged: 6, engaged_prev: 6, likes: 9, comments: 0, has_posts: true };
const KEY = 'business.insights.engagementCard.';
const last = (k: string) => [...tCalls].reverse().find(c => c.key === KEY + k);

const renderCard = (data: unknown, days = 30, error: unknown = null) => {
  rpc.mockResolvedValue({ data, error });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (d: number) => <QueryClientProvider client={qc}><InsightsEngagementSection businessId="b1" days={d} /></QueryClientProvider>;
  const view = render(ui(days));
  return { ...view, qc, rerenderDays: (d: number) => view.rerender(ui(d)) };
};
const card = async (c: HTMLElement) => { await waitFor(() => expect(c.querySelector('[data-card="engagement"]')).not.toBeNull()); return c.querySelector('[data-card="engagement"]') as HTMLElement; };
const settle = async () => { await new Promise(r => setTimeout(r, 20)); };

beforeEach(() => { rpc.mockReset(); tCalls.length = 0; });

describe('CB88 title', () => {
  it('n of N', async () => {
    const { container } = renderCard({ ...base, engaged: 6, reached: 21 });
    const c = await card(container);
    expect(c.querySelector('[data-title="title"]')).not.toBeNull();
    expect(last('title')?.o).toMatchObject({ x: '6', n: '21' });
  });
  it('None of N', async () => {
    const { container } = renderCard({ ...base, engaged: 0, reached: 9 });
    const c = await card(container);
    expect(c.querySelector('[data-title="titleNone"]')).not.toBeNull();
    expect(last('titleNone')?.o).toMatchObject({ n: '9' });
  });
  it('reached = 1 forms', async () => {
    const a = renderCard({ ...base, engaged: 1, reached: 1 });
    expect((await card(a.container)).querySelector('[data-title="titleOne"]')).not.toBeNull();
    a.unmount();
    const b = renderCard({ ...base, engaged: 0, reached: 1 });
    expect((await card(b.container)).querySelector('[data-title="titleOneNone"]')).not.toBeNull();
  });
  it('formatNumber on large values', async () => {
    const { container } = renderCard({ ...base, engaged: 1840, reached: 14200 });
    await card(container);
    expect(last('title')?.o).toMatchObject({ x: '1,840', n: '14,200' });
  });
  it('change via changeOf: up green, fewer grey, none when equal; nowrap', async () => {
    const cases: [number, number, string | null, string | null][] = [[6, 4, 'up', '+2'], [184, 164, 'up', '+12%'], [2, 7, 'down', '5 fewer'], [5, 5, null, null]];
    for (const [e, p, dir, text] of cases) {
      const { container, unmount } = renderCard({ ...base, reached: 2000, engaged: e, engaged_prev: p });
      const c = await card(container);
      const el = c.querySelector('[data-change]') as HTMLElement | null;
      if (!dir) expect(el).toBeNull();
      else {
        expect(el!.dataset.change).toBe(dir);
        expect(el!.dataset.changeText).toBe(text);
        expect(el!.style.color).toBe(dir === 'up' ? 'rgb(52, 211, 153)' : 'rgba(248, 250, 252, 0.42)');
        expect(el!.parentElement!.matches('h3')).toBe(true);
      }
      unmount();
    }
    const css = fs.readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.insights-engagement-change \{[^}]*white-space: nowrap/);
  });
});

describe('CB88 ratio', () => {
  const ratio = async (engaged: number, reached: number) => {
    const { container, unmount } = renderCard({ ...base, engaged, reached });
    const el = (await card(container)).querySelector('[data-ratio]') as HTMLElement | null;
    const out = el ? { kind: el.dataset.ratio, n: el.dataset.ratioN } : null;
    unmount();
    return out;
  };
  it('absent under 20 reached and when engaged is 0', async () => {
    expect(await ratio(5, 19)).toBeNull();
    expect(await ratio(0, 40)).toBeNull();
  });
  it('more than half (11 of 20)', async () => { expect(await ratio(11, 20)).toEqual({ kind: 'half', n: undefined }); });
  it('exact 1 in 4 (5 of 20)', async () => { expect(await ratio(5, 20)).toEqual({ kind: 'exact', n: '4' }); });
  it('about 1 in 4 (6 of 21)', async () => { expect(await ratio(6, 21)).toEqual({ kind: 'about', n: '4' }); });
  it('1 in 2 at exactly half (10 of 20)', async () => { expect(await ratio(10, 20)).toEqual({ kind: 'exact', n: '2' }); });
});

describe('CB88 bar, tiles, fine print', () => {
  it('bar width engaged ÷ reached with 2% floor; absent at engaged 0', async () => {
    const a = renderCard({ ...base, engaged: 6, reached: 24 });
    expect(((await card(a.container)).querySelector('[data-bar]') as HTMLElement).style.width).toBe('25%');
    a.unmount();
    const b = renderCard({ ...base, engaged: 1, reached: 1000 });
    expect(((await card(b.container)).querySelector('[data-bar]') as HTMLElement).style.width).toBe('2%');
    b.unmount();
    const c = renderCard({ ...base, engaged: 0, reached: 9 });
    expect((await card(c.container)).querySelector('[data-bar]')).toBeNull();
  });
  it('tiles singular/plural via count; absent when both 0', async () => {
    const a = renderCard({ ...base, likes: 1, comments: 3 });
    const c = await card(a.container);
    expect(c.querySelector('[data-tiles]')).not.toBeNull();
    expect(tCalls.find(x => x.key === KEY + 'likes')?.o).toMatchObject({ count: 1 });
    expect(tCalls.find(x => x.key === KEY + 'comments')?.o).toMatchObject({ count: 3 });
    a.unmount();
    const b = renderCard({ ...base, likes: 0, comments: 0 });
    expect((await card(b.container)).querySelector('[data-tiles]')).toBeNull();
    const en = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8')).business.insights.engagementCard;
    expect([en.likes_one, en.likes_other, en.comments_one, en.comments_other]).toEqual(['like', 'likes', 'comment', 'comments']);
  });
  it('fine print: both wordings', async () => {
    const a = renderCard({ ...base, engaged: 3 });
    expect((await card(a.container)).querySelector('[data-fine="engaged"]')).not.toBeNull();
    expect(last('fine')).toBeTruthy();
    a.unmount();
    const b = renderCard({ ...base, engaged: 0 });
    expect((await card(b.container)).querySelector('[data-fine="none"]')).not.toBeNull();
    expect(last('fineNone')).toBeTruthy();
  });
});

describe('CB88 states and data', () => {
  it('reached 0: title only, period in key', async () => {
    const { container } = renderCard({ ...base, reached: 0, engaged: 0, likes: 0, comments: 0 }, 7);
    const c = await card(container);
    expect(c.querySelector('[data-title="empty"]')).not.toBeNull();
    expect(last('empty_7')).toBeTruthy();
    expect(c.querySelectorAll('[data-change],[data-ratio],[data-bar],[data-tiles],[data-fine]')).toHaveLength(0);
  });
  it('has_posts false: no card', async () => {
    const { container } = renderCard({ ...base, has_posts: false });
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await settle();
    expect(container.innerHTML).toBe('');
  });
  it('query key includes period; previous data kept during switch', async () => {
    const { container, qc, rerenderDays } = renderCard({ ...base, engaged: 9 });
    await waitFor(() => expect(container.querySelector('[data-engaged="9"]')).not.toBeNull());
    expect(rpc).toHaveBeenCalledWith('get_business_engagement', { p_business_id: 'b1', p_days: 30 });
    let resolve!: (v: unknown) => void;
    rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    rerenderDays(7);
    expect(container.querySelector('[data-engaged="9"]')).not.toBeNull();
    await act(async () => { resolve({ data: { ...base, engaged: 2 }, error: null }); });
    await waitFor(() => expect(container.querySelector('[data-engaged="2"]')).not.toBeNull());
    expect(qc.getQueryData(['business-engagement', 'b1', 30])).toBeTruthy();
    expect(qc.getQueryData(['business-engagement', 'b1', 7])).toBeTruthy();
  });
  it('nothing before first read; failed read renders no card', async () => {
    rpc.mockReturnValue(new Promise(() => {}));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const a = render(<QueryClientProvider client={qc}><InsightsEngagementSection businessId="b1" days={30} /></QueryClientProvider>);
    expect(a.container.innerHTML).toBe(''); a.unmount();
    const { container } = renderCard(null, 30, { code: '42501' });
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await settle();
    expect(container.querySelector('[data-card="engagement"]')).toBeNull();
  });
});

describe('CB88 page', () => {
  it('Engagement rate gone; sections 1–5, engagement and REVIEWS render', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_business_engagement' ? base : name === 'get_business_review_summary' ? { linked: true, total: 0, courses: [], scores: [] } : {}, error: null }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container, queryByText, getByText } = render(
      <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
      </MemoryRouter></QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-card="engagement"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="posts"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-section="insights-funnel"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="visits"]')).not.toBeNull());
    expect(queryByText('Engagement rate')).toBeNull();
    await waitFor(() => expect(container.querySelector('[data-card="reviews"]')).not.toBeNull());
    expect(queryByText('Reviews & reputation')).toBeNull();
    // Engagement sits after the posts card and before REVIEWS.
    const eng = container.querySelector('[data-card="engagement"]')!;
    const posts = container.querySelector('[data-card="posts"]')!;
    expect(posts.compareDocumentPosition(eng) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(eng.compareDocumentPosition(container.querySelector('[data-card="reviews"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
