import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ save: vi.fn(async (_field: unknown, _patch: unknown) => true), update: vi.fn(), stored: 'public', error: false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const chain = { update: (payload: Record<string, unknown>) => { h.update(payload); if (!h.error && payload.handicap_visibility) h.stored = String(payload.handicap_visibility); return chain; }, eq: () => chain, select: () => chain, single: async () => ({ data: { id: 'me' }, error: null }), then: (resolve: (v: unknown) => unknown) => resolve({ error: h.error ? new Error('refused') : null }) }; return chain;
} } }));
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', async () => {
  const { useQuery } = await import('@tanstack/react-query');
  return { useProfileData: () => { const q = useQuery({ queryKey: ['profile', 'me'], queryFn: async () => ({ id: 'me', handicap_visibility: h.stored, is_public: true }) }); return { profile: q.data, loading: q.isLoading }; } };
});
vi.mock('@/hooks/useMyBusinesses', () => ({ useHasBusinesses: () => ({ hasBusinesses: false, count: 0 }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: vi.fn() }) }));
vi.mock('@/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({}) }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), whsKeys: { percentile: (id: string) => ['whs-percentile', id] } }));
vi.mock('@/components/settings/ui', () => ({
  SettingsSkeleton: () => <div />,
  SettingsSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SettingsChevronRow: () => null, SettingsToggleRow: () => null,
  SettingsLevelRow: ({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) => title === 'Who can see your handicap' ? <div data-testid="settings-handicap" data-value={value}><button onClick={() => onChange('private')}>Settings private</button></div> : null,
}));

import { EditProfileLinksPrivacy } from '@/features/edit-profile/EditProfileLinksPrivacy';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useProfileData } from '@/hooks/useProfileData';
import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import { handicapVisibilityLabel, profileVisibilityLabel, socialsDisplay, websiteDisplay } from '@/features/edit-profile/linkPrivacyRules';
import { personalWebsiteValid } from '@/lib/profile/websiteValidation';

const form: ProfileFormData = { displayName: 'Ben', username: 'ben', firstName: 'Ben', lastName: '', bio: '', city: '', country: '', gender: '', profilePhotoUrl: null, headerPhotoUrl: null, profilePhotoBlob: null, headerPhotoBlob: null, homeClubName: '', primaryClubId: null, additionalClubs: [], handicapIndex: '', homeClubVisibility: 'public', additionalClubsVisibility: 'public', topTenVisibility: 'public', isPublic: true, websites: [], instagramHandle: '', twitterHandle: '', tiktokHandle: '', youtubeHandle: '' };
let qc: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
const mount = (patch: Partial<ProfileFormData> = {}) => render(<EditProfileLinksPrivacy userId="me" form={{ ...form, ...patch }} handicapVisibility="public" onSave={h.save} />, { wrapper });
const open = (group: 'links' | 'visibility', key: string) => {
  const row = screen.getByTestId(`ep-${group}`).querySelector(`[data-row="${key}"]`);
  if (!row) throw new Error(`Missing ${key}`);
  fireEvent.click(row);
};
beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); vi.clearAllMocks(); h.save.mockResolvedValue(true); h.stored = 'public'; h.error = false; });
afterEach(() => { cleanup(); qc.clear(); });

