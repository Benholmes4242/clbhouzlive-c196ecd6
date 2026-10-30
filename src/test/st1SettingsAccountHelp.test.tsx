import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import type { MyRequestStatus } from '@/hooks/useMyRequests';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ count: 2, requests: [] as { status: string }[], loading: false, error: null as Error | null, initiateDelete: vi.fn(), logout: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me', email: 'benjamin@clbhouz.co.uk' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me', username: 'ben', display_name: 'Ben', is_public: true }, loading: false }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useHasBusinesses: () => ({ hasBusinesses: h.count > 0, count: h.count, isLoading: false }) }));
vi.mock('@/hooks/useMyRequests', async importOriginal => ({ ...await importOriginal<typeof import('@/hooks/useMyRequests')>(), useMyRequestsList: () => ({ data: h.requests, isLoading: h.loading, isError: !!h.error, error: h.error }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: vi.fn() }) }));
vi.mock('@/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({ showDeleteConfirm: false, setShowDeleteConfirm: vi.fn(), showBusinessWarning: false, setShowBusinessWarning: vi.fn(), ownedBusinessNames: [], deleteConfirmText: '', setDeleteConfirmText: vi.fn(), isDeleting: false, initiateDelete: h.initiateDelete, confirmDelete: vi.fn() }) }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: h.logout }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => Promise.resolve({ error: null }) } }));

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';

let qc: QueryClient;
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function mount() { return render(<QueryClientProvider client={qc}><MemoryRouter><div className="ep-shell"><SettingsTabContent /></div><Location /></MemoryRouter></QueryClientProvider>); }
const accountRow = (label: string) => within(screen.getByTestId('settings-account')).getByRole('button', { name: new RegExp(`^${label}`) });
const helpRow = (label: string) => within(screen.getByTestId('settings-help')).getByRole('button', { name: new RegExp(`^${label}`) });
const requests = (...statuses: MyRequestStatus[]) => { h.requests = statuses.map(status => ({ status })); };
beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); vi.clearAllMocks(); h.count = 2; h.requests = []; h.loading = false; h.error = null; });
afterEach(() => { cleanup(); qc.clear(); });

describe('ST1 Settings', () => {
  it('removes the mini-card and orders the six groups', () => {
    const { container } = mount();
    expect(Array.from(container.querySelectorAll('.ep-group'), node => node.textContent)).toEqual(['Your handicap', 'Privacy', 'Notifications', 'Account', 'Friends', 'Help']);
    expect(screen.queryByRole('button', { name: /Ben/ })).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
  it('masks email and keeps the existing email destination', () => {
    mount(); expect(accountRow('Email')).toHaveTextContent('be••••••@clbhouz.co.uk');
    fireEvent.click(accountRow('Email')); expect(screen.getByTestId('location')).toHaveTextContent('/manage/email');
  });
  it.each([[2, '2 profiles', false], [1, '1 profile', false], [0, 'Set one up', true]])('shows the live business count %s', (count, value, placeholder) => {
    h.count = count; mount(); const row = accountRow('Businesses');
    expect(row.querySelector('.ep-row-value')?.textContent).toBe(value);
    expect(row.querySelector('.ep-row-value')?.classList.contains('ph')).toBe(placeholder);
    fireEvent.click(row); expect(screen.getByTestId('location')).toHaveTextContent('/businesses/manage');
  });
  it('keeps the existing verification enquiry destination', () => {
    mount(); expect(accountRow('Verification')).toHaveTextContent('How it works'); fireEvent.click(accountRow('Verification'));
    expect(screen.getByTestId('location').textContent).toBe('/manage/contact?category=account&subject=Verification%20enquiry');
  });
  it.each([['Help centre', '/manage/help'], ['Contact us', '/manage/contact'], ['Legal', '/manage/legal']])('keeps the %s destination', (label, path) => {
    mount(); fireEvent.click(helpRow(label)); expect(screen.getByTestId('location').textContent).toBe(path);
  });
  it('hides Your requests when none exist', () => { mount(); expect(screen.queryByRole('button', { name: /^Your requests/ })).toBeNull(); });
  it('counts one open request and navigates to requests', () => {
    requests('open', 'resolved'); mount(); expect(helpRow('Your requests')).toHaveTextContent('1 open');
    fireEvent.click(helpRow('Your requests')); expect(screen.getByTestId('location').textContent).toBe('/manage/requests');
  });
  it('includes in-progress requests in the open count', () => { requests('open', 'in_progress', 'closed'); mount(); expect(helpRow('Your requests')).toHaveTextContent('2 open'); });
  it('shows None open when all requests are resolved or closed', () => { requests('resolved', 'closed'); mount(); expect(helpRow('Your requests')).toHaveTextContent('None open'); });
  it('hides Your requests while loading even with cached rows', () => { requests('open'); h.loading = true; mount(); expect(screen.queryByRole('button', { name: /^Your requests/ })).toBeNull(); });
  it('hides Your requests on error even with cached rows', () => { requests('open'); h.error = new Error('refused'); mount(); expect(screen.queryByRole('button', { name: /^Your requests/ })).toBeNull(); });
  it('opens the existing sign-out confirmation without signing out automatically', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: /^Sign out$/ }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument(); expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })).toBeInTheDocument(); expect(h.logout).not.toHaveBeenCalled();
  });
  it('delegates Delete account to the existing initiateDelete', () => { mount(); fireEvent.click(screen.getByRole('button', { name: /^Delete account$/ })); expect(h.initiateDelete).toHaveBeenCalledTimes(1); });
  it('has no leading icons in Account or Help, only a trailing chevron', () => {
    mount(); for (const card of ['settings-account', 'settings-help']) for (const row of within(screen.getByTestId(card)).getAllByRole('button')) {
      expect(row.firstElementChild).toHaveClass('ep-row-label'); expect(row.querySelectorAll('svg')).toHaveLength(1); expect(row.lastElementChild).toHaveClass('ep-row-chev');
    }
  });
  it('uses quiet end-card paint with red delete text and dim group labels', () => {
    const { container } = mount(); const css = readFileSync('src/features/edit-profile/edit-profile.css', 'utf8');
    expect(css).toContain('--ep-settings-danger:#FF6B60'); expect(css).toContain('.ep-settings-end .ep-settings-delete{color:var(--ep-settings-danger)}');
    expect(css).toContain('color:var(--ep-dim);margin:22px 4px 8px'); expect(css).toContain('.ep-settings .ep-row-value.ph{color:var(--ep-dim)}');
    expect(screen.getByRole('button', { name: /^Delete account$/ }).firstElementChild).toHaveClass('ep-settings-delete');
    expect(container.querySelector('.ep-settings-end')?.querySelector('svg')).toBeNull();
    for (const group of container.querySelectorAll('.ep-group')) expect(group.getAttribute('style')).toBeNull();
  });
});