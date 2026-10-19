import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  role: vi.fn(),
  settings: vi.fn(),
  maintenance: vi.fn(),
  setConfig: vi.fn(),
  setStaff: vi.fn(),
  live: vi.fn(),
}));

vi.mock('@/hooks/usePanelRole', () => ({ usePanelRole: f.role }));
vi.mock('@/hooks/useMedianStatusBar', () => ({ useMedianStatusBar: () => {} }));
vi.mock('./hooks/useAdminSettings', () => ({ useAdminSettings: f.settings }));
vi.mock('@/hooks/useMaintenanceMode', () => ({ useMaintenanceMode: f.maintenance }));
vi.mock('./hooks/useAnalyticsLenses', () => ({ useAnalyticsLive: f.live }));
vi.mock('./AdminDrawer', () => ({ default: () => null }));
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>Dashboard page</div> }));
vi.mock('./pages/UsersPage', () => ({ default: () => <div>Members page</div> }));
vi.mock('./pages/ContentPage', () => ({ default: () => <div>Content page</div> }));
vi.mock('./pages/AnalyticsPage', () => ({ default: () => <div>Analytics page</div> }));
vi.mock('./pages/InboxPage', () => ({ default: () => <div>Inbox page</div> }));
vi.mock('./pages/SettingsPage', () => ({ default: () => <div>Settings page</div> }));
/* HealthPage stays real so the settings-tab redirect is exercised; its lenses
   and the video page are stubbed. */
vi.mock('./components/analytics/AnalyticsLenses', () => ({ default: () => null }));
vi.mock('./components/health/StatusLens', () => ({ default: () => null }));
vi.mock('./components/health/GolfDataLens', () => ({ default: () => null }));
vi.mock('./components/health/AppLens', () => ({ default: () => null }));
vi.mock('./components/health/JobsLens', () => ({ default: () => null }));
vi.mock('./pages/VideoPerfPage', () => ({ default: () => null }));

import AdminShell from './AdminShell';

function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin-v2/*" element={<AdminShell />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  f.role.mockReturnValue({ role: 'full', loading: false });
  f.setConfig.mockResolvedValue(true);
  f.settings.mockReturnValue({
    data: { maintenance: { on: false, message: null, changed_at: null, changed_by: null }, links: { app_store_url: null, play_store_url: null }, staff: [] },
    isLoading: false, isError: false, setConfig: f.setConfig, setStaff: f.setStaff,
  });
  f.maintenance.mockReturnValue({ on: false, message: null });
  f.live.mockReturnValue({ data: { now: 3 }, isLoading: false, isError: false });
});

afterEach(cleanup);

describe('BRIEF_ADMIN_SETTINGS shell', () => {
  it('the maintenance bar renders on any admin route while maintenance is on, and Turn off calls setConfig', async () => {
    f.settings.mockReturnValue({
      data: { maintenance: { on: true, message: null, changed_at: new Date(Date.now() - 4 * 60_000).toISOString(), changed_by: null }, links: { app_store_url: null, play_store_url: null }, staff: [] },
      isLoading: false, isError: false, setConfig: f.setConfig, setStaff: f.setStaff,
    });
    mount('/admin-v2/users');
    const bar = await screen.findByRole('status');
    expect(bar).toHaveTextContent('Maintenance on · 4 min · members locked out');
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    expect(f.setConfig).toHaveBeenCalledWith('maintenance_mode', 'off');
  });

  it("shows the title 'Settings' on /admin-v2/settings with no refresh button", async () => {
    mount('/admin-v2/settings');
    expect(await screen.findByText('Settings page')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
  });

  it('/admin-v2/health?tab=settings redirects to /admin-v2/settings', async () => {
    mount('/admin-v2/health?tab=settings');
    expect(await screen.findByText('Settings page')).toBeInTheDocument();
  });

  /* BRIEF_ADMIN_SETTINGS_FIX1: hooks run before the early returns, so a role
     that resolves after the loading render cannot grow the hook count. */
  it.each([
    ['full', 'Dashboard page'],
    ['moderator', 'Inbox page'],
  ] as const)('renders without throwing when the role resolves to %s after a loading render', async (role, expected) => {
    f.role.mockReturnValue({ role: 'none', loading: true });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const tree = (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/admin-v2/dashboard']}>
          <Routes>
            <Route path="/admin-v2/*" element={<AdminShell />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    const { rerender } = render(tree);
    f.role.mockReturnValue({ role, loading: false });
    rerender(tree);
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });
});
