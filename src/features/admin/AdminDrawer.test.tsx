import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PanelRole } from '@/hooks/usePanelRole';

const f = vi.hoisted(() => ({ triage: vi.fn(), live: vi.fn(), health: vi.fn(), maintenance: vi.fn(), members: vi.fn() }));
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
beforeEach(() => {
  vi.clearAllMocks();
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
    expect(screen.getAllByText('Command centre')).toHaveLength(2);
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
