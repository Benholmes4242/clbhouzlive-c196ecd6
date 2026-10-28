import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/composerFlow.json';

const h = vi.hoisted(() => ({ profile: { id: 'member' } as { id: string } | null, requests: [] as any[], fail: '', tables: {} as Record<string, any[]> }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  const filters: any[] = [];
  const sort: any[] = [];
  const result = (start: number, end: number, single = false) => {
    h.requests.push({ table, filters: [...filters], start, end });
    let rows = [...(h.tables[table] ?? [])];
    for (const [op, key, value] of filters) rows = rows.filter(r => op === 'eq' || op === 'is' ? r[key] === value : op === 'not' ? r[key] !== null : op === 'in' ? value.includes(r[key]) : r[key] >= value);
    rows.sort((a, b) => { for (const [key, asc] of sort) { const delta = String(a[key] ?? '').localeCompare(String(b[key] ?? '')); if (delta) return asc ? delta : -delta; } return 0; });
    return Promise.resolve({ data: single ? rows[0] ?? null : rows.slice(start, end + 1), error: h.fail === table ? new Error(`${table} refused`) : null });
  };
  const q: any = {
    select: () => q,
    eq: (k: string, v: any) => { filters.push(['eq', k, v]); return q; },
    is: (k: string, v: any) => { filters.push(['is', k, v]); return q; },
    not: (k: string, _op: string, v: any) => { filters.push(['not', k, v]); return q; },
    in: (k: string, v: any) => { filters.push(['in', k, v]); return q; },
    gte: (k: string, v: any) => { filters.push(['gte', k, v]); return q; },
    order: (k: string, opts?: { ascending?: boolean }) => { sort.push([k, opts?.ascending !== false]); return q; },
    range: (start: number, end: number) => result(start, end),
    maybeSingle: () => result(0, 0, true),
  };
  return q;
} } }));
import { buildReviewSuggestions, loadReviewSuggestions, useReviewSuggestions, type SuggestionRating } from '@/features/composer-flow/hooks/useReviewSuggestions';
const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { composerFlow: en } }, initImmediate: false });
const t = i18n.getFixedT('en', 'composerFlow');
const course = (id: string) => ({ id, name: `Course ${id}`, thumbnail_image: `${id}.jpg` });
const rating = (course_id: string, user_id = 'follow', created_at = '2026-10-25T00:00:00Z'): SuggestionRating => ({ course_id, user_id, created_at });
const base = () => ({ courses: ['club', 'post', 'followed', 'popular', 'other'].map(course), club: [] as ReturnType<typeof course>[], posts: [] as { course_id: string; created_at: string }[], followed: [] as SuggestionRating[], profiles: [{ id: 'follow', display_name: 'Thomas Smith', username: null }, { id: 'new', display_name: 'Ben Jones', username: null }], reviewed: [] as string[], popular: [] as SuggestionRating[] });
beforeEach(() => { cleanup(); h.profile = { id: 'member' }; h.fail = ''; h.requests = []; h.tables = { user_profiles: [{ id: 'member', primary_club_id: null }], golf_courses: [], course_ratings: [], posts: [], user_follows: [] }; });
afterEach(cleanup);

