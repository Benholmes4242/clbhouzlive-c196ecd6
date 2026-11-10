import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
const h = vi.hoisted(() => ({ update: vi.fn(), track: vi.fn(), toast: vi.fn(), error: false, creator: false }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me', user_metadata: {} }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me', first_name: 'Ellie', last_name: 'Skoog', is_creator: h.creator }, loading: false, isError: false }) }));
vi.mock('@/hooks/useCourseSearch', () => ({ useCourseSearch: () => ({ data: [], loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: vi.fn() }));
vi.mock('@/lib/whs/hooks', () => ({ whsKeys: { percentile: (id: string) => ['percentile', id] }, useWhsConnection: () => ({ data: null, isSuccess: true }) }));
vi.mock('@/features/onboarding/WelcomeGolfers', () => ({ WelcomeGolfers: () => null }));
vi.mock('@/features/onboarding/WelcomeHandicap', () => ({ WelcomeHandicap: () => null }));
vi.mock('@/features/onboarding/WelcomeFirstLook', () => ({ WelcomeFirstLook: () => null }));
vi.mock('@/features/onboarding/WelcomeCourseCard', () => ({ WelcomeCourseCard: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(h.toast, { error: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const c = { update: (v: unknown) => { h.update(v); return c; }, select: () => c, eq: () => c, ilike: () => c, neq: async () => ({ count: 0, error: null }), single: async () => h.error ? { data: null, error: new Error('Refused') } : { data: { id: 'me' }, error: null }, then: (r: (v: unknown) => unknown) => r({ data: [], error: null }) }; return c;
} } }));
import Welcome from '@/pages/Welcome';
import { EditProfileType } from '@/features/edit-profile/EditProfileType';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useProfileForm } from '@/hooks/useProfileForm';
const form: ProfileFormData = { displayName: 'Ellie Skoog', firstName: 'Ellie', lastName: 'Skoog', username: 'ellieskoog', bio: '', country: '', city: '', gender: '', profilePhotoUrl: null, headerPhotoUrl: null, profilePhotoBlob: null, headerPhotoBlob: null, homeClubName: '', primaryClubId: null, additionalClubs: [], handicapIndex: '', homeClubVisibility: 'public', additionalClubsVisibility: 'public', topTenVisibility: 'public', websites: [], instagramHandle: '', twitterHandle: '', tiktokHandle: '', youtubeHandle: '', isPublic: true, isCreator: false };
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
function EditHarness({ initial = false }: { initial?: boolean }) {
  const { save } = useProfileSave('me'); const [stored, setStored] = useState(initial);
  return <EditProfileType isCreator={stored} onSave={async on => { const ok = await save({ ...form, isCreator: on }, { profileFields: 'creator' }); if (ok === true) { setStored(on); if (!on) h.toast('Back to a standard profile'); } return ok === true; }} />;
}
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); h.error = false; h.creator = false; });
afterEach(cleanup);
describe('CR1 creator persistence', () => {
  it('Welcome toggles locally and Continue writes creator in the identity payload', async () => {
    render(<Welcome />, { wrapper }); const toggle = await screen.findByRole('switch', { name: 'Content creator profile' });
    expect(toggle).toHaveAttribute('aria-checked', 'false'); fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true'); expect(h.update).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()); fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(h.update).toHaveBeenCalledWith({ first_name: 'Ellie', last_name: 'Skoog', display_name: 'Ellie Skoog', username: 'ellieskoog', username_is_custom: true, profile_photo_url: null, is_creator: true, updated_at: expect.any(String) }));
    expect(h.track).toHaveBeenCalledWith('creator_profile_toggled', { on: true, surface: 'welcome' });
  });
  it('Skip never writes the toggled creator choice', async () => {
    render(<Welcome />, { wrapper }); fireEvent.click(await screen.findByRole('switch', { name: 'Content creator profile' }));
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    expect(h.update).not.toHaveBeenCalled();
    expect(h.update.mock.calls.every(([v]) => !Object.prototype.hasOwnProperty.call(v, 'is_creator'))).toBe(true);
  });
  it('Welcome starts on for an existing creator', async () => { h.creator = true; render(<Welcome />, { wrapper }); await waitFor(() => expect(screen.getByRole('switch', { name: 'Content creator profile' })).toHaveAttribute('aria-checked', 'true')); });
  it('form hydration maps the creator flag and defaults missing values off', async () => {
    const { result, rerender } = renderHook(({ profile }) => useProfileForm(profile, false), { wrapper, initialProps: { profile: { id: 'me', is_creator: true } as { id: string; is_creator?: boolean } } });
    await waitFor(() => expect(result.current.form.isCreator).toBe(true)); rerender({ profile: { id: 'other' } }); await waitFor(() => expect(result.current.form.isCreator).toBe(false));
  });
  it('edit toggle writes only creator and updated_at and has no on toast', async () => {
    render(<EditHarness />, { wrapper }); fireEvent.click(screen.getByRole('switch', { name: 'Creator profile' }));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'); await waitFor(() => expect(h.update).toHaveBeenCalledWith({ is_creator: true, updated_at: expect.any(String) })); expect(h.toast).not.toHaveBeenCalled();
    expect(h.track).toHaveBeenCalledWith('creator_profile_toggled', { on: true, surface: 'edit_profile' });
  });
  it('turning off writes false and shows the standard-profile toast after success', async () => {
    render(<EditHarness initial />, { wrapper }); fireEvent.click(screen.getByRole('switch')); await waitFor(() => expect(h.toast).toHaveBeenCalledWith('Back to a standard profile')); expect(h.update).toHaveBeenCalledWith({ is_creator: false, updated_at: expect.any(String) });
  });
  it('a failed edit save reverts the switch', async () => {
    h.error = true; render(<EditHarness />, { wrapper }); fireEvent.click(screen.getByRole('switch')); expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'); await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')); expect(h.toast).not.toHaveBeenCalled();
  });
  it('successful creator saves invalidate all three viewer-scoped keys', async () => {
    const qc = new QueryClient(); const invalidate = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useProfileSave('me'), { wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider> });
    await act(async () => { await result.current.save({ ...form, isCreator: true }, { profileFields: 'creator' }); });
    for (const key of ['profile', 'user-profile', 'profile-creator']) expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: [key, 'me'] }));
  });
});
