/**
 * CB89 — Insights section 7 "Reviews". The i18n mock returns defaultValue or
 * '' so these assert structure (keys, options, data attributes, styles).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const tCalls: { key: string; o?: Record<string, unknown> }[] = [];
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => { tCalls.push({ key: _k, o: o as Record<string, unknown> }); return o?.defaultValue ?? ''; } }) }));

const rpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: { id: 'b1', name: 'Pro Shop', club_id: 'c1' }, isLoading: false }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: 'owner', canViewInsights: true, canManage: true }, isLoading: false, isFetched: true }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => ({ data: [], isFetched: true, isPlaceholderData: false, isError: false }) }));
vi.mock('@/stores/usePostStudioStore', () => ({ usePostStudioStore: { getState: () => ({ openPostStudio: vi.fn() }) } }));

import { InsightsReviewsSection, ordinal, lowestOf } from '@/components/business/insights/InsightsReviewsSection';
import { A, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import BusinessInsightsPageV2 from '@/pages/BusinessInsightsPageV2';

const KEY = 'business.insights.reviewsCard.';
const last = (k: string) => [...tCalls].reverse().find(c => c.key === KEY + k);
const called = (k: string) => tCalls.some(c => c.key === KEY + k);
const sc = (design: number | null, condition: number | null, facilities: number | null, clubhouse: number | null) =>
  ([['design', design], ['condition', condition], ['facilities', facilities], ['clubhouse', clubhouse]] as const).map(([key, avg]) => ({ key, avg, count: avg == null ? 0 : 1 }));
const course = (id: string, reviews: number, avg: number, rank: number | null = null, rank_of: number | null = null) => ({ course_id: id, name: `Course ${id}`, reviews, avg, rank, rank_of, county: 'Kent' });
const base = { linked: true, period_days: 30, total: 12, avg: 8.4, new_count: 3, new_avg: 8.1, unreplied: 2, courses: [course('a', 12, 8.4)], scores: sc(8.6, 8.2, 7.9, 8.8) };

const rgb = (hex: string) => { const h = hex.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`; };
const WHITE = rgb(A.INK);
const nav = vi.fn();

const renderCard = (data: unknown, days = 30, canManage = true, error: unknown = null) => {
  rpc.mockResolvedValue({ data, error });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (d: number) => <QueryClientProvider client={qc}><InsightsReviewsSection businessId="b1" businessName="Sundridge Park" days={d} canManage={canManage} onNavigate={nav} /></QueryClientProvider>;
  const view = render(ui(days));
  return { ...view, qc, rerenderDays: (d: number) => view.rerender(ui(d)) };
};
const card = async (c: HTMLElement) => { await waitFor(() => expect(c.querySelector('[data-card="reviews"]')).not.toBeNull()); return c.querySelector('[data-card="reviews"]') as HTMLElement; };
const settle = () => new Promise(r => setTimeout(r, 20));

beforeEach(() => { rpc.mockReset(); nav.mockReset(); tCalls.length = 0; });

describe('CB89 states', () => {
  it('linked false → no card', async () => {
    const { container } = renderCard({ linked: false });
    await settle();
    expect(rpc).toHaveBeenCalledWith('get_business_review_summary', { p_business_id: 'b1', p_days: 30 });
    expect(container.querySelector('[data-card="reviews"]')).toBeNull();
  });
  it('total 0 → empty title and line only', async () => {
    const c = await card(renderCard({ ...base, total: 0, courses: [], scores: sc(null, null, null, null) }).container);
    expect(c.getAttribute('data-state')).toBe('empty');
    expect(last('emptyTitle')?.o).toMatchObject({ business: 'Sundridge Park' });
    expect(c.querySelector('[data-line="empty"]')).not.toBeNull();
    expect(c.querySelector('[data-total]')).toBeNull();
    expect(c.querySelector('[data-scores], [data-courses], [data-reply]')).toBeNull();
    expect(called('fine')).toBe(false);
  });
});

describe('CB89 title', () => {
  it('avg below and at 9.0 is white', async () => {
    expect(SUB_SCORE_GREEN_MIN).toBe(9);
    const a = renderCard({ ...base, avg: 8.9 });
    expect(((await card(a.container)).querySelector('[data-avg]') as HTMLElement).style.color).toBe(WHITE);
    a.unmount();
    const b = renderCard({ ...base, avg: 9 });
    const el = (await card(b.container)).querySelector('[data-avg]') as HTMLElement;
    expect(el.textContent).toBe('9.0');
    expect(el.style.color).toBe(WHITE);
    expect(last('count')?.o).toMatchObject({ count: 12 });
  });
});

describe('CB89 courses and rank', () => {
  it('ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st', '111th']);
  });
  it('one ranked course → rank lead', async () => {
    const c = await card(renderCard({ ...base, courses: [course('a', 12, 8.4, 3, 41)] }).container);
    expect(c.querySelector('[data-rank="yes"]')).not.toBeNull();
    expect(last('rankLead')?.o).toMatchObject({ rank: '3rd', of: '41', county: 'Kent' });
    expect(c.querySelector('[data-courses]')).toBeNull();
  });
  it('one unranked course → no rank part', async () => {
    const c = await card(renderCard(base).container);
    expect(c.querySelector('[data-rank="no"]')).not.toBeNull();
    expect(called('rankLead')).toBe(false);
  });
  it('two courses → rows in order, rank part only where present, singular review', async () => {
    const c = await card(renderCard({ ...base, courses: [course('a', 11, 9.2, 2, 30), course('b', 1, 7)] }).container);
    expect(called('rankLead')).toBe(false);
    const rows = [...c.querySelectorAll('[data-course]')];
    expect(rows.map(r => r.getAttribute('data-course'))).toEqual(['a', 'b']);
    expect(rows[0].querySelector('[data-course-rank="yes"]')).not.toBeNull();
    expect(rows[1].querySelector('[data-course-rank="no"]')).not.toBeNull();
    expect(tCalls.filter(t => t.key === KEY + 'courseReviews').map(t => t.o?.count)).toEqual([11, 1]);
    expect(last('courseRank')?.o).toMatchObject({ rank: '2nd', of: '30' });
    expect((rows[0].querySelector('[data-course-avg]') as HTMLElement).style.color).toBe(WHITE);
    expect((rows[1].querySelector('[data-course-avg]') as HTMLElement).style.color).toBe(WHITE);
  });
  it('CB89.1 a parenthesised course name prints only the course', async () => {
    const c = await card(renderCard({
      ...base,
      courses: [
        { ...course('a', 11, 9.2, 2, 30), name: 'Sundridge Park Golf Club (East Course)' },
        { ...course('b', 1, 7), name: 'Sundridge Park Golf Club (West Course)' },
      ],
    }).container);
    expect([...c.querySelectorAll('.insights-reviews-course-name')].map(n => n.textContent))
      .toEqual(['East Course', 'West Course']);
  });
  it('CB89.1 a name with no brackets prints unchanged', async () => {
    const c = await card(renderCard({
      ...base,
      courses: [
        { ...course('a', 11, 9.2, 2, 30), name: 'Eltham Warren Golf Club' },
        { ...course('b', 1, 7), name: 'Royal Lytham & St Annes' },
      ],
    }).container);
    expect([...c.querySelectorAll('.insights-reviews-course-name')].map(n => n.textContent))
      .toEqual(['Eltham Warren Golf Club', 'Royal Lytham & St Annes']);
  });
});

describe('CB89 new-reviews line', () => {
  for (const days of [7, 30, 90]) {
    it(`0 / 1 / many for ${days} days`, async () => {
      const a = renderCard({ ...base, new_count: 0, new_avg: null }, days);
      expect((await card(a.container)).querySelector(`[data-new="newNone_${days}"]`)).not.toBeNull(); a.unmount();
      const b = renderCard({ ...base, new_count: 1, new_avg: 9 }, days);
      expect((await card(b.container)).querySelector(`[data-new="newOne_${days}"]`)).not.toBeNull();
      expect(last(`newOne_${days}`)?.o).toMatchObject({ avg: '9.0' }); b.unmount();
      const c = renderCard({ ...base, new_count: 4, new_avg: 8.3 }, days);
      expect((await card(c.container)).querySelector(`[data-new="newMany_${days}"]`)).not.toBeNull();
      expect(last(`newMany_${days}`)?.o).toMatchObject({ n: '4', avg: '8.3' }); c.unmount();
    });
  }
});

describe('CB89 scores', () => {
  it('shown from a single review; only non-null rows; width avg×10; white at every score', async () => {
    const c = await card(renderCard({ ...base, total: 1, courses: [course('a', 1, 9)], scores: sc(9, null, 7.5, null) }).container);
    const rows = [...c.querySelectorAll('[data-score]')];
    expect(rows.map(r => r.getAttribute('data-score'))).toEqual(['design', 'facilities']);
    const bar = (r: Element) => r.querySelector('[data-bar]') as HTMLElement;
    expect(bar(rows[0]).style.width).toBe('90%');
    expect(bar(rows[1]).style.width).toBe('75%');
    expect(bar(rows[0]).style.background).toBe(WHITE);
    expect((rows[0].querySelector('[data-value]') as HTMLElement).style.color).toBe(WHITE);
    expect(bar(rows[1]).style.background).toBe(WHITE);
    expect((rows[1].querySelector('[data-value]') as HTMLElement).style.color).toBe(WHITE);
  });
  it('lowest sentence and highlight', async () => {
    const c = await card(renderCard(base).container);
    expect(c.querySelector('[data-lowest-sentence="facilities"]')).not.toBeNull();
    expect(c.querySelector('[data-score="facilities"] [data-lowest="yes"]')).not.toBeNull();
    expect(c.querySelectorAll('[data-lowest="yes"]').length).toBe(1);
    expect(lowestOf(base.scores)).toMatchObject({ low: { key: 'facilities' }, high: { key: 'clubhouse' }, gap: '0.9' });
  });
  it('no sentence on a tie or with one score', async () => {
    expect(lowestOf(sc(8, 8, 9, null))).toBeNull();
    expect(lowestOf(sc(7, 9, 9, null))).toBeNull();
    expect(lowestOf(sc(7, null, null, null))).toBeNull();
    const c = await card(renderCard({ ...base, scores: sc(8, 8, 9, null) }).container);
    expect(c.querySelector('[data-lowest-sentence]')).toBeNull();
    expect(c.querySelector('[data-lowest="yes"]')).toBeNull();
  });
  it('no scores → no WHAT THEY SCORE', async () => {
    const c = await card(renderCard({ ...base, scores: sc(null, null, null, null) }).container);
    expect(c.querySelector('[data-scores]')).toBeNull();
    expect(called('scoresKicker')).toBe(false);
  });
});

describe('CB89 reply row', () => {
  it('plural / singular unreplied', async () => {
    const a = renderCard({ ...base, unreplied: 2 });
    expect((await card(a.container)).querySelector('[data-reply="unreplied"]')).not.toBeNull();
    expect(last('unreplied')?.o).toMatchObject({ count: 2 }); a.unmount();
    const b = renderCard({ ...base, unreplied: 1 });
    await card(b.container);
    expect(last('unreplied')?.o).toMatchObject({ count: 1 });
  });
  it('replied to every review → See reviews', async () => {
    const c = await card(renderCard({ ...base, unreplied: 0 }).container);
    expect(c.querySelector('[data-reply="all"]')).not.toBeNull();
    expect(called('allReplied')).toBe(true);
    fireEvent.click(c.querySelector('[data-reply-action="see"]')!);
    expect(nav).toHaveBeenCalledWith('/business/b1/reviews');
  });
  it('Reply with canManage → unreplied deep link', async () => {
    const c = await card(renderCard({ ...base, unreplied: 3 }, 30, true).container);
    fireEvent.click(c.querySelector('[data-reply-action="reply"]')!);
    expect(nav).toHaveBeenCalledWith('/business/b1/reviews?filter=unreplied');
  });
  it('unreplied without canManage → See reviews', async () => {
    const c = await card(renderCard({ ...base, unreplied: 3 }, 30, false).container);
    expect(c.querySelector('[data-reply-action="reply"]')).toBeNull();
    fireEvent.click(c.querySelector('[data-reply-action="see"]')!);
    expect(nav).toHaveBeenCalledWith('/business/b1/reviews');
  });
});

describe('CB89 data', () => {
  it('query key includes period; previous data kept during switch', async () => {
    const { container, qc, rerenderDays } = renderCard({ ...base, total: 12 });
    await waitFor(() => expect(container.querySelector('[data-total="12"]')).not.toBeNull());
    let resolve!: (v: unknown) => void;
    rpc.mockReturnValue(new Promise(r => { resolve = r; }));
    rerenderDays(7);
    expect(container.querySelector('[data-total="12"]')).not.toBeNull();
    await act(async () => { resolve({ data: { ...base, total: 13 }, error: null }); });
    await waitFor(() => expect(container.querySelector('[data-total="13"]')).not.toBeNull());
    expect(qc.getQueryData(['business-review-summary', 'b1', 30])).toBeTruthy();
    expect(qc.getQueryData(['business-review-summary', 'b1', 7])).toBeTruthy();
  });
  it('failed read → no card', async () => {
    const { container } = renderCard(null, 30, true, { code: '42501', message: 'denied' });
    await settle();
    expect(container.querySelector('[data-card="reviews"]')).toBeNull();
  });
});

describe('CB89 page', () => {
  it('Reviews & reputation gone; sections 1–6 and REVIEWS render, reviews last', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({
      data: name === 'get_business_review_summary' ? base
        : name === 'get_business_engagement' ? { period_days: 30, reached: 21, engaged: 6, engaged_prev: 6, likes: 9, comments: 0, has_posts: true } : {},
      error: null,
    }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container, queryByText } = render(
      <QueryClientProvider client={qc}><MemoryRouter initialEntries={['/business/b1/insights']}>
        <Routes><Route path="/business/:id/insights" element={<BusinessInsightsPageV2 />} /></Routes>
      </MemoryRouter></QueryClientProvider>,
    );
    await waitFor(() => expect(container.querySelector('[data-card="reviews"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="engagement"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="posts"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-section="insights-funnel"]')).not.toBeNull());
    await waitFor(() => expect(container.querySelector('[data-card="visits"]')).not.toBeNull());
    expect(queryByText('Reviews & reputation')).toBeNull();
    expect(queryByText('Manage reviews')).toBeNull();
    const eng = container.querySelector('[data-card="engagement"]')!;
    expect(eng.compareDocumentPosition(container.querySelector('[data-card="reviews"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
