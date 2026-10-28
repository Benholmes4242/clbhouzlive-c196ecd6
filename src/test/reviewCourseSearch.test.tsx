import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

type Op = [string, ...unknown[]];
const h = vi.hoisted(() => ({
  min: 3,
  courses: [] as Array<Record<string, unknown>>,
  aggs: [] as Array<{ course_id: string; avg_overall_score: number | null; review_count: number }>,
  ratings: [] as Array<{ course_id: string; created_at: string; user_id: string; rating: number }>,
  mems: [] as Array<{ course_id: string; rank: number; top100_lists: { slug: string; is_active: boolean } }>,
  track: vi.fn(),
  request: vi.fn(),
  calls: [] as Array<{ table: string; ops: Op[] }>,
}));

vi.mock('@/integrations/supabase/client', () => {
  const run = (table: string, ops: Op[]) => {
    h.calls.push({ table, ops });
    const has = (n: string) => ops.find(o => o[0] === n);
    const inIds = (has('in')?.[2] as string[] | undefined);
    if (table === 'feed_config') return [{ key: 't100_subscore_min_ratings', value: h.min }];
    if (table === 'golf_courses') {
      const like = has('ilike')?.[2] as string | undefined;
      if (like) { const n = like.replace(/%/g, '').toLowerCase(); return h.courses.filter(c => String(c.name).toLowerCase().includes(n)).slice(0, Number(has('limit')?.[1] ?? 999)); }
      return h.courses.filter(c => inIds?.includes(String(c.id)));
    }
    if (table === 'course_rating_aggregates') {
      const eq = has('eq');
      return h.aggs.filter(a => (!inIds || inIds.includes(a.course_id)) && (!eq || a.review_count === eq[2]));
    }
    if (table === 'course_top100_memberships') return h.mems.filter(m => inIds?.includes(m.course_id));
    if (table === 'course_ratings') {
      const user = ops.find(o => o[0] === 'eq' && o[1] === 'user_id');
      if (user) return h.ratings.filter(r => r.user_id === user[2]);
      const since = has('gte')?.[2] as string | undefined;
      return since ? h.ratings.filter(r => r.created_at >= since) : h.ratings;
    }
    return [];
  };
  const from = (table: string) => {
    const ops: Op[] = [];
    const b: Record<string, unknown> = {};
    for (const n of ['select', 'eq', 'in', 'ilike', 'gte', 'order', 'limit']) b[n] = (...a: unknown[]) => { ops.push([n, ...a]); return b; };
    b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve({ data: run(table, ops), error: null }).then(res, rej);
    return b;
  };
  return { supabase: { from } };
});
vi.mock('@/features/post-v2/components/BottomSheet', () => ({ default: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div data-testid="bottom-sheet">{children}</div> : null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/components/courses/requestCourseSheetStore', () => ({ openRequestCourseSheet: h.request }));

import ReviewCourseSearchSheet from '@/features/composer-flow/ReviewCourseSearchSheet';
import { RECENT_COURSE_VIEWS_KEY, readRecentCourseViews, recordRecentCourseView } from '@/lib/recentCourseViews';
import { buildIdleLists, firstRankLabel, highlightParts, rightState, thresholdExplainer } from '@/features/composer-flow/reviewCourseSearchRules';

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
const course = (id: string, name: string, extra: Record<string, unknown> = {}) => ({ id, name, region: `${name} Region`, sub_country: null, country: 'Scotland', thumbnail_image: null, ...extra });
const rate = (course_id: string, daysAgo: number, user_id = 'other', rating = 8) => ({ course_id, created_at: iso(daysAgo), user_id, rating });

let onPick: ReturnType<typeof vi.fn>;
const mount = () => {
  onPick = vi.fn();
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ReviewCourseSearchSheet open userId="me" onClose={vi.fn()} onPick={onPick} /></QueryClientProvider>);
};
const list = (name: string) => document.querySelector(`[data-list="${name}"]`) as HTMLElement | null;
const ids = (el: HTMLElement | null) => el ? [...el.querySelectorAll('[data-course]')].map(b => b.getAttribute('data-course')) : [];

beforeEach(() => {
  h.min = 3; h.track.mockReset(); h.request.mockReset(); h.calls = [];
  h.courses = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'r1', 'r2', 'r3'].map(id => course(id, `Course ${id.toUpperCase()}`));
  h.aggs = []; h.ratings = []; h.mems = [];
  localStorage.clear();
});
afterEach(() => cleanup());

describe('recentCourseViews', () => {
  it('writes newest first, de-duplicates and caps at 10', () => {
    for (let i = 0; i < 12; i++) recordRecentCourseView(`c${i}`, i);
    recordRecentCourseView('c5', 99);
    const v = readRecentCourseViews();
    expect(v.length).toBe(10);
    expect(v[0]).toEqual({ courseId: 'c5', at: 99 });
    expect(v.filter(x => x.courseId === 'c5').length).toBe(1);
    expect(v.map(x => x.courseId)).not.toContain('c0');
  });
  it('a throwing localStorage reads empty and writes nothing without throwing', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(readRecentCourseViews()).toEqual([]);
    expect(() => recordRecentCourseView('x')).not.toThrow();
    get.mockRestore(); set.mockRestore();
  });
  it('corrupt storage reads empty', () => { localStorage.setItem(RECENT_COURSE_VIEWS_KEY, '{bad'); expect(readRecentCourseViews()).toEqual([]); });
  it('CourseDetailPage is the writer', () => {
    expect(readFileSync('src/pages/CourseDetailPage.tsx', 'utf8')).toContain('recordRecentCourseView(courseId)');
  });
});

