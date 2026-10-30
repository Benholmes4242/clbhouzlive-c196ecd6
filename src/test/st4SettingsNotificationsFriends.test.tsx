import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ state: 'enabled', loading: false, enable: vi.fn(), disable: vi.fn(), muted: [] as string[], prefError: null as Error | null, invite: vi.fn() }));
vi.mock('@/hooks/usePushNotifications', () => ({ usePushNotifications: () => ({ state: h.state, isLoading: h.loading, enable: h.enable, disable: h.disable }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me', email: 'ben@clbhouz.co.uk' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me', is_public: true }, loading: false }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useHasBusinesses: () => ({ hasBusinesses: false, count: 0, isLoading: false }) }));
vi.mock('@/hooks/useMyRequests', async importOriginal => ({ ...await importOriginal<typeof import('@/hooks/useMyRequests')>(), useMyRequestsList: () => ({ data: [], isLoading: false, isError: false, error: null }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: h.invite }) }));
vi.mock('@/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({ showDeleteConfirm: false, setShowDeleteConfirm: vi.fn(), showBusinessWarning: false, setShowBusinessWarning: vi.fn(), ownedBusinessNames: [], deleteConfirmText: '', setDeleteConfirmText: vi.fn(), isDeleting: false, initiateDelete: vi.fn(), confirmDelete: vi.fn() }) }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/settings/useSettingsBlockedCount', () => ({ useSettingsBlockedCount: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: () => Promise.resolve({ error: null }),
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(h.prefError ? { data: null, error: h.prefError } : { data: { muted_types: h.muted, muted_user_ids: [], muted_business_ids: [] }, error: null }) }) }) }),
} }));

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import NotificationsPage from '@/pages/manage/NotificationsPage';
import { CATEGORIES } from '@/lib/notifications/notificationCategories';

let qc: QueryClient;
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
const mount = () => render(<QueryClientProvider client={qc}><MemoryRouter><div className="ep-shell"><SettingsTabContent /></div><Location /></MemoryRouter></QueryClientProvider>);
const push = () => screen.getByRole('switch', { name: 'Push' });
const alert = () => screen.getByTestId('settings-alert-value');
beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }); vi.clearAllMocks(); Object.assign(h, { state: 'enabled', loading: false, muted: [], prefError: null }); });
afterEach(() => { cleanup(); qc.clear(); });

describe('ST4 Push', () => {
  it('shows On this phone checked when enabled and toggles to disable', () => { mount(); expect(screen.getByTestId('settings-push-value').textContent).toBe('On this phone'); expect(push()).toHaveAttribute('aria-checked', 'true'); fireEvent.click(push()); expect(h.disable).toHaveBeenCalledTimes(1); expect(h.enable).not.toHaveBeenCalled(); });
  it('shows Off when disabled and toggles to enable', () => { h.state = 'disabled'; mount(); expect(screen.getByTestId('settings-push-value').textContent).toBe('Off'); expect(push()).toHaveAttribute('aria-checked', 'false'); fireEvent.click(push()); expect(h.enable).toHaveBeenCalledTimes(1); });
  it('shows Needs the latest app as a disabled off placeholder when unavailable', () => { h.state = 'unavailable'; mount(); const value = screen.getByTestId('settings-push-value'); expect(value.textContent).toBe('Needs the latest app'); expect(value).toHaveClass('ph'); expect(push()).toBeDisabled(); expect(push()).toHaveAttribute('aria-checked', 'false'); expect(push()).toHaveAttribute('data-unavailable', 'true'); });
  it.each([[true, 'enabled'], [false, 'unknown']])('shows no value and a disabled switch while loading (%s, %s)', (loading, state) => { Object.assign(h, { loading, state }); mount(); expect(screen.getByTestId('settings-push-value').textContent).toBe(''); expect(push()).toBeDisabled(); });
});

describe('ST4 Alerts', () => {
  it('shows All 11 on with nothing muted and opens Notifications', async () => { mount(); await waitFor(() => expect(alert().textContent).toBe('All 11 on')); fireEvent.click(screen.getByRole('button', { name: /^Alerts/ })); expect(screen.getByTestId('location').textContent).toBe('/manage/notifications'); });
  it('counts a category off when one of its types is muted', async () => { h.muted = [CATEGORIES[0].types[0], CATEGORIES[1].types[1]]; mount(); await waitFor(() => expect(alert().textContent).toBe('9 of 11 on')); });
  it('shows All off when every category is muted', async () => { h.muted = CATEGORIES.map(c => c.types[0]); mount(); await waitFor(() => expect(alert().textContent).toBe('All off')); });
  it('shows nothing on preference read error', async () => { h.prefError = new Error('refused'); mount(); await waitFor(() => expect(qc.getQueryState(['settings-alert-summary', 'me'])?.status).toBe('error')); expect(alert().textContent).toBe(''); });
  it('NotificationsPage renders all 11 shared categories', () => { render(<QueryClientProvider client={qc}><MemoryRouter><NotificationsPage /></MemoryRouter></QueryClientProvider>); expect(CATEGORIES).toHaveLength(11); for (const c of CATEGORIES) expect(screen.getByText(c.label)).toBeInTheDocument(); });
});

describe('ST4 Friends', () => {
  it('renders the circle card and pill opens the settings invitation', () => {
    const { container } = mount(); const card = container.querySelector('.st4-friends');
    expect(card?.querySelector('b')?.textContent).toBe("Golf's better with your circle."); expect(card?.querySelector('p')?.textContent).toBe('Bring your playing partners and their rounds sit next to yours.');
    fireEvent.click(screen.getByRole('button', { name: 'Share your link' })); expect(h.invite).toHaveBeenCalledWith('settings');
  });
  it('removes Invite friends and Notification Preferences rows', () => { mount(); expect(screen.queryByText('Invite friends')).toBeNull(); expect(screen.queryByText('Notification Preferences')).toBeNull(); });
});