/**
 * CB82 — Insights section 1: headline and "from seen to acted".
 * The i18n mock returns defaultValue or '' so these assert structure (data
 * attributes, counts passed, styles), never translated words.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

let role: string = 'owner';
vi.mock('@/hooks/useBusinessProfile', () => ({
  useBusinessProfile: () => ({ data: { id: 'b1', name: 'Pro Shop', club_id: null }, isLoading: false }),
}));
vi.mock('@/hooks/useBusinessMembership', () => ({
  useBusinessMembership: () => ({ data: { role, canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }),
}));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: () => ({ data: null, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
const openPostStudio = vi.fn();
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio }) } }));

import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';
import {
  InsightsFunnel, changeOf, changeText, barPct, clipPreview, leakLineOf, FUNNEL_GREEN, FUNNEL_DIM,
} from '@/components/business/insights/InsightsFunnel';
import type { BusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';

const mk = (o: Partial<{ saw: number; opened: number; visits: number; followed: number; total: number; tapped: number; prev: Partial<Record<'saw' | 'opened' | 'followed' | 'tapped', number>>; top: string | null }> = {}): BusinessInsightsFunnel => ({
  period_days: 30,
  saw: { value: o.saw ?? 100, prev: o.prev?.saw ?? (o.saw ?? 100) },
  opened: { value: o.opened ?? 50, prev: o.prev?.opened ?? (o.opened ?? 50), visits: o.visits ?? 60 },
  followed: { value: o.followed ?? 5, prev: o.prev?.followed ?? (o.followed ?? 5), total: o.total ?? 40 },
  tapped: { value: o.tapped ?? 3, prev: o.prev?.tapped ?? (o.tapped ?? 3) },
  top_post: o.top === null ? null : { post_id: 'p1', preview: o.top ?? 'Short post', reached: 9 },
});

const renderFunnel = (f: BusinessInsightsFunnel, canPost = true, onPost = vi.fn()) =>
  render(<InsightsFunnel funnel={f} businessName="Pro Shop" days={30} canPost={canPost} onPost={onPost} />);

const isRed = (c: string) => /#(ef4444|dc2626|f87171|ff0000)|rgb\(2[0-5]\d,\s*\d{1,2},/i.test(c);

describe('CB82 headline', () => {
  it('passes the saw/opened counts for plurals', () => {
    const { container } = renderFunnel(mk({ saw: 1, opened: 1 }));
    expect(container.querySelector('[data-variant="saw"]')!.getAttribute('data-count')).toBe('1');
    expect(container.querySelector('[data-opened]')!.getAttribute('data-opened')).toBe('1');
  });
  it('saw = 0 shows the none variant on both lines and no top post', () => {
    const { container } = renderFunnel(mk({ saw: 0, opened: 0, followed: 0, tapped: 0, visits: 0 }));
    expect(container.querySelectorAll('[data-variant="none"]')).toHaveLength(2);
    expect(container.querySelector('[data-variant="saw"]')).toBeNull();
    expect(container.querySelector('[data-top-post]')).toBeNull();
  });
  it('top-post line cuts at 40 characters with …', () => {
    const long = 'abcdefghij'.repeat(5);
    const { container } = renderFunnel(mk({ top: long }));
    expect(container.querySelector('[data-top-post]')!.getAttribute('data-top-post')).toBe(`${long.slice(0, 40)}…`);
    expect(clipPreview('short')).toBe('short');
    expect(clipPreview('x'.repeat(40))).toBe('x'.repeat(40));
  });
  it('top-post line omitted when top_post is null', () => {
    const { container } = renderFunnel(mk({ top: null }));
    expect(container.querySelector('[data-top-post]')).toBeNull();
  });
});

describe('CB82 rows', () => {
  it('every row has its sub-line; visits present at 1', () => {
    const { container } = renderFunnel(mk({ visits: 1 }));
    for (const id of ['saw', 'opened', 'followed', 'tapped']) {
      expect(container.querySelector(`[data-row="${id}"] [data-sub]`)).not.toBeNull();
    }
  });
  it('no visits sub-line at 0', () => {
    const { container } = renderFunnel(mk({ visits: 0 }));
    expect(container.querySelector('[data-row="opened"] [data-sub]')).toBeNull();
  });
});

describe('CB82 bars', () => {
  it('fill = value ÷ saw, capped at 100%', () => {
    const { container } = renderFunnel(mk({ saw: 200, opened: 50, followed: 300 }));
    const w = (id: string) => (container.querySelector(`[data-row="${id}"] [data-fill]`) as HTMLElement).style.width;
    expect(w('saw')).toBe('100%');
    expect(w('opened')).toBe('25%');
    expect(w('followed')).toBe('100%');
  });
  it('all empty when saw = 0', () => {
    const { container } = renderFunnel(mk({ saw: 0, opened: 3 }));
    container.querySelectorAll('[data-fill]').forEach(el => expect((el as HTMLElement).style.width).toBe('0%'));
    expect(barPct(5, 0)).toBe(0);
  });
});

describe('CB82 changes', () => {
  it('unchanged renders nothing', () => {
    expect(changeOf(5, 5)).toBeNull();
    const { container } = renderFunnel(mk());
    expect(container.querySelector('[data-change]')).toBeNull();
  });
  it('1 → 3 is +2 in green', () => {
    const c = changeOf(3, 1)!;
    expect(changeText(c)).toBe('+2');
    expect(c.color).toBe(FUNNEL_GREEN);
  });
  it('8 → 2 is 6 fewer in grey', () => {
    const c = changeOf(2, 8)!;
    expect(changeText(c)).toBe('6 fewer');
    expect(c.color).toBe(FUNNEL_DIM);
  });
  it('20 → 25 is +25%', () => expect(changeText(changeOf(25, 20)!)).toBe('+25%'));
  it('40 → 30 is 25% fewer', () => expect(changeText(changeOf(30, 40)!)).toBe('25% fewer'));
  it('nothing red is rendered', () => {
    const { container } = renderFunnel(mk({ saw: 30, opened: 2, prev: { saw: 40, opened: 8, followed: 1, tapped: 50 } }));
    const marks = container.querySelectorAll('[data-change]');
    expect(marks.length).toBe(4);
    container.querySelectorAll('*').forEach(el => expect(isRed((el as HTMLElement).style.color)).toBe(false));
  });
});

describe('CB82 line under the rows', () => {
  it('a) saw = 0: no box, button for owner/admin/editor only', () => {
    for (const can of [true, false]) {
      const onPost = vi.fn();
      const { container, unmount } = renderFunnel(mk({ saw: 0, opened: 0 }), can, onPost);
      expect(container.querySelector('[data-leak]')).toBeNull();
      const btn = container.querySelector('[data-cta="post-as-business"]');
      if (can) { fireEvent.click(btn!); expect(onPost).toHaveBeenCalledTimes(1); } else expect(btn).toBeNull();
      unmount();
    }
  });
  it('b) opened under 20% of saw', () => {
    expect(leakLineOf(mk({ saw: 100, opened: 19 }))).toBe('stop');
    const { container } = renderFunnel(mk({ saw: 100, opened: 19 }));
    expect(container.querySelector('[data-leak="stop"]')).not.toBeNull();
  });
  it('c) opened and left', () => {
    expect(leakLineOf(mk({ saw: 10, opened: 5, followed: 0, tapped: 0 }))).toBe('left');
  });
  it('none otherwise', () => {
    expect(leakLineOf(mk({ saw: 10, opened: 5, followed: 1, tapped: 0 }))).toBeNull();
    const { container } = renderFunnel(mk({ saw: 10, opened: 5 }));
    expect(container.querySelector('[data-leak]')).toBeNull();
    expect(container.querySelector('[data-cta]')).toBeNull();
  });
});

// ── Page ──
const raw = (saw: number) => ({
  period_days: 30, saw: { value: saw, prev: saw }, opened: { value: 1, prev: 1, visits: 1 },
  followed: { value: 1, prev: 1, total: 1 }, tapped: { value: 1, prev: 1 }, top_post: null,
});

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CB82 page', () => {
  let pending: ((v: unknown) => void) | null;
  beforeEach(() => {
    role = 'owner';
    pending = null;
    rpc.mockImplementation((name: string, args: { p_days: number }) => {
      if (name === 'get_business_insights_funnel') {
        if (args.p_days === 7) return new Promise(res => { pending = res; });
        return Promise.resolve({ data: raw(args.p_days === 30 ? 30 : 90), error: null });
      }
      return Promise.resolve({ data: {}, error: null });
    });
  });

  it('OVERVIEW card is gone and the other cards still render', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelector('[data-section="insights-funnel"]')).not.toBeNull());
    expect(screen.queryByText('OVERVIEW')).toBeNull();
    for (const k of ['VISITORS', 'DISCOVERY', 'CONTENT', 'ENGAGEMENT']) expect(screen.getByText(k)).toBeTruthy();
    expect(screen.getAllByText('AUDIENCE')).toHaveLength(2);
  });

  it('failed read renders no headline or card; rest carries on', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve(name === 'get_business_insights_funnel' ? { data: null, error: { code: '42501' } } : { data: {}, error: null }));
    const { container } = renderPage();
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('get_business_insights_funnel', expect.anything()));
    await act(async () => { await Promise.resolve(); });
    expect(container.querySelector('[data-section="insights-funnel"]')).toBeNull();
    expect(screen.getByText('VISITORS')).toBeTruthy();
  });

  it('switching period keeps the previous figures until the new ones arrive', async () => {
    const { container } = renderPage();
    const sawFig = () => container.querySelector('[data-row="saw"] [data-figure]')?.textContent;
    await waitFor(() => expect(sawFig()).toBe('30'));
    fireEvent.click(screen.getByText('7 days'));
    await waitFor(() => expect(pending).not.toBeNull());
    expect(sawFig()).toBe('30');
    await act(async () => { pending!({ data: raw(7), error: null }); });
    await waitFor(() => expect(sawFig()).toBe('7'));
  });
});
