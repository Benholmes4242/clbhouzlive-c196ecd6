import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const reads = vi.hoisted(() => ({ calls: [] as Array<{ table: string; ops: Array<[string, unknown[]]> }>, rows: { media: [] as unknown[], words: [] as unknown[], any: [] as unknown[] } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const call = { table, ops: [] as Array<[string, unknown[]]> };
      reads.calls.push(call);
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'order', 'limit', 'not', 'neq']) chain[m] = (...args: unknown[]) => { call.ops.push([m, args]); return chain; };
      chain.then = (resolve: (v: unknown) => unknown) => {
        const sel = String(call.ops.find(o => o[0] === 'select')?.[1][0] ?? '');
        const data = table !== 'course_ratings' ? [] : sel.includes('course_review_media!inner') ? reads.rows.media : call.ops.some(o => o[0] === 'neq') ? reads.rows.words : reads.rows.any;
        return Promise.resolve({ data, error: null }).then(resolve);
      };
      return chain;
    },
  },
}));
vi.mock('@/components/courses/ReviewRailSlot', () => ({ ReviewRailSlot: () => <div data-rails /> }));
vi.mock('@/components/courses/browse/sectionShells', () => ({ LatestReviewsShell: () => <div data-shell /> }));
vi.mock('@/components/courses/browse/SectionHead', () => ({ SectionHead: () => <h2 data-head />, SECTION_WRAP: {}, HEAD_GAP: 12 }));

import { useBrowseReviews, mapRow } from '@/components/courses/useBrowseReviews';
import { LatestReviewsSection } from '@/components/courses/browse/LatestReviewsSection';

const row = (id: string, at: string, review: string | null, media: unknown[] = []) => ({
  id, course_id: 'c', user_id: 'u', rating: 8, review, created_at: at,
  user_profiles: { id: 'u', display_name: 'Member' }, course: { id: 'c', name: 'Course' }, course_review_media: media,
});
const photo = { id: 'm', media_type: 'image', media_url: 'https://x/p.jpg', is_cover: true, created_at: '2026-01-01' };
afterEach(() => { cleanup(); reads.calls.length = 0; });
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

describe('Latest reviews two reads', () => {
  it('(a) 80 newer score-only ratings never crowd out older media and text reviews', async () => {
    reads.rows.any = Array.from({ length: 80 }, (_, i) => row(`s${i}`, `2026-11-${String(10 + (i % 9)).padStart(2, '0')}`, null));
    reads.rows.media = [row('media', '2026-01-02', null, [photo])];
    reads.rows.words = [row('words', '2026-01-01', 'Great greens')];
    const { result } = renderHook(() => useBrowseReviews(null, null), { wrapper });
    await waitFor(() => expect(result.current.pool.map(r => r.reviewId)).toEqual(['media', 'words']));
    const v = render(<LatestReviewsSection reviews={result.current.pool} onReviewPress={() => {}} />);
    expect(v.container.querySelector('[data-head]')).not.toBeNull();
    expect(v.container.querySelector('[data-rails]')).not.toBeNull();
  });

  it('(b) media read inner-joins usable media; words read filters non-null, non-empty text', async () => {
    reads.rows.media = []; reads.rows.words = [];
    renderHook(() => useBrowseReviews(null, null), { wrapper });
    await waitFor(() => expect(reads.calls.filter(c => c.table === 'course_ratings')).toHaveLength(2));
    const [m, w] = reads.calls.filter(c => c.table === 'course_ratings');
    const has = (c: typeof m, op: string, args: unknown[]) => c.ops.some(o => o[0] === op && JSON.stringify(o[1]) === JSON.stringify(args));
    expect(String(m.ops.find(o => o[0] === 'select')![1][0])).toContain('course_review_media!inner');
    expect(has(m, 'not', ['course_review_media.media_url', 'is', null])).toBe(true);
    expect(has(m, 'limit', [40])).toBe(true);
    expect(String(w.ops.find(o => o[0] === 'select')![1][0])).not.toContain('course_review_media!inner');
    expect(has(w, 'not', ['review', 'is', null])).toBe(true);
    expect(has(w, 'neq', ['review', ''])).toBe(true);
    expect(has(w, 'limit', [60])).toBe(true);
  });

  it('(c) a whitespace-only review with no media is dropped', () => {
    expect(mapRow(row('x', '2026-01-01', '   ') as never)).toBeNull();
    expect(mapRow(row('y', '2026-01-01', '  ', [photo]) as never)).not.toBeNull();
  });

  it('(d) no heading when nothing qualifies; the shell while loading', () => {
    const blank = { reviewId: 'b', quote: '', media: [] } as never;
    const v = render(<LatestReviewsSection reviews={[blank]} onReviewPress={() => {}} />);
    expect(v.container.innerHTML).toBe('');
    cleanup();
    const l = render(<LatestReviewsSection reviews={[blank]} loading onReviewPress={() => {}} />);
    expect(l.container.querySelector('[data-shell]')).not.toBeNull();
    expect(l.container.querySelector('[data-head]')).toBeNull();
  });
});
