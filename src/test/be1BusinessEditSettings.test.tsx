import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import businessEditCss from '@/components/business/editor/business-edit.css?raw';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ role: 'owner', request: null as null | { status: string }, verified: false, team: [1], teamLoading: false, teamError: false, muted: [] as string[], updateError: false }));
const update = vi.hoisted(() => vi.fn());
const deleteBusiness = vi.hoisted(() => vi.fn());
const business = { id: 'b1', name: 'Sample business', category: 'Other', country: null, club_id: null, is_verified: false };
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({
  select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { notification_preferences: { muted_types: [...state.muted] } }, error: null }) }) }),
  update: (payload: unknown) => { update(payload); return { eq: async (key: string, id: string) => { update(key, id); return { error: state.updateError ? new Error('denied') : null }; } }; },
}) } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' }, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: business, isLoading: false, error: null }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: state.role }, isLoading: false }) }));
vi.mock('@/hooks/useBusinessImageUpload', () => ({ useBusinessImageUpload: () => ({ uploadLogo: vi.fn(), removeLogo: vi.fn(), uploadCover: vi.fn(), removeCover: vi.fn() }) }));
vi.mock('@/hooks/useBusinessTeam', () => ({ useBusinessTeam: () => ({ data: state.team, isLoading: state.teamLoading, isError: state.teamError }) }));
vi.mock('@/hooks/useBusinessVerificationRequest', async original => ({ ...(await original<typeof import('@/hooks/useBusinessVerificationRequest')>()), useBusinessVerificationRequest: () => ({ data: state.request }) }));
vi.mock('@/hooks/useDeleteBusiness', () => ({ useDeleteBusiness: () => ({ mutate: deleteBusiness, isPending: false }) }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), warning: vi.fn() }) }));
vi.mock('@/components/profile/edit-v2/HeaderPhotoCard', () => ({ HeaderPhotoCard: () => null }));
vi.mock('@/components/profile/edit-v2/ProfilePhotoCard', () => ({ ProfilePhotoCard: () => null }));
vi.mock('@/components/profile/edit-v2/CoverGuidance', () => ({ CoverGuidance: () => null }));
vi.mock('@/components/business/editor/IdentitySection', () => ({ IdentitySection: ({ businessName, setBusinessName }: { businessName: string; setBusinessName: (s: string) => void }) => <input aria-label="Business name" value={businessName} onChange={e => setBusinessName(e.target.value)} /> }));
vi.mock('@/components/business/editor/LocationContactSection', () => ({ LocationContactSection: () => null }));
vi.mock('@/components/business/editor/FacilitiesSection', () => ({ FacilitiesSection: () => null }));
vi.mock('@/components/business/editor/PrimaryActionSection', () => ({ PrimaryActionSection: () => null }));
vi.mock('@/components/business/editor/OpeningHoursSection', () => ({ OpeningHoursSection: () => null }));
vi.mock('@/components/business/editor/SocialSection', () => ({ SocialSection: () => null }));
vi.mock('@/components/business/PinDropModal', () => ({ PinDropModal: () => null }));
vi.mock('@/components/business/RequestAccessModal', () => ({ RequestAccessModal: () => null }));
vi.mock('@/components/business/RequestClubModal', () => ({ RequestClubModal: () => null }));
import BusinessProfileEditor from '@/pages/BusinessProfileEditor';
import { BusinessEditSettings } from '@/components/business/editor/BusinessEditSettings';
import type { BusinessRole } from '@/hooks/useBusinessTeam';

function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function wrap(node: React.ReactNode, entry = '/business/b1/edit?tab=settings') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[entry]}>{node}<Location /></MemoryRouter></QueryClientProvider>);
}
const settings = () => wrap(<div className="ep-shell"><BusinessEditSettings business={{ ...business, is_verified: state.verified }} role={state.role as BusinessRole} userId="viewer" /></div>);
const editor = (entry?: string) => wrap(<Routes><Route path="/business/:id/edit" element={<BusinessProfileEditor />} /></Routes>, entry);
beforeEach(() => { Object.assign(state, { role: 'owner', request: null, verified: false, team: [1], teamLoading: false, teamError: false, muted: [], updateError: false }); update.mockReset(); deleteBusiness.mockReset(); });
afterEach(cleanup);

