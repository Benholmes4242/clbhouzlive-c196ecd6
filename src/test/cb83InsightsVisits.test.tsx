import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const client = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), gte: vi.fn(), lte: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: client.from } }));
import { useBusinessPostDays } from '@/hooks/useBusinessPostDays';
import { axisIndices, busiestPeriod, sourceBuckets, sourceName, visitBuckets, type VisitBucket } from '@/components/business/insights/visitBuckets';
import { InsightsVisitsCards, VisitsBars } from '@/components/business/insights/InsightsVisitsSection';
import type { BusinessInsights } from '@/hooks/useBusinessInsights';
import type { BusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';
afterEach(cleanup);
const series = (n: number) => Array.from({ length: n }, (_, i) => ({ day: new Date(Date.UTC(2026, 9, 25 - (n - 1) + i)).toISOString().slice(0, 10), total: i, unique: 1 }));
const b = (day: string, total: number): VisitBucket => ({ day, end: day, total, posts: 0 });
const insights: BusinessInsights = { headline: { profile_views: { value: 999, prev: 0 }, unique_visitors: { value: 999, prev: 0 }, directory_impressions: { value: 0, prev: 0 }, click_outs: { value: 0, prev: 0 }, message_clicks: { value: 0, prev: 0 }, new_followers: { value: 0, prev: 0 }, total_followers: 0 }, visits_series: series(31), followers_series: [], sources: [], content: [] };
const funnel: BusinessInsightsFunnel = { period_days: 30, saw: { value: 20, prev: 0 }, opened: { value: 3, visits: 9, prev: 0 }, followed: { value: 0, total: 0, prev: 0 }, tapped: { value: 0, prev: 0 }, top_post: null };
const cards = (sources = insights.sources, visits = 9) => render(<InsightsVisitsCards insights={{ ...insights, sources }} funnel={{ ...funnel, opened: { ...funnel.opened, visits } }} dates={[]} days={30} />);
describe('CB83 UTC visit buckets', () => {
  it('31 entries for 30 days uses the last 30', () => {
    const result = visitBuckets(series(31), [], 30);
    expect(result).toHaveLength(30); expect(result[0]?.total).toBe(1); expect(result[29]?.day).toBe('2026-10-25');
  });
  it('91 entries form thirteen weekly sums with the last ending today', () => {
    const result = visitBuckets(series(91), [], 90);
    expect(result).toHaveLength(13); expect(result[0]?.total).toBe(21); expect(result[12]?.total).toBe(609); expect(result[12]?.end).toBe('2026-10-25');
  });
  it('7 days uses the last seven', () => expect(visitBuckets(series(8), [], 7).map(x => x.total)).toEqual([1, 2, 3, 4, 5, 6, 7]));
  it('23:30 UTC on 13 Oct marks 13 Oct and two posts count as two', () => {
    const result = visitBuckets([{ day: '2026-10-13', total: 1, unique: 1 }, { day: '2026-10-14', total: 1, unique: 1 }], ['2026-10-13T23:30:00Z', '2026-10-13T01:00:00Z'], 7);
    expect(result.map(x => x.posts)).toEqual([2, 0]);
    const { container } = render(<VisitsBars buckets={result} days={7} />);
    expect(container.querySelector('[data-day="2026-10-13"] [data-posts="2"]')?.textContent).toBe('2');
    expect(container.querySelector('[data-day="2026-10-14"] [data-posts]')).toBeNull();
  });
  it('weekly markers sum every posted day in their bucket', () => expect(visitBuckets(series(91), ['2026-10-24T23:30:00Z', '2026-10-25T12:00:00Z'], 90)[12]?.posts).toBe(2));
  it('zero days stay present as stubs', () => {
    const { container } = render(<VisitsBars buckets={[b('2026-10-24', 0), b('2026-10-25', 1)]} days={7} />);
    expect(container.querySelectorAll('[data-day]')).toHaveLength(2); expect(container.querySelector('[data-zero="true"]')).not.toBeNull();
  });
  it('7 days shows nonzero numbers and every weekday coordinate', () => {
    const { container } = render(<VisitsBars buckets={visitBuckets(series(7), [], 7)} days={7} />);
    expect(container.querySelectorAll('[data-bar-number]')).toHaveLength(6); expect(container.querySelectorAll('[data-axis-day]')).toHaveLength(7);
    expect(container.querySelector('[data-weekdays="true"]')).not.toBeNull();
  });
  it.each([30, 90])('%i days shows four date coordinates without bar numbers', days => {
    const buckets = visitBuckets(series(days === 90 ? 91 : 31), [], days);
    const { container } = render(<VisitsBars buckets={buckets} days={days} />);
    expect(container.querySelectorAll('[data-axis-day]')).toHaveLength(4); expect(container.querySelectorAll('[data-bar-number]')).toHaveLength(0);
    expect(axisIndices(buckets.length, days)[3]).toBe(buckets.length - 1);
  });
});
describe('CB83 busiest period', () => {
  const run = [b('2026-10-23', 5), b('2026-10-24', 5), b('2026-10-25', 1)];
  it('ties choose the most recent busiest day', () => expect(busiestPeriod(run, [], 30, '2026-10-25')?.day).toBe('2026-10-24'));
  it('same-day post has priority', () => expect(busiestPeriod(run, ['2026-10-24T23:30:00Z', '2026-10-23T12:00:00Z'], 30, '2026-10-25')?.relation).toBe('same'));
  it('previous-day post uses after', () => expect(busiestPeriod(run, ['2026-10-23T23:30:00Z'], 30, '2026-10-25')?.relation).toBe('after'));
  it('no adjacent posts has no clause', () => expect(busiestPeriod(run, [], 30, '2026-10-25')?.relation).toBeNull());
  it('today resolves today', () => expect(busiestPeriod([b('2026-10-25', 1)], [], 7, '2026-10-25')?.dateKind).toBe('today'));
  it('yesterday resolves yesterday', () => expect(busiestPeriod(run, [], 7, '2026-10-25')?.dateKind).toBe('yesterday'));
  it('older days resolve dates', () => expect(busiestPeriod([b('2026-10-20', 1)], [], 30, '2026-10-25')?.dateKind).toBe('date'));
  it('90 days uses week start and no posted clause', () => {
    const best = busiestPeriod([{ ...b('2026-10-19', 9), end: '2026-10-25' }], ['2026-10-19T12:00:00Z'], 90, '2026-10-25');
    expect(best?.day).toBe('2026-10-19'); expect(best?.dateKind).toBe('date'); expect(best?.relation).toBeNull();
  });
  it('all zeros uses empty state', () => expect(busiestPeriod([b('2026-10-25', 0)], [], 7)).toBeNull());
});
describe('CB83 sources and funnel authority', () => {
  it.each([['search', 'search'], ['feed', 'feed'], ['content', 'content'], ['course_page', 'course'], ['directory', 'directory'], ['share', 'shared'], ['shared', 'shared'], ['direct', 'other'], [null, 'other'], ['unexpected', 'other']])('maps %s to %s', (source, name) => expect(sourceName(source)).toBe(name));
  it('share/shared merge and unknown/direct/null merge', () => expect(sourceBuckets([{ source: 'share', count: 2 }, { source: 'shared', count: 3 }, { source: null, count: 1 }, { source: 'direct', count: 2 }, { source: 'unknown', count: 4 }])).toEqual([{ name: 'shared', count: 5 }, { name: 'other', count: 7 }]));
  it('other stays last even when largest; zero sources are absent', () => expect(sourceBuckets([{ source: 'direct', count: 100 }, { source: 'search', count: 2 }, { source: 'feed', count: 0 }, { source: 'content', count: 3 }])).toEqual([{ name: 'content', count: 3 }, { name: 'search', count: 2 }, { name: 'other', count: 100 }]));
  it('fine print belongs only to other', () => {
    const view = cards([{ source: 'search', count: 2 }]); expect(view.container.querySelector('[data-source-fine]')).toBeNull(); view.unmount();
    expect(cards([{ source: 'direct', count: 3 }]).container.querySelector('[data-source-fine]')).not.toBeNull();
  });
  it('no sources card when the funnel has no visits', () => expect(cards([{ source: 'search', count: 3 }], 0).container.querySelector('[data-card="sources"]')).toBeNull());
  it('kicker uses funnel visits and golfers, never legacy headline counts', () => {
    const { container } = cards(); expect(container.querySelector('[data-visit-total]')?.getAttribute('data-visit-total')).toBe('9'); expect(container.querySelector('[data-golfer-total]')?.getAttribute('data-golfer-total')).toBe('3');
  });
});
describe('CB83 post-day query', () => {
  it('selects only created_at for published business posts with the requested key', async () => {
    client.from.mockReturnValue(client); client.select.mockReturnValue(client); client.eq.mockReturnValue(client); client.gte.mockReturnValue(client);
    client.lte.mockResolvedValue({ data: [{ created_at: '2026-10-13T23:30:00Z' }], error: null });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useBusinessPostDays('b1', 30), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.from).toHaveBeenCalledWith('posts'); expect(client.select).toHaveBeenCalledWith('created_at');
    expect(client.eq).toHaveBeenCalledWith('actor_type', 'business'); expect(client.eq).toHaveBeenCalledWith('actor_id', 'b1'); expect(client.eq).toHaveBeenCalledWith('status', 'published');
    expect(qc.getQueryData(['business-post-days', 'b1', 30])).toEqual(['2026-10-13T23:30:00Z']);
    expect(String(client.gte.mock.calls.at(-1)?.[1]).endsWith('T00:00:00.000Z')).toBe(true); qc.clear();
  });
  it('failed post-day query remains an error rather than inventing dates', async () => {
    client.lte.mockResolvedValue({ data: null, error: { code: '42501' } });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useBusinessPostDays('b2', 90), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true)); expect(result.current.data).toBeUndefined(); qc.clear();
  });
});