describe('list rules', () => {
  it('2/2/3 caps, once across lists, reviewed kept in recent but excluded elsewhere', () => {
    const l = buildIdleLists({ recent: ['a', 'b', 'c'], threshold: ['a', 'm', 'd', 'e', 'f'], popular: ['b', 'd', 'm', 'g', 'h', 'i', 'j'], reviewed: new Set(['a', 'm']) });
    expect(l.recent).toEqual(['a', 'b']);
    expect(l.threshold).toEqual(['d', 'e']);
    expect(l.popular).toEqual(['g', 'h', 'i']);
  });
  it('explainer and Be the ordinal follow the threshold', () => {
    expect(thresholdExplainer(3)).toBe('Two members have reviewed each of these. A third review shows their design, condition, clubhouse and facilities scores.');
    expect(thresholdExplainer(4)).toMatch(/^Three members .* A fourth review/);
    expect(rightState({ mine: null, avg: 8, count: 3 }, 'threshold', 4)).toEqual({ kind: 'bethe', label: 'Be the fourth', count: '3 reviews' });
  });
  it('right column states', () => {
    expect(rightState({ mine: 8.14, avg: 9, count: 4 }, 'search', 3)).toEqual({ kind: 'mine', score: '8.1' });
    expect(rightState({ mine: null, avg: 8.94, count: 41 }, 'popular', 3)).toEqual({ kind: 'scored', score: '8.9', count: '41 reviews' });
    expect(rightState({ mine: null, avg: 7, count: 1 }, 'recent', 3)).toEqual({ kind: 'scored', score: '7.0', count: '1 review' });
    expect(rightState({ mine: null, avg: null, count: 0 }, 'search', 3)).toEqual({ kind: 'first' });
  });
  it('rank chip is the first courseRankLabels label, global first, active lists only', () => {
    expect(firstRankLabel([{ slug: 'gb-i', rank: 9 }, { slug: 'global', rank: 40 }])).toBe('#40 World');
    expect(firstRankLabel([{ slug: 'gb-i', rank: 9 }])).toBe('#9 GB&I');
    expect(firstRankLabel([{ slug: 'global', rank: 3, active: false }])).toBeNull();
    expect(firstRankLabel([{ slug: 'global', rank: 140 }])).toBeNull();
  });
  it('highlight is case-insensitive wherever the match falls', () => {
    expect(highlightParts('Gleneagles (King’s)', 'kin')).toEqual([{ text: 'Gleneagles (', match: false }, { text: 'Kin', match: true }, { text: 'g’s)', match: false }]);
  });
});

