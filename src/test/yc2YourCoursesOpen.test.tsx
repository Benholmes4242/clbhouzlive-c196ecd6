/** YC2 rule tests and blended YC1→YC2→analytics navigation. Real English
 * provider; no translation mocks, no paint/copy/snapshot assertions. */
import { render, screen, fireEvent, cleanup, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import en from '../../public/locales/en/courses.json';
import YourCourseAnalyticsSheet from '@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet';
import { useMyRoundsByCourse, type CourseRoundPoint } from '@/hooks/gam/useMyRoundsByCourse';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import { fmtSigned, fmtBucketPct, ordinal, roundDate, openCourseHistory } from '@/features/profile-sheet-v2/components/yourCoursesOpenRules';

const state = vi.hoisted(() => ({ courses: [] as UserAnalyticsCourse[], rows: [] as Array<{
  course_id: string; play_date: string; gross_score: number; course_par: number;
}>, limit: vi.fn(), queryFn: undefined as undefined | (() => Promise<Map<string, CourseRoundPoint[]>>) }));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: state.courses, isLoading: false, isFetched: true }) }));
vi.mock('@/hooks/gam/useCourseSearch', () => ({ useCourseSearch: () => ({ data: [], isFetching: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'yc2-user' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const chain = { select: () => chain, eq: () => chain, not: () => chain, order: () => chain,
    limit: (n: number) => { state.limit(n); return Promise.resolve({ data: state.rows, error: null }); } };
  return chain;
} } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn(), trackOnHide: vi.fn() } }));
vi.mock('@/components/ui/BottomSheet', () => ({ BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null }));
const i18n = i18next.createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { courses: en } } });
function points(values: number[]): CourseRoundPoint[] {
  return values.map((toPar, i) => ({ toPar, date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10) }));
}
function course(over: Partial<UserAnalyticsCourse> = {}): UserAnalyticsCourse {
  return { course_id: 'c1', course_name: 'Sundridge Park Golf Club (East Course)', rounds_count: 112,
    last_played: '2026-10-29', avg_to_par: 8.3, hardest_hole_no: 7, hardest_hole_avg: 0.9,
    eagles_plus_pct: 0, eagles_plus_pct_exact: 0.055, eagles_plus_count: 1,
    birdies_pct: 7, birdies_pct_exact: 7.1, birdies_count: 127,
    pars_pct: 51, pars_pct_exact: 51, pars_count: 918,
    bogeys_plus_pct: 42, bogeys_plus_pct_exact: 41.845, bogeys_plus_count: 754, ...over };
}
function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{children}</I18nextProvider></QueryClientProvider>;
}
beforeEach(() => { state.courses = [course()]; state.rows = []; state.limit.mockReset(); });
afterEach(cleanup);

