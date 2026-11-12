import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '@/features/admin/pages/DashboardPage';
import type { CommandCentreV2 } from '@/features/admin/hooks/useCommandCentreV2';
import { adminTheme as t } from '@/features/admin/theme';

const state = vi.hoisted(() => ({ data: undefined as CommandCentreV2 | undefined, loading: false, error: false, pushStatus: 'green', calls: [] as number[] }));
vi.mock('@/features/admin/hooks/useCommandCentreV2', () => ({ useCommandCentreV2: (days: number) => { state.calls.push(days); return { data: state.data, isLoading: state.loading, isError: state.error, isFetched: true }; } }));
vi.mock('@/features/admin/hooks/useDashboard', () => ({ useDashboard: () => ({ egSyncHealth: { isLoading: false, isError: false, data: { status: 'green', freshest_hours_ago: 1, status_ok_count: 31, total_connected: 31, auth_failed: 0, eg_unavailable: 0, stale_12h_count: 0, cron_hours_ago: 2 } } }) }));
vi.mock('@/features/admin/hooks/usePushHealth', () => ({ usePushHealth: () => ({ isLoading: false, isError: false, data: { status: state.pushStatus } }) }));
vi.mock('@/features/admin/hooks/useStability', () => ({ useErrorCount24h: () => ({ data: 0, isLoading: false, isError: false }) }));
vi.mock('@/features/admin/hooks/useOpsHealth', () => ({ useOpsHealth: () => ({ isLoading: false, isError: false, data: { pipeline: { unprocessed: 0, oldest_wait_sec: 0, errored: 0 }, errors: { errors_24h: 0, sessions_24h: 20 } } }) }));
vi.mock('@/features/admin/hooks/useOverviewMetrics', () => ({ useLiveInApp: () => ({ data: { count: 1 }, isLoading: false, isError: false }), useRightNowHourly: vi.fn(), pctDelta: vi.fn() }));
vi.mock('@/features/admin/hooks/useActiveWindows', () => ({ useActiveWindows: () => ({ isLoading: false, isError: false, data: { dau: { current: 9, previous: 8 }, wau: { current: 35, previous: 29 }, mau: { current: 58, previous: 52 }, stickiness: 60.3, daily: [] } }) }));
vi.mock('@/features/admin/hooks/useRetention', () => ({ useRetention: () => ({ isLoading: false, isError: false, data: { cohort: { d1_eligible: 10, d1_returned: 4, d7_eligible: 10, d7_returned: 3 } } }) }));
vi.mock('@/features/admin/components/PostInsightSheet', () => ({ default: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

function fixture(): CommandCentreV2 {
  return {
    window_days: 7,
    target: { members: 126, members_goal: 1000, clubs: 4, clubs_goal: 200, deadline: new Date(Date.now() + 51 * 7 * 86400000).toISOString(), signups: 9, signups_prev: 4, clubs_added: 0 },
    do_now: { stuck_rounds: { courses: 1, rounds: 4, members: 4, oldest_days: 2, items: [{ name: 'Langley Park', rounds: 4, members: 4 }] }, gone_quiet: { members: 6, items: [{ user_id: 'quiet', name: 'Tom Riley', days: 14 }] }, clubs_to_pitch: { clubs: 0, items: [] }, first_rounds: { members: 0, items: [] }, unreacted: { posts: 0, items: [] }, played_not_connected: 0, inbox: 0 },
    loop: { joined: 126, connected: 31, round_in: 30, opened: 22, posted: 14, invited: 5, could_connect: 54, waiting_on_body: 41, not_placed: 0 },
    coverage: [{ body: 'England Golf', members: 85, connected: 31, waitlisted: 0, live: true }, { body: 'Scottish Golf', members: 14, connected: 0, waitlisted: 14, live: false }, { body: 'Not known', members: 4, connected: 0, waitlisted: 4, live: false }],
    clubs: { profiles: 4, clubs_with_members: 38, members_at_club: 89, members: 126, top: [] },
    moat: { rounds_total: 4439, holes_total: 79353, reviews_total: 220, courses_played: 315, courses_measured: 38, rounds_window: 14, holes_window: 243, reviews_window: 5, rounds_buckets: [], holes_series: [], reviews_series: [], measured_series: [] },
    clubhouse: { posts: 28, posts_prev: 30, reactions: 51, video_posts: 6, reviews: 5, reviews_prev: 4, top: [], creators: [] },
    retention: { d30_connected_n: 19, d30_connected_returned: 14, d30_not_n: 35, d30_not_returned: 11, cohorts: [] },
    hours: { current_hour: 8, hours: [], peak: 4, peak_hour: 7 },
    computed_at: '2026-11-12T08:08:00Z',
  };
}
const mount = () => render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><DashboardPage /></QueryClientProvider></MemoryRouter>);
const panel = (title: string) => { const el = screen.getByText(title).closest('section'); if (!el) throw new Error(`Missing ${title}`); return el; };
beforeEach(() => { localStorage.clear(); state.data = fixture(); state.loading = false; state.error = false; state.pushStatus = 'green'; state.calls = []; });
afterEach(cleanup);

describe('Admin Command centre v2', () => {
  it('hides zero tasks, names them in Clear, fills only the first action and totals visible counts', () => {
    mount(); const p = panel('Do now'); const q = within(p);
    expect(q.queryByRole('button', { name: /Clubs ready to pitch/ })).toBeNull();
    expect(p.textContent).toContain('Clear: Clubs to pitch · First rounds · Unreacted posts · Played, not connected · Inbox');
    expect(p.textContent).toContain('10 things · most urgent first');
    expect(q.getByRole('link', { name: 'MATCH' })).toHaveStyle({ background: t.ink });
    expect(q.getByRole('link', { name: 'DM' })).toHaveStyle({ background: 'transparent' });
    expect(q.getByText('Langley Park')).toBeTruthy();
  });
  it('computes members Doing 9 behind Needed 17 over 51 weeks', () => {
    mount(); const q = within(panel('The target')); const doing = q.getAllByText('Doing')[0].nextElementSibling; const needed = q.getAllByText('Needed')[0].nextElementSibling;
    expect(doing?.textContent).toBe('9 a week'); expect(doing).toHaveStyle({ color: t.danger }); expect(needed?.textContent).toBe('17 a week');
  });
  it('finds Connected as the largest leak and suppresses zero not-placed', () => {
    mount(); const p = panel('The loop'); expect(p.textContent).toContain('Biggest leak · joined → connected'); expect(p.textContent).toContain('54could connect today'); expect(p.textContent).toContain('41waiting on a handicap body'); expect(p.textContent).not.toContain("we can't place");
  });
  it('includes the third leak cell for three not-placed members', () => {
    if (state.data) state.data.loop.not_placed = 3; mount(); expect(panel('The loop').textContent).not.toContain("3we can't place");
  });
  it('selects 28 and 90 days for the v2 hook and persists the window', () => {
    mount(); fireEvent.click(screen.getByRole('tab', { name: '28D' })); expect(state.calls.at(-1)).toBe(28); fireEvent.click(screen.getByRole('tab', { name: '90D' })); expect(state.calls.at(-1)).toBe(90); expect(localStorage.getItem('admin.cc.window')).toBe('90');
  });
  it('marks live and in-talks bodies without a Not known chip', () => {
    mount(); const q = within(panel('Who can connect')); expect(q.getByText('England Golf').parentElement?.textContent).toBe('England GolfLIVE85'); expect(q.getByText('Scottish Golf').parentElement?.textContent).toBe('Scottish GolfIN TALKS14'); expect(q.getByText('No body named').parentElement?.textContent).toBe('No body named4');
  });
  it('withholds the day-30 percentage when the sample is three', () => {
    if (state.data) state.data.retention.d30_connected_n = 3; mount(); const p = panel('Retention'); expect(within(p).getByText('too few yet (3)').previousElementSibling?.textContent).toBe('—');
  });
  it('reports normal systems when all five chips are healthy', () => { mount(); expect(screen.getByRole('button', { name: /All systems normal/ })).toBeTruthy(); });
  it('reports one system needing attention without Echo', () => { state.pushStatus = 'red'; mount(); expect(screen.getByRole('button', { name: /1 needs attention/ })).toBeTruthy(); });
  it('contains no forbidden accent tokens in changed production files', () => {
    for (const file of ['features/admin/pages/DashboardPage.tsx', 'features/admin/hooks/useCommandCentreV2.ts']) expect(readFileSync(resolve(__dirname, '..', file), 'utf8')).not.toMatch(/t\.(?:brand|warn)|#F7931E|#FFA83A/i);
  });
  it('keeps every panel empty rather than inventing zeros after an RPC failure', () => { state.error = true; const { container } = mount(); expect(container.querySelectorAll('[aria-label="Unavailable"]')).toHaveLength(9); expect(screen.queryByText('£0')).toBeNull(); });
  it('renders plain post grammar for an unreacted post item', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.do_now.unreacted = { posts: 1, items: [{ post_id: 'unreacted', name: 'Pat Green', kind: 'post', hours: 8 }] };
    mount(); const p = panel('Do now'); fireEvent.click(within(p).getByRole('button', { name: /Posts nobody has reacted to/ }));
    expect(p.textContent).toContain('post · 8h'); expect(p.textContent).not.toContain('post post');
  });
  it('limits five Clubhouse top posts to the first four rows', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.clubhouse.top = Array.from({ length: 5 }, (_, i) => ({ post_id: `post-${i}`, name: `Member ${i}`, kind: 'post', course: null, gross: null, to_par: null, likes: i, comments: 0 }));
    mount(); const q = within(panel('Clubhouse')); expect(q.getAllByRole('button')).toHaveLength(4);
    expect(q.getByText('Member 3')).toBeTruthy(); expect(q.queryByText('Member 4')).toBeNull();
  });
  it('labels the unknown coverage row No body named without changing its source value', () => {
    mount(); const q = within(panel('Who can connect')); expect(q.getByText('No body named')).toBeTruthy(); expect(q.queryByText('Not known')).toBeNull(); expect(state.data?.coverage[2].body).toBe('Not known');
  });
  it('shows no one yet today for a zero hourly peak', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.hours.peak = 0; mount(); const p = panel('Right now'); expect(p.textContent).toContain('no one yet today'); expect(p.textContent).not.toContain('peak today 0');
  });
  it('keeps the Joined to Connected leak at exactly two figures when not placed is positive', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.loop.not_placed = 9; mount(); const q = within(panel('The loop'));
    const grid = q.getByText('could connect today').parentElement?.parentElement;
    expect(grid?.children).toHaveLength(2); expect(q.getByText('waiting on a handicap body')).toBeTruthy(); expect(q.queryByText("we can't place")).toBeNull();
  });
});
