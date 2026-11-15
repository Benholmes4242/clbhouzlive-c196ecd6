import React from 'react';
import { readFileSync } from 'node:fs';
import { doNowTotal } from './lib/doNowTotal';
import type { CommandCentreV2 } from './hooks/useCommandCentreV2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PanelRole } from '@/hooks/usePanelRole';

const f = vi.hoisted(() => ({ triage: vi.fn(), live: vi.fn(), health: vi.fn(), maintenance: vi.fn(), members: vi.fn(), command: vi.fn() }));
vi.mock('./hooks/useCommandCentreV2', () => ({ useCommandCentreV2: f.command }));
vi.mock('./hooks/useTriageCounts', () => ({ useTriageCounts: f.triage }));
vi.mock('./hooks/useAnalyticsLenses', () => ({ useAnalyticsLive: f.live }));
vi.mock('./components/health/healthIssues', () => ({ useHealthVerdict: f.health }));
vi.mock('@/hooks/useMaintenanceMode', () => ({ useMaintenanceMode: f.maintenance }));
vi.mock('./hooks/useMembersRadar', () => ({ useMembersOverview: f.members }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'admin', email: 'ben@example.test' } }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import AdminDrawer from './AdminDrawer';

function draw({ role = 'full', open = true, path = '/admin-v2/dashboard' }: { role?: PanelRole; open?: boolean; path?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['admin-v2', 'me'], { display_name: 'Benjamin Holmes', username: 'ben' });
  const close = vi.fn();
  const view = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><AdminDrawer open={open} role={role} canManageAdmins={role === 'full'} onClose={close} /></MemoryRouter></QueryClientProvider>);
  return { ...view, close };
}
function commandFixture(): CommandCentreV2 {
  return { window_days: 7, target: { members: 134, members_goal: 1000, clubs: 4, clubs_goal: 200, deadline: '2026-12-31', signups: 9, signups_prev: 4, clubs_added: 0 },
    do_now: { stuck_rounds: { courses: 1, rounds: 1, members: 1, oldest_days: 2, items: [] }, gone_quiet: { members: 2, items: [] }, clubs_to_pitch: { clubs: 3, items: [] }, first_rounds: { members: 4, items: [] }, unreacted: { posts: 5, items: [] }, played_not_connected: 6, inbox: 7 },
    loop: { joined: 134, connected: 31, round_in: 30, opened: 22, posted: 14, invited: 5, could_connect: 54, waiting_on_body: 41, not_placed: 0 }, coverage: [],
    clubs: { profiles: 4, clubs_with_members: 38, members_at_club: 89, members: 134, top: [] },
    moat: { rounds_total: 0, holes_total: 0, reviews_total: 0, courses_played: 0, courses_measured: 0, rounds_window: 0, holes_window: 0, reviews_window: 0, rounds_buckets: [], holes_series: [], reviews_series: [], measured_series: [] },
    clubhouse: { posts: 0, posts_prev: 0, reactions: 0, video_posts: 0, reviews: 0, reviews_prev: 0, top: [], creators: [] },
    retention: { d30_connected_n: 0, d30_connected_returned: 0, d30_not_n: 0, d30_not_returned: 0, cohorts: [] }, hours: { current_hour: 0, hours: [], peak: 0, peak_hour: 0 }, computed_at: '2026-11-15T19:20:00Z' };
}
beforeEach(() => {
  vi.clearAllMocks();
  f.command.mockReturnValue({ data: commandFixture(), isLoading: false, isError: false });
  f.triage.mockReturnValue({ data: { total: 0, oldestCreatedAt: null }, isLoading: false });
  f.live.mockReturnValue({ data: { now: 26, today: 92, peak: 134, peak_at: '11:25', bars: Array.from({ length: 35 }, (_, i) => i) }, isLoading: false, isError: false });
  f.health.mockReturnValue({ issues: [], isLoading: false, isError: false });
  f.maintenance.mockReturnValue({ on: false });
  f.members.mockReturnValue({ data: { members: [{ user_id: 'thomas', display_name: 'Thomas Holmes', username: 'thomas', email: 'thomas@example.test', photo_url: null }] }, isLoading: false, isError: false });
});
afterEach(cleanup);
describe('BRIEF_ADMIN_SIDE_MENU', () => {
  it('full admin all-clear exposes live figures, grouped destinations and identity', () => {
    draw();
    expect(screen.getAllByText('Command centre')).toHaveLength(1);
    expect(within(screen.getByRole('dialog')).getByText('Admin')).toBeInTheDocument();
    const live = screen.getByRole('link', { name: /In the app now/ });
    expect(live).toHaveAttribute('href', '/admin-v2/analytics?lens=live');
    expect(within(live).getByText('26')).toBeInTheDocument();
    expect(within(live).getByText('92')).toBeInTheDocument();
    expect(within(live).getByText('134')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Screen views, last 30 minutes' }).children).toHaveLength(30);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('26 live')).toBeInTheDocument();
    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(screen.queryByText('Maintenance on')).not.toBeInTheDocument();
    expect(screen.getByText('Full admin')).toBeInTheDocument();
    expect(screen.getByText('Benjamin Holmes')).toBeInTheDocument();
    expect(screen.getByText(/^Build /)).toBeInTheDocument();
    expect(f.live).toHaveBeenCalledWith(false, false);
  });
  it('attention shows seven waiting, two-day age, two issues and maintenance', () => {
    f.triage.mockReturnValue({ data: { total: 7, oldestCreatedAt: new Date(Date.now() - 2 * 86400000).toISOString() }, isLoading: false });
    f.health.mockReturnValue({ issues: [{}, {}], isLoading: false, isError: false });
    f.maintenance.mockReturnValue({ on: true });
    draw();
    expect(within(screen.getByRole('link', { name: /Inbox/ })).getByText('7')).toBeInTheDocument();
    expect(screen.getByText('oldest 2d')).toBeInTheDocument();
    expect(screen.getByText('2 issues')).toBeInTheDocument();
    expect(screen.getByText('Maintenance on')).toBeInTheDocument();
  });
  it('moderator sees only Inbox and Settings without live, search or member group', () => {
    draw({ role: 'moderator' });
    expect(within(screen.getByRole('navigation')).getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(['/admin-v2/inbox', '/admin-v2/settings']);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByText('In the app now')).not.toBeInTheDocument();
    expect(screen.queryByText('Members and golf')).not.toBeInTheDocument();
    expect(f.live).not.toHaveBeenCalled(); expect(f.health).not.toHaveBeenCalled();
  });
  it('search waits for two trimmed characters, opens the member and clears back to groups', () => {
    const { close } = draw();
    const input = screen.getByRole('searchbox');
    expect(f.members).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' t ' } });
    expect(f.members).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'tho' } });
    const member = screen.getByRole('link', { name: /Thomas Holmes/ });
    expect(member).toHaveAttribute('href', '/admin-v2/users?member=thomas');
    fireEvent.click(member); expect(close).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No member matches "zzz"')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Members and golf')).toBeInTheDocument();
  });
  it('closed drawer never mounts live, Health or search queries', () => {
    draw({ open: false });
    expect(f.live).not.toHaveBeenCalled(); expect(f.health).not.toHaveBeenCalled(); expect(f.members).not.toHaveBeenCalled();
  });
  it('limited admin can search but never requests live or Health', () => {
    draw({ role: 'limited' });
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Analytics/ })).not.toBeInTheDocument();
    expect(f.live).not.toHaveBeenCalled(); expect(f.health).not.toHaveBeenCalled();
    expect(screen.getByText('Limited admin')).toBeInTheDocument();
  });
  it('Settings destination alone is active on its own route', () => {
    draw({ path: '/admin-v2/settings' });
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Health/ })).not.toHaveAttribute('aria-current');
  });
  it('close, Escape, live and Back to app each invoke the existing close callback', () => {
    const { close } = draw();
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('link', { name: /In the app now/ }));
    fireEvent.click(screen.getByRole('link', { name: 'Back to app' }));
    expect(close).toHaveBeenCalledTimes(4);
    expect(screen.getByRole('link', { name: 'Back to app' })).toHaveAttribute('href', '/clubhouse');
  });
  it('search prioritizes starting names and caps case-insensitive name, username and email matches at eight', () => {
    f.members.mockReturnValue({ data: { members: [
      { user_id: 'email', display_name: 'Other', username: 'other', email: 'THO@example.test' },
      ...Array.from({ length: 9 }, (_, i) => ({ user_id: String(i), display_name: `Thomas ${i}`, username: `member${i}`, email: null })),
      { user_id: 'username', display_name: 'Another', username: 'THO', email: null },
    ] }, isLoading: false, isError: false });
    draw(); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ThO' } });
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links).toHaveLength(8);
    expect(links[0]).toHaveAttribute('href', '/admin-v2/users?member=0');
    f.members.mockReturnValue({ data: { members: [{ user_id: 'email', display_name: 'Other', email: 'THO@example.test' }, { user_id: 'username', display_name: 'Another', username: 'THO' }] }, isLoading: false, isError: false });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tho ' } });
    expect(screen.getByRole('link', { name: 'Other' })).toHaveAttribute('href', '/admin-v2/users?member=email');
    expect(screen.getByRole('link', { name: /Another/ })).toHaveAttribute('href', '/admin-v2/users?member=username');
  });
  it('loading statuses are absent and failed live and Health never claim all clear', () => {
    f.triage.mockReturnValue({ isLoading: true });
    f.live.mockReturnValue({ isLoading: false, isError: true });
    f.health.mockReturnValue({ issues: [], isLoading: false, isError: true });
    draw();
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    expect(screen.queryByText('All clear')).not.toBeInTheDocument();
    expect(screen.queryByText('In the app now')).not.toBeInTheDocument();
    expect(screen.queryByText(/ live$/)).not.toBeInTheDocument();
  });
  it('missing peak time omits the at clause and missing now omits Analytics live state', () => {
    f.live.mockReturnValue({ data: { now: null, today: null, peak: null, peak_at: null, bars: [] }, isLoading: false, isError: false });
    draw();
    expect(screen.queryByText(/ at /)).not.toBeInTheDocument();
    expect(screen.queryByText(/ live$/)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Screen views, last 30 minutes' }).children).toHaveLength(30);
  });
});

