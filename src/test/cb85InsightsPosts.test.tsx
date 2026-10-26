/**
 * CB85 — Insights section 4 "Your posts". The i18n mock returns defaultValue
 * or '' so these assert structure (data attributes, keys, styles), never words.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const tCalls: { key: string; o?: Record<string, unknown> }[] = [];
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => { tCalls.push({ key: _k, o: o as Record<string, unknown> }); return o?.defaultValue ?? ''; } }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/hooks/useBusinessProfile', () => ({
  useBusinessProfile: () => ({ data: { id: 'b1', name: 'Pro Shop', club_id: 'c1' }, isLoading: false }),
}));
vi.mock('@/hooks/useBusinessMembership', () => ({
  useBusinessMembership: () => ({ data: { role: 'owner', canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }),
}));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => ({ data: [], isFetched: true, isPlaceholderData: false, isError: false }) }));
const openPostStudio = vi.fn();
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio }) } }));

import { InsightsPostsSection, postsTitleKind, foldKind, postDate, barPct } from '@/components/business/insights/InsightsPostsSection';
import type { PostReachRow, BusinessPostReach } from '@/hooks/useBusinessPostReach';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';

const YEAR = new Date().getFullYear();
const row = (id: string, reached: number, o: Partial<PostReachRow> = {}): PostReachRow => ({
  post_id: id, preview: `Post ${id}`, created_at: `${YEAR}-10-13T10:00:00Z`, reached, not_following: 0, likes: 0, comments: 0, ...o,
});
const payload = (posts: PostReachRow[], last_post: BusinessPostReach['last_post'] = null) => ({ period_days: 30, posts, last_post });

const Loc = () => <div data-loc={useLocation().pathname} />;
const renderSection = (data: unknown, props: Partial<{ days: number; canPost: boolean }> = {}) => {
  rpc.mockResolvedValue({ data, error: null });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (days = props.days ?? 30) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="*" element={<><Loc /><InsightsPostsSection businessId="b1" days={days} canPost={props.canPost ?? true} onPost={() => openPostStudio({ actorType: 'business', actorId: 'b1' })} onOpen={() => {}} /></>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  const view = render(ui());
  return { ...view, qc, rerenderDays: (d: number) => view.rerender(ui(d)) };
};
const card = async (c: HTMLElement) => { await waitFor(() => expect(c.querySelector('[data-card="posts"]')).not.toBeNull()); return c.querySelector('[data-card="posts"]') as HTMLElement; };
const lastCall = (suffix: string) => [...tCalls].reverse().find(c => c.key === `business.insights.posts.${suffix}`);

beforeEach(() => { rpc.mockReset(); tCalls.length = 0; openPostStudio.mockReset(); });

describe('CB85 title', () => {
  it('outsized when R[0] beats the sum of the rest', () => {
    expect(postsTitleKind([row('a', 10), row('b', 4), row('c', 5)])).toBe('outsized');
  });
  it('boundary: R[0] equal to the rest is "best"', () => {
    expect(postsTitleKind([row('a', 9), row('b', 4), row('c', 5)])).toBe('best');
  });
  it('one reached post is "best", with singular count', async () => {
    const { container } = renderSection(payload([row('a', 1), row('b', 0)]));
    expect((await card(container)).dataset.title).toBe('best');
    expect(lastCall('titleBest')?.o?.count).toBe(1);
  });
  it('none reached: count of posts (1 and many)', async () => {
    expect(postsTitleKind([row('a', 0)])).toBe('none');
    const { container } = renderSection(payload([row('a', 0)]));
    expect((await card(container)).dataset.title).toBe('none');
    expect(lastCall('titleNone')?.o?.count).toBe(1);
  });
  it('nothing posted uses the period key and drops the right kicker', async () => {
    const { container } = renderSection(payload([]), { days: 7 });
    const c = await card(container);
    expect(c.dataset.title).toBe('nothing');
    expect(lastCall('titleNothing_7')).toBeTruthy();
    expect(c.querySelector('[data-kicker-right]')).toBeNull();
    expect(c.querySelector('.insights-posts-fine')).toBeNull();
  });
});

describe('CB85 rows', () => {
  it('render in returned order; bars relative to posts[0], min 2%, none at 0', async () => {
    const { container } = renderSection(payload([row('a', 200), row('c', 1), row('b', 50), row('z', 0)]));
    const c = await card(container);
    expect([...c.querySelectorAll('[data-post-row]')].map(e => e.getAttribute('data-post-row'))).toEqual(['a', 'c', 'b', 'z']);
    const w = (id: string) => (c.querySelector(`[data-post-row="${id}"] [data-bar]`) as HTMLElement | null)?.style.width;
    expect(w('a')).toBe('100%');
    expect(w('c')).toBe('2%');
    expect(w('b')).toBe('25%');
    const zero = c.querySelector('[data-post-row="z"]') as HTMLElement;
    expect(zero.querySelector('[data-bar]')).toBeNull();
    expect(zero.hasAttribute('data-zero')).toBe(true);
    expect(zero.querySelector('[data-count]')?.textContent).toBe('0');
    expect(barPct(0, 0)).toBe(0);
  });
  it('meta parts only above 0; singulars; past-year date; empty preview fallback', async () => {
    const { container } = renderSection(payload([
      row('a', 5, { likes: 1, comments: 0, not_following: 1, preview: '' }),
      row('b', 3, { created_at: '2025-10-13T10:00:00Z' }),
    ]));
    const c = await card(container);
    const a = c.querySelector('[data-post-row="a"]') as HTMLElement;
    expect(a.querySelector('[data-empty-preview]')).not.toBeNull();
    expect(tCalls.some(x => x.key.endsWith('posts.noCaption'))).toBe(true);
    expect(tCalls.filter(x => x.key.endsWith('posts.likes')).map(x => x.o?.count)).toContain(1);
    expect(tCalls.filter(x => x.key.endsWith('posts.notFollowing')).map(x => x.o?.count)).toContain(1);
    expect(tCalls.some(x => x.key.endsWith('posts.comments'))).toBe(false);
    expect(c.querySelector('[data-post-row="b"] [data-meta]')?.textContent).toBe(postDate('2025-10-13T10:00:00Z'));
    expect(postDate('2025-10-13T10:00:00Z')).toMatch(/2025/);
    expect(postDate(`${YEAR}-10-13T10:00:00Z`)).not.toMatch(String(YEAR));
  });
  it('a row opens /post/{id} on the page', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_business_post_reach' ? payload([row('p9', 3)]) : {}, error: null }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /><Route path="*" element={<Loc />} /></Routes>
      </MemoryRouter></QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-post-row="p9"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-post-row="p9"]')!);
    await waitFor(() => expect(container.querySelector('[data-loc]')?.getAttribute('data-loc')).toBe('/post/p9'));
  });
});

describe('CB85 fold', () => {
  it('no line at four rows', async () => {
    const { container } = renderSection(payload([row('a', 4), row('b', 3), row('c', 2), row('d', 1)]));
    expect((await card(container)).querySelector('.insights-posts-more')).toBeNull();
  });
  it('three wordings with singulars', () => {
    expect(foldKind([row('e', 0)])).toBe('all-zero');
    expect(foldKind([row('e', 1)])).toBe('none-zero');
    expect(foldKind([row('e', 1), row('f', 0)])).toBe('mixed');
  });
  it('singular counts reach the strings', async () => {
    const { container } = renderSection(payload([row('a', 4), row('b', 3), row('c', 2), row('d', 1), row('e', 0)]));
    const m = (await card(container)).querySelector('.insights-posts-more') as HTMLElement;
    expect(m.dataset.fold).toBe('all-zero');
    expect(lastCall('foldAllZero')?.o?.count).toBe(1);
  });
  it('mixed passes n and z; Show / Show fewer; period change collapses', async () => {
    const posts = [row('a', 9), row('b', 8), row('c', 7), row('d', 6), row('e', 5), row('f', 0), row('g', 0)];
    const v = renderSection(payload(posts));
    const c = await card(v.container);
    const m = () => c.querySelector('.insights-posts-more') as HTMLElement;
    expect(m().dataset.fold).toBe('mixed');
    expect(lastCall('foldMixed')?.o).toMatchObject({ n: '3', z: '2' });
    expect(c.querySelectorAll('[data-post-row]')).toHaveLength(4);
    fireEvent.click(c.querySelector('[data-fold-toggle]')!);
    expect(c.querySelectorAll('[data-post-row]')).toHaveLength(7);
    expect(m().dataset.fold).toBe('open');
    expect(m().querySelector('span')?.textContent).toBe('');
    fireEvent.click(c.querySelector('[data-fold-toggle]')!);
    expect(c.querySelectorAll('[data-post-row]')).toHaveLength(4);
    fireEvent.click(c.querySelector('[data-fold-toggle]')!);
    v.rerenderDays(90);
    await waitFor(() => expect(v.container.querySelectorAll('[data-post-row]')).toHaveLength(4));
  });
});

describe('CB85 nothing posted', () => {
  it.each([[12, 'lastReached', 12], [1, 'lastReached', 1], [0, 'lastZero', undefined]])('last post reached %s', async (n, key, count) => {
    const { container } = renderSection(payload([], { post_id: 'l', created_at: '2026-09-02T10:00:00Z', reached: n }));
    const c = await card(container);
    expect(c.querySelector('[data-last-reached]')?.getAttribute('data-last-reached')).toBe(String(n));
    expect(lastCall(key)?.o?.count).toBe(count);
  });
  it('no sentence when last_post is null', async () => {
    const { container } = renderSection(payload([]));
    expect((await card(container)).querySelector('[data-last-reached]')).toBeNull();
  });
  it('button only when canPost, and it opens the composer', async () => {
    const a = renderSection(payload([]), { canPost: false });
    expect((await card(a.container)).querySelector('[data-write-post]')).toBeNull();
    a.unmount();
    const b = renderSection(payload([]));
    fireEvent.click((await card(b.container)).querySelector('[data-write-post]')!);
    expect(openPostStudio).toHaveBeenCalledWith({ actorType: 'business', actorId: 'b1' });
  });
});

describe('CB85 data', () => {
  it('query key includes the period; previous data kept during a switch', async () => {
    let release: ((v: unknown) => void) | null = null;
    rpc.mockImplementation((_n: string, args: { p_days: number }) => args.p_days === 7
      ? new Promise(res => { release = res; })
      : Promise.resolve({ data: payload([row('old', 3)]), error: null }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const ui = (d: number) => <QueryClientProvider client={qc}><MemoryRouter><InsightsPostsSection businessId="b1" days={d} canPost onPost={() => {}} onOpen={() => {}} /></MemoryRouter></QueryClientProvider>;
    const v = render(ui(30));
    await waitFor(() => expect(v.container.querySelector('[data-post-row="old"]')).not.toBeNull());
    v.rerender(ui(7));
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('get_business_post_reach', { p_business_id: 'b1', p_days: 7 }));
    expect(v.container.querySelector('[data-post-row="old"]')).not.toBeNull();
    expect(qc.getQueryCache().find({ queryKey: ['business-post-reach', 'b1', 30] })).toBeTruthy();
    await act(async () => { release!({ data: payload([row('new', 2)]), error: null }); });
    await waitFor(() => expect(v.container.querySelector('[data-post-row="new"]')).not.toBeNull());
    expect(qc.getQueryCache().find({ queryKey: ['business-post-reach', 'b1', 7] })).toBeTruthy();
  });
  it('a failed read renders no card', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const v = render(<QueryClientProvider client={qc}><MemoryRouter><InsightsPostsSection businessId="b1" days={30} canPost onPost={() => {}} onOpen={() => {}} /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(v.container.querySelector('[data-card="posts"]')).toBeNull();
  });
});

describe('CB85 page', () => {
  it('Top posts card is gone; FOLLOWERS, ENGAGEMENT and REVIEWS render', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'get_business_post_reach' ? payload([row('a', 1)]) : {}, error: null }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container, queryByText, getByText } = render(
      <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
      </MemoryRouter></QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-card="posts"]')).not.toBeNull());
    expect(queryByText('Top posts')).toBeNull();
    expect(queryByText('CONTENT')).toBeNull();
    // CB86: the FOLLOWERS card replaced Follower growth.
    expect(queryByText('Follower growth')).toBeNull();
    await waitFor(() => expect(container.querySelector('[data-card="followers"]')).not.toBeNull());
    expect(getByText('ENGAGEMENT')).toBeTruthy();
    expect(getByText('Reviews & reputation')).toBeTruthy();
  });
});