describe('EP4 link summaries', () => {
  it('first website trims scheme and trailing slash with additional count', () => {
    mount({ websites: [{ id: '1', url: 'https://clbhouz.co.uk/' }, { id: '2', url: 'https://second.com' }] });
    expect(screen.getByTestId('ep-links-websites').textContent).toBe('clbhouz.co.uk +1');
    expect(websiteDisplay('http://example.com///')).toBe('example.com');
  });
  it('social summary keeps the four-network order and omits empty fields', () => {
    expect(socialsDisplay({ instagramHandle: 'ben', twitterHandle: 'b', tiktokHandle: 'b', youtubeHandle: 'b' })).toBe('Instagram, X, TikTok, YouTube');
    expect(socialsDisplay({ instagramHandle: '', twitterHandle: 'b', tiktokHandle: '', youtubeHandle: 'b' })).toBe('X, YouTube');
  });
  it('both empty link values are prompt states', () => {
    mount(); expect(screen.getByTestId('ep-links-websites')).toHaveClass('ph'); expect(screen.getByTestId('ep-links-socials')).toHaveClass('ph');
  });
});
describe('EP4 Websites', () => {
  it('adds up to three and removes the add slot at the limit', () => {
    mount(); open('links', 'websites');
    for (const url of ['https://a.com', 'https://b.com', 'https://c.com']) fireEvent.change(screen.getByLabelText('Add another website'), { target: { value: url } });
    expect(screen.queryByLabelText('Add another website')).toBeNull();
    expect(within(screen.getByRole('dialog')).getAllByRole('textbox')).toHaveLength(3);
  });
  it('remove restores the empty add slot and retains the other website', () => {
    mount({ websites: [{ id: '1', url: 'https://a.com' }, { id: '2', url: 'https://b.com' }, { id: '3', url: 'https://c.com' }] }); open('links', 'websites');
    fireEvent.click(screen.getByRole('button', { name: 'Remove website 2' }));
    expect(screen.getByLabelText('Website 2')).toHaveValue('https://c.com');
    expect(screen.getByLabelText('Add another website')).toBeInTheDocument();
  });
  it('invalid URL keeps the sheet open and never saves', () => {
    mount(); open('links', 'websites'); fireEvent.change(screen.getByLabelText('Add another website'), { target: { value: 'invalid.com' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument(); expect(screen.getByRole('alert')).toBeInTheDocument(); expect(h.save).not.toHaveBeenCalled();
    expect(personalWebsiteValid('invalid.com')).toBe(false); expect(personalWebsiteValid('https://valid.com')).toBe(true);
  });
  it('Done saves only websites and closes after success', async () => {
    mount(); open('links', 'websites'); fireEvent.change(screen.getByLabelText('Add another website'), { target: { value: 'https://valid.com/' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(h.save).toHaveBeenCalledWith('websites', { websites: [{ id: expect.any(String), url: 'https://valid.com/' }] });
  });
});
describe('EP4 Socials', () => {
  it('all four fields save together with existing at-sign normalization', async () => {
    mount(); open('links', 'socials');
    for (const label of ['Instagram username', 'X username', 'TikTok username', 'YouTube channel']) fireEvent.change(screen.getByLabelText(label), { target: { value: '@ben' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith('socials', { instagramHandle: 'ben', twitterHandle: 'ben', tiktokHandle: 'ben', youtubeHandle: 'ben' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
describe('EP4 four-level choices', () => {
  it.each([['public', 'Everyone'], ['followers', 'Followers & Friends'], ['friends', 'Friends only'], ['private', 'Only me']])('maps %s to %s', (value, label) => { expect(profileVisibilityLabel(value)).toBe(label); });
  it.each(['homeClubVisibility', 'additionalClubsVisibility', 'topTenVisibility'] as const)('%s saves only its own value and closes', async key => {
    mount(); open('visibility', key); const radios = within(screen.getByRole('dialog')).getAllByRole('radio'); expect(radios).toHaveLength(4);
    fireEvent.click(radios[1]); await waitFor(() => expect(h.save).toHaveBeenCalledWith(key, { [key]: 'followers' })); expect(screen.queryByRole('dialog')).toBeNull();
  });
});
describe('EP4 existing partial writer isolation', () => {
  it('website payload contains no other user fields', async () => {
    const { result } = renderHook(() => useProfileSave('me'), { wrapper });
    await result.current.save({ ...form, websites: [{ id: 'w', url: 'https://a.com/' }] }, { profileFields: 'websites' });
    expect(h.update).toHaveBeenCalledWith({ websites: ['https://a.com/'], updated_at: expect.any(String) });
  });
  it('social payload contains exactly the four handles and timestamp', async () => {
    const { result } = renderHook(() => useProfileSave('me'), { wrapper });
    await result.current.save({ ...form, instagramHandle: '@ben ', twitterHandle: '@x ', tiktokHandle: '@tt ', youtubeHandle: '@yt ' }, { profileFields: 'socials' });
    expect(h.update).toHaveBeenCalledWith({ instagram_handle: 'ben', twitter_handle: 'x', tiktok_handle: 'tt', youtube_handle: 'yt', updated_at: expect.any(String) });
  });
  it.each([['homeClubVisibility', 'home_club_visibility'], ['additionalClubsVisibility', 'additional_clubs_visibility'], ['topTenVisibility', 'top_ten_visibility']] as const)('%s payload writes only %s', async (field, column) => {
    const { result } = renderHook(() => useProfileSave('me'), { wrapper });
    await result.current.save({ ...form, [field]: 'private' }, { profileFields: field });
    expect(h.update).toHaveBeenCalledWith({ [column]: 'private', updated_at: expect.any(String) });
  });
});
describe('EP4 handicap shares unchanged Settings source', () => {
  it.each([['public', 'Everyone'], ['friends', 'Friends'], ['private', 'Only me']])('maps handicap %s to %s', (value, label) => { expect(handicapVisibilityLabel(value)).toBe(label); });
  it('uses three choices and the existing privacy writer, never partial save', async () => {
    mount(); open('visibility', 'handicap'); const radios = within(screen.getByRole('dialog')).getAllByRole('radio'); expect(radios).toHaveLength(3);
    fireEvent.click(radios[1]); await waitFor(() => expect(h.update).toHaveBeenCalledWith({ handicap_visibility: 'friends' }));
    expect(h.save).not.toHaveBeenCalled(); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('a change in each surface reads back in the other through profile refresh', async () => {
    function Both() {
      const { profile } = useProfileData();
      return <><EditProfileLinksPrivacy userId="me" form={form} handicapVisibility={profile?.handicap_visibility === 'friends' || profile?.handicap_visibility === 'private' ? profile.handicap_visibility : 'public'} onSave={h.save} /><SettingsTabContent /></>;
    }
    render(<Both />, { wrapper }); await screen.findByTestId('settings-handicap');
    open('visibility', 'handicap'); fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('radio')[1]);
    await waitFor(() => expect(screen.getByTestId('settings-handicap')).toHaveAttribute('data-value', 'friends'));
    fireEvent.click(screen.getByRole('button', { name: 'Settings private' }));
    await waitFor(() => expect(screen.getByTestId('ep-links-handicap').textContent).toBe('Only me'));
    expect(h.update.mock.calls).toEqual([[{ handicap_visibility: 'friends' }], [{ handicap_visibility: 'private' }]]);
  });
  it('legacy ManageProfile is independent and Settings keeps the same hook', () => {
    expect(readFileSync('src/pages/ManageProfile.tsx', 'utf8')).not.toContain('EditProfileLinksPrivacy');
    expect(readFileSync('src/components/settings/SettingsTabContent.tsx', 'utf8')).toContain('onChange={privacy.setHandicapVisibilityLevel}');
  });
});