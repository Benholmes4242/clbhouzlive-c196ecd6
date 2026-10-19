import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PanelRole } from '@/hooks/usePanelRole';

const f = vi.hoisted(() => ({
  role: vi.fn(),
  settings: vi.fn(),
  members: vi.fn(),
  setConfig: vi.fn(),
  setStaff: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/hooks/usePanelRole', () => ({ usePanelRole: f.role }));
vi.mock('../hooks/useAdminSettings', () => ({ useAdminSettings: f.settings }));
vi.mock('../hooks/useMembersRadar', () => ({ useMembersOverview: f.members }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'ben-id', email: 'benjamin@clbhouz.co.uk' } }) }));
vi.mock('@/lib/toast', () => ({ toast: { success: f.toastSuccess, error: f.toastError } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { display_name: 'Benjamin Holmes', username: 'ben' }, error: null }) }) }) }),
    auth: { signOut: vi.fn() },
  },
}));

import SettingsPage from './SettingsPage';

const SETTINGS = {
  maintenance: {
    on: false,
    message: "We're making clbhouz better. Back shortly.",
    changed_at: null,
    changed_by: null,
  },
  links: { app_store_url: 'https://apps.apple.com/app/clbhouz', play_store_url: null },
  staff: [
    { user_id: 'ben-id', email: 'benjamin@clbhouz.co.uk', name: 'Benjamin Holmes', is_you: true },
    { user_id: 'thomas-id', email: 'thomas@clbhouz.co.uk', name: 'Thomas Holmes', is_you: false },
  ],
};

const OVERVIEW = {
  members: [{ user_id: 'ben-id', display_name: 'Benjamin Holmes', username: 'ben', email: 'benjamin@clbhouz.co.uk', last_seen_at: null }],
  team: [
    { user_id: 'ben-id', display_name: 'Benjamin Holmes', role: 'full' },
    { user_id: 'thomas-id', display_name: 'Thomas Holmes', role: 'limited' },
  ],
};

function mount(role: PanelRole = 'full') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin-v2/settings']}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  f.setConfig.mockResolvedValue(true);
  f.setStaff.mockResolvedValue(true);
  f.settings.mockReturnValue({ data: SETTINGS, isLoading: false, isError: false, setConfig: f.setConfig, setStaff: f.setStaff });
  f.members.mockReturnValue({ data: OVERVIEW, isLoading: false, isError: false });
});

afterEach(cleanup);

describe('BRIEF_ADMIN_SETTINGS page', () => {
  it('a full admin sees all six sections', async () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    expect(await screen.findByText('Benjamin Holmes')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Get the app')).toBeInTheDocument();
    expect(screen.getByText('Staff accounts')).toBeInTheDocument();
    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
  });

  it('a limited admin sees only identity and This device', async () => {
    f.role.mockReturnValue({ role: 'limited', loading: false });
    mount('limited');
    expect(await screen.findByText('Benjamin Holmes')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
    expect(screen.queryByText('Get the app')).not.toBeInTheDocument();
    expect(screen.queryByText('Staff accounts')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin access')).not.toBeInTheDocument();
  });

  it('the maintenance switch opens the confirm sheet and does not call setConfig', () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    fireEvent.click(screen.getByRole('switch', { name: 'Maintenance mode' }));
    expect(screen.getByRole('dialog', { name: 'Lock members out?' })).toBeInTheDocument();
    expect(f.setConfig).not.toHaveBeenCalled();
  });

  it("Turn maintenance on saves a changed message first, then turns maintenance on", async () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    fireEvent.click(screen.getByRole('switch', { name: 'Maintenance mode' }));
    fireEvent.change(screen.getByLabelText('What members see'), { target: { value: 'Back at six.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn maintenance on' }));
    await vi.waitFor(() => expect(f.setConfig).toHaveBeenCalledTimes(2));
    expect(f.setConfig).toHaveBeenCalledWith('maintenance_message', 'Back at six.');
    expect(f.setConfig).toHaveBeenCalledWith('maintenance_mode', 'on');
    expect(f.setConfig.mock.invocationCallOrder[0]).toBeLessThan(f.setConfig.mock.invocationCallOrder[1]);
  });

  it("when on, the switch turns maintenance off directly", () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    f.settings.mockReturnValue({
      data: { ...SETTINGS, maintenance: { on: true, message: SETTINGS.maintenance.message, changed_at: '2026-10-19T15:24:00.000Z', changed_by: { user_id: 'ben-id', name: 'Benjamin Holmes' } } },
      isLoading: false, isError: false, setConfig: f.setConfig, setStaff: f.setStaff,
    });
    mount();
    fireEvent.click(screen.getByRole('switch', { name: 'Maintenance mode' }));
    expect(f.setConfig).toHaveBeenCalledWith('maintenance_mode', 'off');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("the on status reads 'On since 16:24 · by you'", () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    f.settings.mockReturnValue({
      data: { ...SETTINGS, maintenance: { on: true, message: SETTINGS.maintenance.message, changed_at: '2026-10-19T15:24:00.000Z', changed_by: { user_id: 'ben-id', name: 'Benjamin Holmes' } } },
      isLoading: false, isError: false, setConfig: f.setConfig, setStaff: f.setStaff,
    });
    mount();
    expect(screen.getByText('On since 16:24 · by you')).toBeInTheDocument();
  });

  it("an unset Google Play link shows 'Not set: Android phones get the website' and 'Add'", () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    expect(screen.getByText('Not set: Android phones get the website')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('unflagging a staff row calls setStaff with false', () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    fireEvent.click(screen.getByRole('switch', { name: 'Staff account thomas@clbhouz.co.uk' }));
    expect(f.setStaff).toHaveBeenCalledWith('thomas-id', false);
  });

  it("Admin access shows 'You · active now' for the viewer", () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    mount();
    expect(screen.getByText('You · active now')).toBeInTheDocument();
  });

  it("Copy diagnostics writes text containing 'build:' and 'role: full'", async () => {
    f.role.mockReturnValue({ role: 'full', loading: false });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Copy diagnostics' }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('clbhouz diagnostics');
    expect(text).toContain('build:');
    expect(text).toContain('role: full');
  });
});