describe('ReviewCourseSearchSheet', () => {
  const seed = () => {
    recordRecentCourseView('r2', 1); recordRecentCourseView('r1', 2); recordRecentCourseView('r3', 3); // newest r3
    h.ratings = [
      rate('r3', 40, 'me', 8.14),
      rate('a', 1), rate('a', 2), rate('b', 3), rate('b', 4), rate('c', 5), rate('c', 6), rate('d', 50, 'me'),
      rate('e', 7), rate('e', 8), rate('e', 9), rate('f', 10), rate('f', 11), rate('f', 12), rate('g', 13), rate('g', 14), rate('g', 15), rate('g', 16),
    ];
    h.aggs = [
      { course_id: 'a', avg_overall_score: 7.5, review_count: 2 }, { course_id: 'b', avg_overall_score: 7, review_count: 2 }, { course_id: 'c', avg_overall_score: 7, review_count: 2 },
      { course_id: 'd', avg_overall_score: 8, review_count: 2 }, { course_id: 'e', avg_overall_score: 8.94, review_count: 3 }, { course_id: 'f', avg_overall_score: 8, review_count: 3 },
      { course_id: 'g', avg_overall_score: 9.2, review_count: 4 }, { course_id: 'r3', avg_overall_score: 8, review_count: 1 },
    ];
    h.mems = [{ course_id: 'g', rank: 3, top100_lists: { slug: 'gb-i', is_active: true } }];
  };

  it('does not autofocus the field and tracks one open', async () => {
    mount();
    const input = screen.getByRole('searchbox');
    expect(input).not.toHaveAttribute('autofocus');
    expect(document.activeElement).not.toBe(input);
    expect(h.track.mock.calls.filter(c => c[0] === 'review_search_opened').length).toBe(1);
  });

  it('renders the three lists with their rules', async () => {
    seed(); mount();
    await waitFor(() => expect(list('popular')).not.toBeNull());
    expect(ids(list('recent'))).toEqual(['r3', 'r1']);
    expect(list('recent')!.querySelector('[data-state="mine"]')?.textContent).toBe('8.1YOURS · EDIT');
    expect(ids(list('threshold'))).toEqual(['a', 'b']);
    expect(list('threshold')!.querySelector('[data-state="bethe"]')?.textContent).toBe('Be the third2 reviews');
    expect(ids(list('popular'))).toEqual(['g', 'e', 'f']);
    expect(within(list('popular')!).getAllByTestId('rcs-rank')[0].textContent).toBe('#3 GB&I');
    expect(list('popular')!.querySelector('[data-course="e"] [data-state="scored"]')?.textContent).toBe('8.93 reviews');
  });

  it('threshold list follows t100_subscore_min_ratings', async () => {
    seed(); h.min = 4; mount();
    await waitFor(() => expect(ids(list('threshold'))).toEqual(['e', 'f']));
    expect(list('threshold')!.textContent).toContain('A fourth review');
    expect(list('threshold')!.querySelector('[data-state="bethe"]')?.textContent).toBe('Be the fourth3 reviews');
  });

  it('empty lists do not render, heading included', async () => {
    mount();
    await waitFor(() => expect(h.calls.some(c => c.table === 'course_rating_aggregates' || c.table === 'golf_courses')).toBe(true));
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    expect(list('recent')).toBeNull(); expect(list('threshold')).toBeNull(); expect(list('popular')).toBeNull();
    expect(screen.queryByText('Looked at recently')).toBeNull();
  });

  it('search starts at two characters, highlights, counts and offers the ask-us row', async () => {
    h.courses = [course('k1', 'Kingsbarns Golf Links'), course('k2', 'Gleneagles (King’s)', { region: 'Perth & Kinross' }), course('k3', 'Old Course')];
    h.ratings = [rate('k1', 3, 'me', 8.1)];
    mount();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'K' } });
    await act(async () => { await new Promise(r => setTimeout(r, 260)); });
    expect(h.calls.some(c => c.table === 'golf_courses' && c.ops.some(o => o[0] === 'ilike'))).toBe(false);
    fireEvent.change(input, { target: { value: 'Kin' } });
    await waitFor(() => expect(screen.getByTestId('rcs-count').textContent).toBe('2 courses'));
    const ilike = h.calls.find(c => c.table === 'golf_courses' && c.ops.some(o => o[0] === 'ilike'))!;
    expect(ilike.ops).toContainEqual(['limit', 30]);
    const names = screen.getAllByTestId('rcs-name');
    expect(names[0].querySelector('.rcs-hit')?.textContent).toBe('Kin');
    expect(names[1].querySelector('.rcs-hit')?.textContent).toBe('Kin');
    expect(list('search')!.querySelector('[data-course="k1"] [data-state="mine"]')).not.toBeNull();
    expect(list('search')!.querySelector('[data-course="k1"] .rcs-place-text')?.textContent).toBe('Kingsbarns Golf Links Region, Scotland');
    fireEvent.click(screen.getByRole('button', { name: 'Not here? Ask us to add it' }));
    await waitFor(() => expect(h.request).toHaveBeenCalledWith('Kin'));
    expect(h.track).toHaveBeenCalledWith('review_course_request_tap', {});
  });

  it('a search with no results shows the ask-us row alone; clearing returns to the lists', async () => {
    seed(); mount();
    await waitFor(() => expect(list('popular')).not.toBeNull());
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Not here? Ask us to add it' })).toBeInTheDocument());
    expect(screen.queryByTestId('rcs-count')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(list('popular')).not.toBeNull();
  });

  it('a pick hands the course id back and tracks the list', async () => {
    seed(); mount();
    await waitFor(() => expect(list('recent')).not.toBeNull());
    fireEvent.click(list('recent')!.querySelector('[data-course="r3"]')!);
    expect(onPick).toHaveBeenCalledWith('r3');
    expect(h.track).toHaveBeenCalledWith('review_search_pick', { list: 'recent', reviewed: true });
  });
});

describe('wiring', () => {
  it('Post or review opens the new sheet; CourseTagSheet loses only the review branch', () => {
    const flow = readFileSync('src/features/composer-flow/ComposerFlowSheet.tsx', 'utf8');
    expect(flow).toContain('<ReviewCourseSearchSheet');
    expect(flow).not.toContain('CourseTagSheet');
    const tag = readFileSync('src/features/post-v2/components/CourseTagSheet.tsx', 'utf8');
    expect(tag).not.toContain('excludeReviewedForUserId');
    expect(tag).toContain('autoFocus');
    expect(tag).toContain(".ilike('name', `%${q.trim()}%`)");
    expect(readFileSync('src/features/post-v2/StageComposer.tsx', 'utf8')).toContain('CourseTagSheet');
  });
  it('analytics labels are registered', () => {
    const labels = readFileSync('src/features/admin/lib/eventLabels.ts', 'utf8');
    for (const k of ['review_search_opened', 'review_search_pick', 'review_course_request_tap']) expect(labels).toContain(`${k}:`);
  });
});