describe('BE1 business editor Settings', () => {
  it('inherits the app font without a font-family declaration in business-edit.css', () => {
    expect(businessEditCss).not.toMatch(/font-family\s*:/i);
  });
  it('renders the edit frame with Profile and Settings tabs', () => {
    const v = editor('/business/b1/edit');
    expect(v.container.querySelector('.ep-title')?.textContent).toBe('Edit business');
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'false');
  });
  it('opens Settings from the query parameter', () => {
    editor(); expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument();
  });
  it('switches the query param while preserving unrelated parameters', () => {
    editor('/business/b1/edit?src=home'); fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByTestId('location').textContent).toBe('/business/b1/edit?src=home&tab=settings');
    fireEvent.click(screen.getByRole('tab', { name: 'Profile' })); expect(screen.getByTestId('location').textContent).toBe('/business/b1/edit?src=home');
  });
  it('keeps the Profile form without Notifications or the obsolete verification box', () => {
    const v = editor('/business/b1/edit'); const profile = v.container.querySelector('.be1-profile-body');
    expect(profile).not.toBeNull(); expect(screen.getByRole('button', { name: /^Name / })).toBeInTheDocument();
    expect(profile?.textContent).not.toContain('Notifications'); expect(profile?.textContent).not.toContain('Get verified');
  });
  it('preserves unsaved changes and the existing back guard across tabs', () => {
    editor('/business/b1/edit'); fireEvent.click(screen.getByRole('button', { name: /^Name / })); fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' })); fireEvent.click(screen.getByRole('tab', { name: 'Profile' }));
    expect(screen.getByRole('textbox', { name: 'Business name' })).toHaveValue('Changed');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('alertdialog', { name: 'Discard changes?' })).toBeNull();
  });
  for (const [status, title, body, pill] of [
    ['none', 'Not verified yet', 'Verified businesses carry the badge next to their name and unlock Insights.', 'Start verification'],
    ['pending', 'Verification in review', "We're checking your details. Nothing else is needed from you right now.", 'See your request'],
    ['needs_more_info', 'We need a bit more', "Add what's missing to finish verification.", 'Add details'],
    ['rejected', 'Not approved', "Your last request wasn't approved. You can see why and apply again.", 'See why'],
    ['verified', 'Verified', 'Your badge shows next to the business name across clbhouz.', null],
  ] as const) {
    it(`renders verification state ${status} with its correct action`, () => {
      state.verified = status === 'verified'; state.request = status === 'none' || status === 'verified' ? null : { status };
      const v = settings(); expect(screen.getByRole('heading', { name: title })).toBeInTheDocument(); expect(screen.getByText(body)).toBeInTheDocument();
      if (pill) { fireEvent.click(screen.getByRole('button', { name: pill })); expect(screen.getByTestId('location').textContent).toBe('/business/b1/verification'); }
      else expect(v.container.querySelector('.be1-pill')).toBeNull();
    });
  }
  it('hides the verification action for editors', () => {
    state.role = 'editor'; const v = settings(); expect(screen.getByRole('heading', { name: 'Not verified yet' })).toBeInTheDocument(); expect(v.container.querySelector('.be1-pill')).toBeNull();
  });
  it('allows admins to open verification', () => {
    state.role = 'admin'; settings(); fireEvent.click(screen.getByRole('button', { name: 'Start verification' })); expect(screen.getByTestId('location').textContent).toBe('/business/b1/verification');
  });
  it('reads all five notification types from muted_types', async () => {
    state.muted = ['like', 'dm']; settings();
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Likes' })).toBeEnabled());
    expect(screen.getAllByRole('switch')).toHaveLength(5);
    for (const name of ['Likes', 'Direct messages']) expect(screen.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'false');
    for (const name of ['Comments', 'New followers', 'Mentions']) expect(screen.getByRole('switch', { name })).toHaveAttribute('aria-checked', 'true');
  });
  it('turning a type off adds its exact key to muted_types', async () => {
    state.muted = ['dm']; settings(); const sw = screen.getByRole('switch', { name: 'Likes' }); await waitFor(() => expect(sw).toBeEnabled()); fireEvent.click(sw);
    expect(update).toHaveBeenCalledWith({ notification_preferences: { muted_types: ['dm', 'like'] } }); expect(update).toHaveBeenCalledWith('id', 'b1');
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'false'));
  });
  it('turning a type on removes only its exact key from muted_types', async () => {
    state.muted = ['like', 'dm']; settings(); const sw = screen.getByRole('switch', { name: 'Likes' }); await waitFor(() => expect(sw).toBeEnabled()); fireEvent.click(sw);
    expect(update).toHaveBeenCalledWith({ notification_preferences: { muted_types: ['dm'] } }); expect(update).toHaveBeenCalledWith('id', 'b1'); await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
  });
  it('reverts a refused notification write', async () => {
    state.updateError = true; settings(); const sw = screen.getByRole('switch', { name: 'Comments' }); await waitFor(() => expect(sw).toBeEnabled()); fireEvent.click(sw); await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
  });
  it('editors cannot change preferences and see their specific note', async () => {
    state.role = 'editor'; settings(); expect(screen.getByText('Only owners and admins can change these. They apply to every manager, in the inbox and on push.')).toBeInTheDocument();
    for (const sw of screen.getAllByRole('switch')) { expect(sw).toBeDisabled(); fireEvent.click(sw); } expect(update).not.toHaveBeenCalled();
  });
  for (const count of [1, 3]) it(`reads ${count} managers with the correct singular or plural`, () => {
    state.team = Array(count).fill(1); settings(); expect(screen.getByRole('button', { name: `Managers ${count} ${count === 1 ? 'person' : 'people'}` })).toBeInTheDocument();
  });
  it('shows no manager value on error', () => { state.teamError = true; settings(); expect(screen.getByRole('button', { name: 'Managers' })).toBeInTheDocument(); });
  it('shows no manager value while loading', () => { state.teamLoading = true; settings(); expect(screen.getByRole('button', { name: 'Managers' })).toBeInTheDocument(); });
  it('opens the team page from Managers', () => { settings(); fireEvent.click(screen.getByRole('button', { name: 'Managers 1 person' })); expect(screen.getByTestId('location').textContent).toBe('/business/b1/team'); });
  it('owners open the existing deletion dialog for this business', () => {
    settings(); fireEvent.click(screen.getByRole('button', { name: 'Delete business' })); const dialog = screen.getByRole('alertdialog', { name: 'Delete business profile?' });
    expect(within(dialog).getByText(/Sample business/)).toBeInTheDocument(); expect(within(dialog).getByRole('button', { name: 'Delete business' })).toBeInTheDocument();
  });
  for (const role of ['admin', 'editor']) it(`hides Delete business for ${role}`, () => { state.role = role; settings(); expect(screen.queryByRole('button', { name: 'Delete business' })).toBeNull(); });
});
