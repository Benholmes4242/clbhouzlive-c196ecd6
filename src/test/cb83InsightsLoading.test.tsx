import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ insights: {} as any, funnel: {} as any, posts: {} as any }));
vi.mock('@/hooks/useBusinessInsights', () => ({ useBusinessInsights: () => state.insights }));
vi.mock('@/hooks/useBusinessInsightsFunnel', () => ({ useBusinessInsightsFunnel: () => state.funnel }));
vi.mock('@/hooks/useBusinessPostDays', () => ({ useBusinessPostDays: () => state.posts }));
import { InsightsVisitsSection } from '@/components/business/insights/InsightsVisitsSection';
beforeEach(() => {
  state.insights = { data: { visits_series: [{ day: '2026-10-25', total: 2, unique: 1 }], sources: [{ source: 'search', count: 2 }] }, days: 30, isFetched: true, isPlaceholderData: false, error: null };
  state.funnel = { data: { opened: { visits: 2, value: 1 } }, isFetched: true, isPlaceholderData: false, isError: false };
  state.posts = { data: ['2026-10-25T12:00:00Z'], isFetched: true, isPlaceholderData: false, isError: false };
});
afterEach(cleanup);
describe('CB83 complete snapshots', () => {
  it.each(['insights', 'funnel', 'posts'] as const)('waits for the %s read before drawing both cards', async read => {
    state[read] = { ...state[read], isFetched: false };
    const view = render(<InsightsVisitsSection businessId="b1" range="30d" />);
    expect(view.container.querySelector('[data-card]')).toBeNull();
    state[read] = { ...state[read], isFetched: true }; view.rerender(<InsightsVisitsSection businessId="b1" range="30d" />);
    await waitFor(() => expect(view.container.querySelectorAll('[data-card]')).toHaveLength(2));
  });
  it('period switch keeps the whole previous snapshot until all three reads settle', async () => {
    const view = render(<InsightsVisitsSection businessId="b1" range="30d" />);
    await waitFor(() => expect(view.container.querySelector('[data-visit-total]')?.getAttribute('data-visit-total')).toBe('2'));
    state.insights = { ...state.insights, days: 7, data: { ...state.insights.data, sources: [{ source: 'feed', count: 9 }] } };
    state.funnel = { ...state.funnel, data: { opened: { visits: 9, value: 5 } } }; state.posts = { ...state.posts, isPlaceholderData: true };
    view.rerender(<InsightsVisitsSection businessId="b1" range="7d" />);
    expect(view.container.querySelector('[data-visit-total]')?.getAttribute('data-visit-total')).toBe('2'); expect(view.container.querySelector('[data-source="search"]')).not.toBeNull();
    state.posts = { ...state.posts, isPlaceholderData: false, data: [] }; view.rerender(<InsightsVisitsSection businessId="b1" range="7d" />);
    await waitFor(() => expect(view.container.querySelector('[data-visit-total]')?.getAttribute('data-visit-total')).toBe('9')); expect(view.container.querySelector('[data-source="feed"]')).not.toBeNull();
  });
  it('post-day failure draws without markers or posted clause', async () => {
    state.posts = { ...state.posts, isError: true, data: undefined };
    const view = render(<InsightsVisitsSection businessId="b1" range="30d" />);
    await waitFor(() => expect(view.container.querySelector('[data-card="visits"]')).not.toBeNull());
    expect(view.container.querySelector('[data-posts]')).toBeNull(); expect(view.container.querySelector('[data-post-relation]')?.getAttribute('data-post-relation')).toBe('none');
  });
  it('failed funnel does not fabricate visit totals', () => {
    state.funnel = { ...state.funnel, isError: true, data: undefined };
    expect(render(<InsightsVisitsSection businessId="b1" range="30d" />).container.querySelector('[data-card]')).toBeNull();
  });
});