/** Brief 50 — played ticks, one "played" rule, rating reminders. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PlayedEntry } from '@/hooks/played/playedRules';

const f = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  played: [] as PlayedEntry[],
  rpc: vi.fn(),
  toast: vi.fn(),
  toastErr: vi.fn(),
  wantSet: vi.fn(),
  listRows: {} as Record<string, unknown[]>,
  tables: {} as Record<string, unknown[]>,
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ isGuestUser: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign((...a: unknown[]) => f.toast(...a), { error: (...a: unknown[]) => f.toastErr(...a), success: vi.fn() }) }));
vi.mock('@/components/ui/BottomSheet', () => ({ BottomSheet: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div role="dialog">{children}</div> : null }));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: (slug: string) => ({ data: f.listRows[slug] ?? [] }) }));
vi.mock('@/hooks/useCoursePersonalStatus', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useCoursePersonalStatus')>()),
  useCoursePersonalStatus: () => ({ setWantToPlay: f.wantSet }),
}));
function chain(table: string) {
  const res = { data: f.tables[table] ?? [], error: null };
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'is', 'lte', 'gte', 'lt', 'order', 'limit']) c[m] = () => c;
  c.maybeSingle = () => Promise.resolve({ data: (f.tables[table] ?? [])[0] ?? null, error: null });
  c.then = (r: (v: unknown) => unknown) => Promise.resolve(res).then(r);
  return c;
}
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...a: unknown[]) => f.rpc(...a),
    from: (t: string) => chain(t),
    functions: { invoke: vi.fn(() => Promise.resolve({})) },
  },
}));

import { BrowseCourseCard } from '@/components/courses/BrowseCourseCard';
import { CourseListRow } from '@/components/courses/CourseListRow';
import { YourHundredBlock } from '@/features/played/YourHundredBlock';
import { TickOffSheet } from '@/features/played/TickOffSheet';
import { CoursePlayedRow } from '@/features/played/CoursePlayedRow';
import { WaitingForRating, type WaitingCourse } from '@/features/played/WaitingForRating';
import { waitingForRating, waitingSubLine, youLine } from '@/hooks/played/playedRules';
import { useFriendsTop100Progress } from '@/hooks/useFriendsTop100Progress';
import { datedRecentTop100 } from '@/hooks/useTop100ProgressForUser';
import { playedYear } from '@/components/profile/courses/AllCoursesList';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import { routeForNotif } from '../../supabase/functions/_shared/notifRoute';
import type { StatBrowseRow } from '@/components/courses/useStatBrowse';

const entry = (p: Partial<PlayedEntry> & { course_id: string }): PlayedEntry => ({
  via_rating: false, via_round: false, via_tick: false, rating: null, ticked_at: null, can_untick: true, rounds: 0, ...p,
});
const browseRow = (id = 'c1', name = 'Muirfield'): StatBrowseRow => ({
  course_id: id, name, region: 'East Lothian', sub_country: 'Scotland', country: 'Scotland', image_url: null,
  community_rating: null, review_count: 0, global_rank: null, regional_rank: null, rounds: 0, members: 0,
  avg_to_par: null, total_yards: null, tee_label: null, course_record: null, open_crowns: 0, total_count: 0,
  design_score: null, condition_score: null, clubhouse_score: null, facilities_score: null, difficulty_percentile: null, memberships: [],
} as StatBrowseRow);

let qc: QueryClient;
const wrap = (ui: React.ReactElement, path = '/') => (qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }), render(
  <QueryClientProvider client={qc}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/" element={ui} />
    <Route path="/courses/:id" element={<div data-testid="course-page" />} />
    <Route path="/courses/:id/rate" element={<div data-testid="rate-page" />} />
  </Routes></MemoryRouter></QueryClientProvider>,
));
beforeEach(() => {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  f.user = { id: 'me' }; f.played = []; f.listRows = {}; f.tables = {};
  f.toast.mockReset(); f.toastErr.mockReset(); f.wantSet.mockReset();
  f.rpc.mockReset();
  f.rpc.mockImplementation((name: string, args?: { p_course_id: string; p_played: boolean }) => {
    if (name === 'set_course_played' && args) {
      const prev = f.played.find(e => e.course_id === args.p_course_id);
      const rest = f.played.filter(e => e.course_id !== args.p_course_id);
      f.played = args.p_played ? [...rest, entry({ ...prev, course_id: args.p_course_id, via_tick: true, ticked_at: '2026-11-28T00:00:00Z' })]
        : prev && (prev.via_rating || prev.via_round) ? [...rest, { ...prev, via_tick: false }] : rest;
    }
    return Promise.resolve({ data: name === 'get_my_played_courses' ? f.played : [], error: null });
  });
});
afterEach(cleanup);

describe('1–2 card tick', () => {
  it('unticked tap ticks optimistically, calls (id, true), Undo calls (id, false), never navigates', async () => {
    const open = vi.fn();
    wrap(<BrowseCourseCard row={browseRow()} onClick={open} playedTick="courses_list" />);
    const tick = await screen.findByRole('button', { name: 'Mark Muirfield as played' });
    fireEvent.click(tick);
    expect(await screen.findByRole('button', { name: 'Muirfield played' })).toHaveAttribute('data-on', 'true');
    expect(f.rpc).toHaveBeenCalledWith('set_course_played', { p_course_id: 'c1', p_played: true });
    expect(open).not.toHaveBeenCalled();
    const [msg, opts] = f.toast.mock.calls[0];
    expect(msg).toBe('Ticked off Muirfield');
    await act(async () => { (opts as { action: { onClick: () => void } }).action.onClick(); });
    expect(f.rpc).toHaveBeenCalledWith('set_course_played', { p_course_id: 'c1', p_played: false });
  });
  it.each([
    [{ via_rating: true, rating: 9.6 }, "You've rated this course"],
    [{ via_round: true, rounds: 2 }, 'You have rounds here'],
  ])('locked tick %o does not mutate and toasts', async (p, msg) => {
    f.played = [entry({ course_id: 'c1', can_untick: false, ...p })];
    wrap(<BrowseCourseCard row={browseRow()} onClick={vi.fn()} playedTick="top100_list" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Muirfield played' }));
    expect(f.rpc).not.toHaveBeenCalledWith('set_course_played', expect.anything());
    expect(f.toast).toHaveBeenCalledWith(msg);
  });
});

describe('3 you-line', () => {
  it('rules: rated, ticked, one round, three rounds, none', () => {
    expect(youLine(entry({ course_id: 'a', via_rating: true, rating: 9.6 }))).toEqual({ kind: 'rated', rating: '9.6' });
    expect(youLine(entry({ course_id: 'a', via_tick: true }))).toEqual({ kind: 'unrated', text: 'You played it · not rated yet' });
    expect(youLine(entry({ course_id: 'a', via_round: true, rounds: 1 }))).toEqual({ kind: 'unrated', text: '1 round tracked here · not rated yet' });
    expect(youLine(entry({ course_id: 'a', via_round: true, rounds: 3 }))).toEqual({ kind: 'unrated', text: '3 rounds tracked here · not rated yet' });
    expect(youLine(undefined)).toBeNull();
  });
  it('card renders the line only when played and only signed in; Rate it opens the rating', async () => {
    f.played = [entry({ course_id: 'c1', via_tick: true })];
    const { container, unmount } = wrap(<BrowseCourseCard row={browseRow()} onClick={vi.fn()} playedTick="courses_list" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Rate it ›' }));
    expect(await screen.findByTestId('rate-page')).toBeInTheDocument();
    unmount();
    f.user = null;
    const r = wrap(<BrowseCourseCard row={browseRow()} onClick={vi.fn()} playedTick="courses_list" />);
    expect(r.container.querySelector('[data-you-line]')).toBeNull();
    expect(screen.queryByRole('button', { name: /as played/ })).toBeNull();
    void container;
  });
});

describe('4 pill and scope', () => {
  it('RATED / PLAYED pill from usePlayedCourses in card and list views', async () => {
    f.played = [entry({ course_id: 'c1', via_rating: true, rating: 9 }), entry({ course_id: 'c2', via_round: true, rounds: 1 })];
    const { container } = wrap(<div>
      <BrowseCourseCard row={browseRow('c1')} onClick={vi.fn()} playedTick="top100_list" />
      <CourseListRow row={browseRow('c2', 'Dornoch')} lens="played" onClick={vi.fn()} playedTick="courses_list" />
    </div>);
    await waitFor(() => expect(container.querySelector('[data-viewer-pill="rated"]')).not.toBeNull());
    expect(container.querySelector('[data-viewer-pill="played"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-you-line]').length).toBe(1); // list rows carry no you-line
  });
  it('list-view tick toggles without opening the course; locked row does not untick', async () => {
    f.played = [entry({ course_id: 'c2', via_rating: true, can_untick: false, rating: 8 })];
    const open = vi.fn();
    wrap(<div>
      <CourseListRow row={browseRow('c1')} lens="played" onClick={open} playedTick="top100_list" />
      <CourseListRow row={browseRow('c2', 'Dornoch')} lens="played" onClick={open} playedTick="top100_list" />
    </div>);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark Muirfield as played' }));
    await waitFor(() => expect(f.rpc).toHaveBeenCalledWith('set_course_played', { p_course_id: 'c1', p_played: true }));
    fireEvent.click(await screen.findByRole('button', { name: 'Dornoch played' }));
    expect(f.toast).toHaveBeenCalledWith("You've rated this course");
    expect(open).not.toHaveBeenCalled();
  });
  it('without the opt-in prop no tick or pill renders', async () => {
    f.played = [entry({ course_id: 'c1', via_tick: true })];
    const { container } = wrap(<div><BrowseCourseCard row={browseRow()} onClick={vi.fn()} /><CourseListRow row={browseRow()} lens="played" onClick={vi.fn()} /></div>);
    await new Promise(r => setTimeout(r, 0));
    expect(container.querySelector('.pl-tk, .pl-rtk, [data-viewer-pill]')).toBeNull();
  });
  it('only the Courses list and the Top 100 list pass playedTick (both views)', () => {
    const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');
    expect(src('components/courses/StatBrowse.tsx').match(/playedTick="courses_list"/g)?.length).toBe(2);
    expect(src('components/courses/Top100CoursesHubPanel.tsx').match(/playedTick="top100_list"/g)?.length).toBe(2);
    for (const other of ['components/courses/browse/ByRegionSection.tsx', 'components/courses/browse/HardestSection.tsx', 'components/courses/CoursesContent.tsx']) {
      expect(src(other)).not.toMatch(/playedTick/);
    }
  });
});

describe('5 Your hundred', () => {
  it('counts and bar; below five shows the prompt; signed out hidden', () => {
    const { container, rerender } = wrap(<YourHundredBlock memberId="me" listSlug="gb-i" played={62} rated={18} total={100} />);
    expect(screen.getByText('YOUR HUNDRED · GB&I')).toBeInTheDocument();
    const bars = container.querySelectorAll('[data-your-hundred-bar] i');
    expect((bars[0] as HTMLElement).style.width).toBe('62%');
    expect((bars[1] as HTMLElement).style.width).toBe('18%');
    cleanup();
    wrap(<YourHundredBlock memberId="me" listSlug="gb-i" played={4} rated={1} total={100} />);
    expect(screen.getByText('Played any of these?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tick off courses' })).toBeInTheDocument();
    expect(document.querySelector('[data-your-hundred-bar]')).toBeNull();
    cleanup();
    const r = wrap(<YourHundredBlock memberId={undefined} listSlug="gb-i" played={62} rated={18} total={100} />);
    expect(r.container.querySelector('[data-your-hundred]')).toBeNull();
    void rerender;
  });
});

describe('6 Tick off sheet', () => {
  it('switches list, searches, ticks rows live, locks rated and rounds rows, Done closes', async () => {
    f.listRows = {
      'gb-i': [
        { course_id: 'a', course_name: 'Royal County Down', region: 'Down', rank: 1 },
        { course_id: 'b', course_name: 'Muirfield', region: 'East Lothian', rank: 2 },
        { course_id: 'd', course_name: 'Royal Portrush', region: 'Antrim', rank: 4 },
      ],
      global: [{ course_id: 'z', course_name: 'Pine Valley', region: 'New Jersey', rank: 1 }],
    };
    f.played = [entry({ course_id: 'a', via_rating: true, rating: 9.6, can_untick: false }), entry({ course_id: 'd', via_round: true, rounds: 2, can_untick: false })];
    const close = vi.fn();
    wrap(<TickOffSheet open onClose={close} initialList="gb-i" />);
    const foot = () => document.querySelector('[data-tick-foot]')!.textContent;
    await waitFor(() => expect(foot()).toContain('2 of 3 played · 1 rated'));
    expect(screen.getByText('RATED')).toBeInTheDocument();
    expect(screen.getByText('ROUNDS')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('listitem', { name: 'Mark Muirfield as played' }));
    await waitFor(() => expect(foot()).toContain('3 of 3 played'));
    expect(f.toast).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('listitem', { name: 'Royal County Down played' }));
    expect(f.rpc).not.toHaveBeenCalledWith('set_course_played', expect.objectContaining({ p_course_id: 'a' }));
    fireEvent.change(screen.getByPlaceholderText('Search the GB&I 100'), { target: { value: 'port' } });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByText('Global'));
    await waitFor(() => expect(screen.getByPlaceholderText('Search the Global 100')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(close).toHaveBeenCalled();
  });
});

describe('7 course page row', () => {
  it('Played it ticks; locked untick; Want to play unchanged; Rate it vs Rated; nudge only when played and unrated', async () => {
    wrap(<CoursePlayedRow courseId="c1" courseName="Muirfield" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Played it' }));
    expect(await screen.findByRole('button', { name: 'Played' })).toHaveAttribute('data-on', 'true');
    expect(f.rpc).toHaveBeenCalledWith('set_course_played', { p_course_id: 'c1', p_played: true });
    expect(screen.getByText("You've played Muirfield")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Want to play' }));
    expect(f.wantSet).toHaveBeenCalledWith(true);
    cleanup();
    f.played = [entry({ course_id: 'c1', via_rating: true, rating: 9.6, can_untick: false })];
    f.rpc.mockClear();
    wrap(<CoursePlayedRow courseId="c1" courseName="Muirfield" />);
    expect(await screen.findByRole('button', { name: 'Rated 9.6' })).toBeInTheDocument();
    expect(document.querySelector('[data-played-nudge]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Played' }));
    expect(f.toast).toHaveBeenCalledWith("You've rated this course");
    expect(f.rpc).not.toHaveBeenCalledWith('set_course_played', expect.anything());
    cleanup();
    f.played = [];
    wrap(<CoursePlayedRow courseId="c1" courseName="Muirfield" />);
    expect(await screen.findByRole('button', { name: 'Rate it' })).toBeInTheDocument();
    expect(document.querySelector('[data-played-nudge]')).toBeNull();
    cleanup();
    f.user = null;
    const r = wrap(<CoursePlayedRow courseId="c1" courseName="Muirfield" />);
    expect(r.container.querySelector('[data-course-played-row]')).toBeNull();
  });
});

describe('8 Waiting for your rating', () => {
  const now = new Date('2026-11-28T12:00:00Z');
  it('orders ticks newest first then rounds by count; sub-lines', () => {
    const list = waitingForRating([
      entry({ course_id: 'r1', via_round: true, rounds: 1 }),
      entry({ course_id: 't-old', via_tick: true, ticked_at: '2026-09-01T10:00:00Z' }),
      entry({ course_id: 'rated', via_rating: true, via_tick: true, ticked_at: '2026-11-28T10:00:00Z' }),
      entry({ course_id: 'r3', via_round: true, rounds: 3 }),
      entry({ course_id: 't-new', via_tick: true, ticked_at: '2026-11-28T09:00:00Z' }),
    ]);
    expect(list.map(e => e.course_id)).toEqual(['t-new', 't-old', 'r3', 'r1']);
    expect(waitingSubLine(list[0], now)).toBe('Ticked today');
    expect(waitingSubLine(entry({ course_id: 'x', via_tick: true, ticked_at: '2026-11-25T09:00:00Z' }), now)).toBe('Ticked 3 days ago');
    expect(waitingSubLine(list[1], now)).toBe('Ticked on 1 Sep');
    expect(waitingSubLine(list[2], now)).toBe('3 rounds tracked');
  });
  it('hidden at zero; See all sheet lists all', async () => {
    const courses = new Map<string, WaitingCourse>([['a', { id: 'a', name: 'Muirfield', imageUrl: null, rank: 2 }], ['b', { id: 'b', name: 'Dornoch', imageUrl: null, rank: 3 }]]);
    const r = wrap(<WaitingForRating courses={courses} now={now} />);
    await new Promise(res => setTimeout(res, 0));
    expect(r.container.querySelector('[data-waiting-rating]')).toBeNull();
    cleanup();
    f.played = [entry({ course_id: 'a', via_tick: true, ticked_at: '2026-11-28T09:00:00Z' }), entry({ course_id: 'b', via_round: true, rounds: 2 })];
    wrap(<WaitingForRating courses={courses} now={now} />);
    expect(await screen.findByText("You've played two you haven't rated")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See all ›' }));
    expect(within(screen.getByRole('dialog')).getAllByRole('button', { name: 'Rate it' })).toHaveLength(2);
  });
});

describe('9 leaderboard row line', () => {
  it('sheet rows read the rated column', () => {
    const src = readFileSync(resolve(__dirname, '../components/courses/top100/Top100Leaderboard.tsx'), 'utf8');
    expect(src).toMatch(/\{r\.rated\} rated/);
    expect(src).not.toMatch(/last_course_name\)/);
  });
});

describe('10 useCoursePersonalStatus', () => {
  it('reads played from usePlayedCourses, not a rating alone', () => {
    const src = readFileSync(resolve(__dirname, '../hooks/useCoursePersonalStatus.ts'), 'utf8');
    expect(src).toMatch(/usePlayedCourses\(\)/);
    expect(src).toMatch(/isPlayed\(playedEntry\)/);
  });
});

describe('11 friends progress', () => {
  it('total counts rounds and ticks from user_course_activity on active lists', async () => {
    f.tables = {
      user_follows: [{ following_id: 'fr' }],
      course_top100_memberships: [{ course_id: 'a' }, { course_id: 'b' }],
      top100_lists: [{ id: 'L1' }],
      user_course_activity: [{ user_id: 'fr', course_id: 'a' }, { user_id: 'fr', course_id: 'b' }],
      user_profiles: [{ id: 'fr', username: 'f', display_name: 'Friend', profile_photo_url: null }],
      user_top100_rated_courses: [],
    };
    const Probe = () => { const q = useFriendsTop100Progress('me', 'L1'); return <div data-total={q.data?.[0]?.total_top100_played ?? ''} />; };
    const { container } = wrap(<Probe />);
    await waitFor(() => expect(container.querySelector('[data-total]')!.getAttribute('data-total')).toBe('2'));
  });
});

describe('12 undated ticked-only activity', () => {
  it('excluded from recent; no year', () => {
    const rows = [{ course_id: 'a', played_at: null }, { course_id: 'b', played_at: '2026-05-01' }];
    expect(datedRecentTop100(rows, new Set(['a', 'b'])).map(r => r.course_id)).toEqual(['b']);
    expect(playedYear(null)).toBeNull();
  });
});

describe('13 rate_played_course routes', () => {
  it('both routers open /courses/<id>/rate', () => {
    const data = { course_id: 'c9', course_name: 'Muirfield' };
    expect(getActivityLink({ notif_id: 'n', notif_type: 'rate_played_course', entity_type: 'course', entity_id: 'c9', data } as never)).toBe('/courses/c9/rate');
    expect(routeForNotif({ notif_type: 'rate_played_course', entity_type: 'course', entity_id: 'c9', data, actor_user_id: null })).toBe('/courses/c9/rate');
  });
});