describe('suggestion priority and reasons', () => {
  it('club precedes own post and caps at two before followed courses', () => {
    const s = base(); s.club = [course('club')]; s.posts = [{ course_id: 'post', created_at: '2026-09-14T12:00:00Z' }]; s.followed = [rating('followed')];
    expect(buildReviewSuggestions(s, t).map(r => [r.courseId, r.reasonKind])).toEqual([['club', 'club'], ['post', 'posted']]);
  });
  it('deduplicates a course across sources before filling slot two', () => {
    const s = base(); s.club = [course('club')]; s.posts = [{ course_id: 'club', created_at: '2026-10-26T00:00:00Z' }]; s.followed = [rating('followed')];
    expect(buildReviewSuggestions(s, t).map(r => r.courseId)).toEqual(['club', 'followed']);
  });
  it('excludes every course already reviewed by the member', () => {
    const s = base(); s.club = [course('club')]; s.reviewed = ['club', 'post']; s.posts = [{ course_id: 'post', created_at: '2026-10-26' }]; s.followed = [rating('followed')];
    expect(buildReviewSuggestions(s, t).map(r => r.courseId)).toEqual(['followed']);
  });
  it('only returns courses that resolve to golf_courses rows', () => {
    const s = base(); s.posts = [{ course_id: 'missing', created_at: '2026-10-26' }]; s.followed = [rating('followed')];
    expect(buildReviewSuggestions(s, t).map(r => r.courseId)).toEqual(['followed']);
  });
  it('club reason uses the signed-off club phrase', () => {
    const s = base(); s.club = [course('club')];
    expect(buildReviewSuggestions(s, t)[0].reason).toBe('Your club');
  });
  it('own posts are newest-first and format their actual d MMM date', () => {
    const s = base(); s.posts = [{ course_id: 'other', created_at: '2026-09-13T12:00:00Z' }, { course_id: 'post', created_at: '2026-09-14T12:00:00Z' }];
    expect(buildReviewSuggestions(s, t).map(r => [r.courseId, r.reason])).toEqual([['post', 'You posted from here on 14 Sept'], ['other', 'You posted from here on 13 Sept']]);
  });
  it('one followed reviewer uses the most recent first name', () => {
    const s = base(); s.followed = [rating('followed')];
    expect(buildReviewSuggestions(s, t)[0].reason).toBe('Reviewed by Thomas');
  });
  it('several reviewers count distinct people and name the most recent', () => {
    const s = base(); s.followed = [rating('followed'), rating('followed'), rating('followed', 'new', '2026-10-26T00:00:00Z')];
    expect(buildReviewSuggestions(s, t)[0].reason).toBe('Reviewed by Ben + 1 you follow');
  });
  it('followed courses rank by reviewer count before review recency', () => {
    const s = base(); s.followed = [rating('other', 'follow', '2026-10-27'), rating('followed'), rating('followed', 'new')];
    expect(buildReviewSuggestions(s, t).map(r => r.courseId)).toEqual(['followed', 'other']);
  });
  it('popular never fills an unused second personal slot', () => {
    const s = base(); s.club = [course('club')]; s.popular = [rating('popular')];
    expect(buildReviewSuggestions(s, t).map(r => r.courseId)).toEqual(['club']);
  });
  it('popular fallback ranks counts, excludes reviewed and formats plural reasons', () => {
    const s = base(); s.reviewed = ['club']; s.popular = [rating('club'), rating('club'), rating('club'), rating('popular'), rating('popular'), rating('other')];
    expect(buildReviewSuggestions(s, t).map(r => [r.courseId, r.reason])).toEqual([['popular', '2 reviews this month'], ['other', '1 review this month']]);
  });
  it('returns empty when no source has a drawable eligible course', () => {
    expect(buildReviewSuggestions(base(), t)).toEqual([]);
  });
});
describe('member-scoped source reads', () => {
  it('uses primary_club_id, not home_club_id, and skips popular when club supplies a row', async () => {
    h.tables.user_profiles = [{ id: 'member', primary_club_id: 'canonical', home_club_id: 'wrong' }];
    h.tables.golf_courses = [{ ...course('club'), club_id: 'canonical' }, { ...course('other'), club_id: 'wrong' }];
    const result = await loadReviewSuggestions('member', t, new Date('2026-10-28T00:00:00Z'));
    expect(result.map(r => r.courseId)).toEqual(['club']);
    expect(h.requests.some(r => r.table === 'course_ratings' && r.filters.some((f: any[]) => f[1] === 'is_mock'))).toBe(false);
  });
  it('only reads own composer posts with non-null course and null reference ids', async () => {
    const common = { created_at: '2026-10-27', whs_score_id: null, source_review_id: null };
    h.tables.posts = [
      { ...common, id: '1', user_id: 'member', course_id: 'post' },
      { ...common, id: '2', user_id: 'someone', course_id: 'other' },
      { ...common, id: '3', user_id: 'member', course_id: 'other', whs_score_id: 'score' },
      { ...common, id: '4', user_id: 'member', course_id: 'other', source_review_id: 'review' },
      { ...common, id: '5', user_id: 'member', course_id: null },
    ];
    h.tables.golf_courses = [course('post'), course('other')];
    expect((await loadReviewSuggestions('member', t)).map(r => r.courseId)).toEqual(['post']);
  });
  it('uses outgoing user_follows and the inclusive 90-day created_at boundary', async () => {
    h.tables.user_follows = [{ id: '1', follower_id: 'member', following_id: 'follow' }, { id: '2', follower_id: 'other', following_id: 'member' }];
    h.tables.user_profiles.push({ id: 'follow', display_name: 'Thomas Smith', username: null });
    h.tables.golf_courses = [course('followed'), course('other')];
    h.tables.course_ratings = [{ id: '1', ...rating('followed', 'follow', '2026-07-30T00:00:00Z'), is_mock: false }, { id: '2', ...rating('other', 'follow', '2026-07-29T23:59:59Z'), is_mock: false }];
    const result = await loadReviewSuggestions('member', t, new Date('2026-10-28T00:00:00Z'));
    expect(result.map(r => r.courseId)).toEqual(['followed']);
    expect(h.requests.find(r => r.table === 'user_follows').filters).toContainEqual(['eq', 'follower_id', 'member']);
  });
  it('popular reads only non-mock ratings within 30 days and excludes the member’s rated courses', async () => {
    h.tables.golf_courses = [course('popular'), course('other'), course('club')];
    h.tables.course_ratings = [
      { id: '1', ...rating('popular', 'x', '2026-09-28T00:00:00Z'), is_mock: false },
      { id: '2', ...rating('other', 'x', '2026-09-27T23:59:59Z'), is_mock: false },
      { id: '3', ...rating('other', 'x', '2026-10-27'), is_mock: true },
      { id: '4', ...rating('club', 'member', '2026-01-01'), is_mock: false },
      { id: '5', ...rating('club', 'x', '2026-10-27'), is_mock: false },
    ];
    expect((await loadReviewSuggestions('member', t, new Date('2026-10-28T00:00:00Z'))).map(r => r.courseId)).toEqual(['popular']);
  });
  it('paginates count reads beyond one server page', async () => {
    h.tables.golf_courses = [course('popular')];
    h.tables.course_ratings = Array.from({ length: 501 }, (_, i) => ({ id: String(i).padStart(4, '0'), ...rating('popular', 'x'), is_mock: false }));
    const result = await loadReviewSuggestions('member', t, new Date('2026-10-28T00:00:00Z'));
    expect(result[0].reason).toBe('501 reviews this month');
    expect(h.requests.some(r => r.table === 'course_ratings' && r.start === 500)).toBe(true);
  });
  it('failed exclusions throw rather than offering wrong courses', async () => {
    h.fail = 'course_ratings';
    await expect(loadReviewSuggestions('member', t)).rejects.toThrow('course_ratings refused');
  });
  it('makes no reads while the sheet is closed', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useReviewSuggestions(false), { wrapper });
    expect(hook.result.current.fetchStatus).toBe('idle');
    expect(h.requests).toEqual([]);
    client.clear();
  });
  it('makes no reads for a signed-out viewer', () => {
    h.profile = null;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useReviewSuggestions(true), { wrapper });
    expect(hook.result.current.fetchStatus).toBe('idle');
    expect(h.requests).toEqual([]);
    client.clear();
  });
  it('uses one identity-scoped query when open and signed in', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useReviewSuggestions(true), { wrapper });
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    expect(client.getQueryCache().getAll().map(q => q.queryKey)).toEqual([['composer-review-suggestions', 'member']]);
    expect(h.requests.every(r => !['gam_round_stats', 'whs_scores', 'whs_rounds'].includes(r.table))).toBe(true);
    client.clear();
  });
});