describe('YC2 trend rules', () => {
  it('better uses the last ten and all returned rounds', () => {
    const h = openCourseHistory(points([...Array(5).fill(10), ...Array(10).fill(7)]));
    expect(h.trend).toBe('better'); expect(h.last10).toBe(7); expect(h.average).toBe(8); expect(h.difference).toBe(1);
  });
  it('worse uses the same mean comparison', () => {
    const h = openCourseHistory(points([...Array(5).fill(4), ...Array(10).fill(7)]));
    expect(h.trend).toBe('worse'); expect(h.difference).toBe(-1);
  });
  it('in line within 0.3', () => { expect(openCourseHistory(points([...Array(5).fill(7.6), ...Array(10).fill(7)])).trend).toBe('inline'); });
  it.each([0, 1, 3, 10, 14])('omits trend at %i rounds', n => { expect(openCourseHistory(points(Array(n).fill(7))).trend).toBeNull(); });
  it('starts the trend at 15 rounds', () => { expect(openCourseHistory(points(Array(15).fill(7))).trend).toBe('inline'); });
  it('n is returned 18-hole history length, not the card count 112', () => {
    const h = openCourseHistory(points(Array(27).fill(7))); expect(h.count).toBe(27); expect(h.count).not.toBe(course().rounds_count);
  });
  it('includes old rounds beyond the former 20-round cap in the average and best', () => {
    const h = openCourseHistory(points([0, ...Array(24).fill(10)]));
    expect(h.count).toBe(25); expect(h.average).toBe(9.6); expect(h.best?.toPar).toBe(0); expect(h.last10).toBe(10);
  });
  it.each([[7.9, 'better'], [6.1, 'worse']] as const)('honours exact 0.3 boundary from %f', (old, expected) => {
    expect(openCourseHistory(points([...Array(5).fill(old), ...Array(10).fill(7)])).trend).toBe(expected);
  });
});
describe('YC2 chart decisions and geometry', () => {
  it.each([0, 1, 2])('omits chart at %i rounds', n => { expect(openCourseHistory(points(Array(n).fill(7))).plot).toHaveLength(0); });
  it('shows the chart from 3 rounds', () => { expect(openCourseHistory(points([2, 3, 4])).plot).toHaveLength(3); });
  it('caps at 15 latest rounds, oldest on the left without mutating input', () => {
    const input = points(Array.from({ length: 25 }, (_, i) => i)).reverse();
    const h = openCourseHistory(input); expect(h.plot).toHaveLength(15);
    expect(h.plot.map(p => p.toPar)).toEqual(Array.from({ length: 15 }, (_, i) => i + 10));
    expect(h.plot[0].x).toBeLessThan(h.plot[14].x); expect(input[0].toPar).toBe(24);
  });
  it('better rounds plot higher', () => { const h = openCourseHistory(points([2, 8, 5])); expect(h.plot[0].y).toBeLessThan(h.plot[1].y); });
  it('average guide uses all rounds not only shown 15', () => {
    const h = openCourseHistory(points([...Array(5).fill(10), ...Array(15).fill(6)]));
    expect(h.average).toBe(7); expect(h.averageY).not.toBeNull();
  });
  it('best shown point excludes an older all-time best', () => {
    const h = openCourseHistory(points([0, ...Array(14).fill(8), 2])); expect(h.best?.toPar).toBe(0); expect(h.bestShown?.toPar).toBe(2);
  });
  it('ties choose first shown best', () => { const h = openCourseHistory(points([2, 8, 2])); expect(h.bestShown?.x).toBe(h.plot[0].x); });
  it('pads a flat range and keeps finite coordinates', () => { const h = openCourseHistory(points([4, 4, 4])); expect(h.plot.every(p => Number.isFinite(p.y) && p.y > 0 && p.y < 120)).toBe(true); });
  it('caption count is the displayed window', () => { const h = openCourseHistory(points(Array(27).fill(4))); expect(h.shown.length).toBe(15); expect(h.count).toBe(27); });
});
describe('YC2 exact-percent preservation', () => {
  it.each([[0, 0.055, 1, '0.1%'], [0, 0.01, 1, '0.1%'], [0, 0.4, 7, '0.4%'], [0, 0, 0, '0%'], [1, 0.7, 12, '1%'], [7, 7.1, 127, '7%'], [51, 51, 918, '51%'], [42, 41.845, 754, '42%']])(
    'keeps %s / %s / %s as %s', (pct, exact, count, expected) => { expect(fmtBucketPct(Number(pct), Number(exact), Number(count))).toBe(expected); });
});
describe('YC2 facts', () => {
  it('best includes its exact date beyond the plot window', () => {
    const h = openCourseHistory([{ date: '2025-03-14', toPar: 2 }, ...points(Array(20).fill(8))]);
    expect(h.best).toEqual({ date: '2025-03-14', toPar: 2 }); expect(roundDate(h.best?.date ?? '')).toBe('14 Mar 2025'); expect(fmtSigned(h.best?.toPar ?? 0, 0)).toBe('+2');
  });
  it.each([[1, '1st'], [2, '2nd'], [3, '3rd'], [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st']])('ordinal %i is %s', (n, expected) => { expect(ordinal(Number(n))).toBe(expected); });
  it('one-decimal signed figures suppress negative zero', () => { expect(fmtSigned(0.9, 1)).toBe('+0.9'); expect(fmtSigned(-0.04, 1)).toBe('0.0'); });
  it('empty history has no invented best', () => { expect(openCourseHistory([]).best).toBeNull(); });
});
describe('YC2 existing batched read and blended sheet flow', () => {
  it('retains more than 20 per course, oldest first, and ROW_CAP remains 2000', async () => {
    state.rows = points(Array.from({ length: 27 }, (_, i) => i)).reverse().map(p => ({ course_id: 'c1', play_date: p.date, gross_score: 72 + p.toPar, course_par: 72 }));
    const { result } = renderHook(() => useMyRoundsByCourse({ enabled: true }), { wrapper: provider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(state.limit).toHaveBeenCalledWith(2000); expect(result.current.data?.get('c1')).toHaveLength(27);
    expect(result.current.data?.get('c1')?.[0].toPar).toBe(0); expect(result.current.data?.get('c1')?.[26].toPar).toBe(26);
  });
  it.each([{ hardest_hole_no: null }, { hardest_hole_avg: null }])('does not invent a costliest hole for %j', async over => {
    state.courses = [course(over)]; const { container } = render(<YourCourseAnalyticsSheet open synced onClose={() => {}} onNavigate={() => {}} />, { wrapper: provider() });
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() => expect(state.limit).toHaveBeenCalledWith(2000)); expect(container.querySelectorAll('.yc2-facts > div')).toHaveLength(0);
  });
  it('opens the YC1 card, uses returned history, keeps its bar and navigates to the same analytics tab', async () => {
    state.rows = points([...Array(5).fill(10), ...Array(10).fill(7)]).reverse().map(p => ({ course_id: 'c1', play_date: p.date, gross_score: 72 + p.toPar, course_par: 72 }));
    const navigate = vi.fn(); const close = vi.fn();
    const { container } = render(<YourCourseAnalyticsSheet open synced onClose={close} onNavigate={navigate} />, { wrapper: provider() });
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() => expect(container.querySelector('.yc2-line')).not.toBeNull());
    expect(screen.getByRole('button', { expanded: true })).toBeTruthy();
    expect(container.querySelectorAll('.yc1-list-bar')).toHaveLength(1);
    expect(container.querySelectorAll('.yc2-mix > div')).toHaveLength(4);
    expect(container.querySelectorAll('.yc2-facts > div')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Open course analytics' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/courses/c1?tab=holes')); expect(close).toHaveBeenCalledOnce();
  });
});