describe('ADMIN_SIDE_MENU_V3', () => {
  it('shares all seven Do now counts and renders full-admin task and member signals', () => {
    draw();
    expect(doNowTotal(commandFixture().do_now)).toBe(28);
    expect(within(screen.getByRole('link', { name: /Command centre/ })).getByText('28')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Members/ })).getByText('134')).toBeInTheDocument();
    expect(f.command).toHaveBeenCalledWith(7);
  });
  it('renders clear when all seven task counts are zero', () => {
    const data = commandFixture();
    data.do_now.stuck_rounds.rounds = 0; data.do_now.gone_quiet.members = 0; data.do_now.clubs_to_pitch.clubs = 0; data.do_now.first_rounds.members = 0; data.do_now.unreacted.posts = 0; data.do_now.played_not_connected = 0; data.do_now.inbox = 0;
    f.command.mockReturnValue({ data, isLoading: false, isError: false }); draw();
    expect(doNowTotal(data.do_now)).toBe(0);
    expect(within(screen.getByRole('link', { name: /Command centre/ })).getByText('clear')).toBeInTheDocument();
  });
  it.each(['loading', 'error'])('suppresses both signals on %s even with cached figures', state => {
    f.command.mockReturnValue({ data: commandFixture(), isLoading: state === 'loading', isError: state === 'error' }); draw();
    expect(screen.queryByText(/to do/)).not.toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Members/ })).queryByText('134')).not.toBeInTheDocument();
    expect(screen.queryByText('clear')).not.toBeInTheDocument();
  });
  it.each([{ open: false, role: 'full' as const }, { open: true, role: 'limited' as const }, { open: true, role: 'moderator' as const }])('never requests Command centre for open=$open role=$role', props => {
    draw(props); expect(f.command).not.toHaveBeenCalled();
  });
  it('renders Health issues in bad and All clear in faint', () => {
    f.health.mockReturnValue({ issues: [{}], isLoading: false, isError: false }); const view = draw();
    expect(screen.getByText('1 issue')).toHaveStyle({ color: 'var(--cc3-bad)' });
    view.unmount(); f.health.mockReturnValue({ issues: [], isLoading: false, isError: false }); draw();
    expect(screen.getByText('All clear')).toHaveStyle({ color: 'var(--cc3-faint)' });
  });
  it('uses no amber or brand/warn tokens in either drawer file or element', () => {
    f.triage.mockReturnValue({ data: { total: 7, oldestCreatedAt: new Date().toISOString() }, isLoading: false }); f.maintenance.mockReturnValue({ on: true });
    const { container } = draw();
    for (const file of ['src/features/admin/AdminDrawer.tsx', 'src/features/admin/AdminDrawerStatus.tsx']) expect(readFileSync(file, 'utf8')).not.toMatch(/t\.(?:brand\w*|warn\w*)|#F7931E|#FFA83A/i);
    for (const el of container.querySelectorAll('[style]')) expect(el.getAttribute('style')).not.toMatch(/#F7931E|#FFA83A|rgb\(247, 147, 30\)|rgb\(255, 168, 58\)/i);
  });
  it('contains no text under 10px', () => {
    const { container } = draw(); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tho' } });
    for (const file of ['src/features/admin/AdminDrawer.tsx', 'src/features/admin/AdminDrawerStatus.tsx']) for (const m of readFileSync(file, 'utf8').matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    for (const el of container.querySelectorAll<HTMLElement>('[style]')) if (el.style.fontSize) expect(parseFloat(el.style.fontSize)).toBeGreaterThanOrEqual(10);
  });
  it('wraps result names and shows usernames without ellipsis', () => {
    draw(); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tho' } });
    const link = screen.getByRole('link', { name: /Thomas Holmes/ });
    expect(within(link).getByText('@thomas')).toBeInTheDocument();
    expect(within(link).getByText('Thomas Holmes').closest('span[style*="overflow-wrap"]')).toHaveStyle({ overflowWrap: 'anywhere' });
    for (const el of link.querySelectorAll<HTMLElement>('[style]')) expect(el.style.textOverflow).not.toBe('ellipsis');
  });
  it('Cancel clears and blurs search and restores the groups', () => {
    draw(); const input = screen.getByRole('searchbox'); input.focus(); fireEvent.change(input, { target: { value: 'tho' } });
    expect(screen.queryByText('Members and golf')).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(input).toHaveValue(''); expect(input).not.toHaveFocus(); expect(screen.getByText('Members and golf')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
