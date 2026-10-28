import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  profile: null as Record<string, unknown> | null,
  save: vi.fn(async (_f: unknown, _o: unknown): Promise<boolean | 'username_taken'> => true),
  takenCount: 0,
  rpc: vi.fn(async (_n: string, _a: unknown): Promise<{ data: unknown; error: unknown }> => ({ data: { ok: true }, error: null })),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile, loading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useProfileSave', () => ({ useProfileSave: () => ({ save: h.save, isSaving: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/components/settings/SettingsTabContent', () => ({ SettingsTabContent: () => <div data-testid="settings-tab-content" /> }));
vi.mock('@/components/skeletons/ManagePageSkeleton', () => ({ ManagePageSkeleton: () => <div data-testid="skeleton" /> }));
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = { select: () => chain, eq: () => chain, in: () => chain, order: () => chain, ilike: () => chain, then: (r: (v: unknown) => unknown) => r({ data: [], error: null }), neq: async () => ({ count: h.takenCount, error: null }) };
  return { supabase: { from: () => chain, rpc: (n: string, a: unknown) => h.rpc(n, a) } };
});

import EditProfile from '@/pages/EditProfile';
import { renamedProfilePath, resolvePreviousUsername } from '@/lib/profile/previousUsername';

const base = { id: 'me', display_name: 'Benjamin Holmes', first_name: 'Benjamin', last_name: 'Holmes', username: 'benjaminholmes', username_changed_at: null, bio: 'Golf, every minute.', city: 'London', country: 'England', gender: 'male', home_club: 'Sundridge Park', manual_handicap_index: 1.5, eg_handicap_index: null, header_photo_url: null, profile_photo_url: null, has_completed_onboarding: true };
const mount = () => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/edit-profile-v2']}><Routes><Route path="/edit-profile-v2" element={<EditProfile />} /></Routes></MemoryRouter></QueryClientProvider>);
const open = (row: string) => fireEvent.click(screen.getByTestId('ep-you').querySelector(`[data-row="${row}"]`)!);
beforeEach(() => { h.profile = { ...base }; h.save.mockReset(); h.save.mockResolvedValue(true); h.takenCount = 0; h.rpc.mockReset(); h.rpc.mockResolvedValue({ data: { ok: true, username: 'benholmes' }, error: null }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('EP2 You group', () => {
  it('rows show the stored values', () => {
    mount();
    expect(screen.getByTestId('ep-row-name').textContent).toBe('Benjamin Holmes');
    expect(screen.getByTestId('ep-row-username').textContent).toBe('@benjaminholmes');
    expect(screen.getByTestId('ep-row-bio').textContent).toBe('Golf, every minute.');
    expect(screen.getByTestId('ep-row-location').textContent).toBe('London, England');
    expect(screen.getByTestId('ep-row-gender').textContent).toBe('Male');
  });
  it('empty values show the prompts; location shows either part alone', () => {
    h.profile = { ...base, bio: '', city: '', country: 'England', gender: null }; mount();
    expect(screen.getByTestId('ep-row-bio')).toHaveClass('ph');
    expect(screen.getByTestId('ep-row-bio').textContent).toBe('Add a bio');
    expect(screen.getByTestId('ep-row-location').textContent).toBe('England');
    expect(screen.getByTestId('ep-row-gender').textContent).toBe('Choose'); cleanup();
    h.profile = { ...base, city: '', country: '' }; mount();
    expect(screen.getByTestId('ep-row-location').textContent).toBe('Add your town');
  });
  it('each row opens its sheet', () => {
    mount();
    for (const r of ['name', 'username', 'bio', 'location', 'gender']) {
      open(r); expect(screen.getByTestId(`ep-sheet-${r}`)).toBeInTheDocument();
      fireEvent.click(document.querySelector('.bizc-sheet-scrim')!);
      expect(screen.queryByTestId(`ep-sheet-${r}`)).toBeNull();
    }
  });
});

describe('EP2 Name', () => {
  it('toggle starts off when the display name is first + last, and Golfers see follows it', () => {
    mount(); open('name');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('ep-shown').querySelector('b')?.textContent).toBe('Benjamin Holmes');
    fireEvent.change(screen.getByLabelText('First'), { target: { value: 'Ben' } });
    expect(screen.getByTestId('ep-shown').querySelector('b')?.textContent).toBe('Ben Holmes');
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Benny' } });
    expect(screen.getByTestId('ep-shown').querySelector('b')?.textContent).toBe('Benny');
    expect(screen.getByTestId('ep-display-count').textContent).toBe('5/50');
  });
  it('toggle starts on for a differing display name', () => {
    h.profile = { ...base, display_name: 'Benny H' }; mount(); open('name');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect((screen.getByLabelText('Display name') as HTMLInputElement).value).toBe('Benny H');
  });
  it('Save writes the three fields in one partial save and closes', async () => {
    mount(); open('name');
    fireEvent.change(screen.getByLabelText('Last'), { target: { value: 'Holm' } });
    fireEvent.click(within(screen.getByTestId('ep-sheet-name')).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    const [f, o] = h.save.mock.calls[0] as [{ firstName: string; lastName: string; displayName: string }, unknown];
    expect(o).toEqual({ profileFields: 'name' });
    expect([f.firstName, f.lastName, f.displayName]).toEqual(['Benjamin', 'Holm', 'Benjamin Holm']);
    await waitFor(() => expect(screen.queryByTestId('ep-sheet-name')).toBeNull());
    expect(screen.getByTestId('ep-row-name').textContent).toBe('Benjamin Holm');
  });
  it('empty first name cannot save; a failed save keeps the sheet open with the retry line', async () => {
    mount(); open('name');
    fireEvent.change(screen.getByLabelText('First'), { target: { value: ' ' } });
    expect(within(screen.getByTestId('ep-sheet-name')).getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('First'), { target: { value: 'Ben' } });
    h.save.mockResolvedValueOnce(false);
    fireEvent.click(within(screen.getByTestId('ep-sheet-name')).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByTestId('ep-saved')).toHaveAttribute('data-state', 'error'));
    expect(screen.getByTestId('ep-sheet-name')).toBeInTheDocument();
  });
});

describe('EP2 Username', () => {
  const type = async (v: string) => { fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), { target: { value: v } }); await act(async () => { await new Promise(r => setTimeout(r, 450)); }); };
  const saveBtn = () => within(screen.getByTestId('ep-sheet-username')).queryByRole('button', { name: 'Save' });
  it('availability: available enables Save; taken and invalid show the setup messages', async () => {
    mount(); open('username');
    expect(saveBtn()).toBeDisabled();
    await type('BenHolmes');
    expect((screen.getByRole('textbox', { name: 'Username' }) as HTMLInputElement).value).toBe('benholmes');
    expect(screen.getByTestId('ep-available')).toBeInTheDocument();
    expect(saveBtn()).not.toBeDisabled();
    h.takenCount = 1; await type('taken1');
    expect(screen.getByTestId('ep-username-error')).toHaveAttribute('data-reason', 'taken');
    expect(saveBtn()).toBeDisabled();
    await type('a!');
    expect(screen.getByTestId('ep-username-error')).toHaveAttribute('data-reason', 'invalid');
  });
  it('input follows the setup rules', () => {
    mount(); open('username'); const i = screen.getByRole('textbox', { name: 'Username' });
    expect(i).toHaveAttribute('autocapitalize', 'none'); expect(i).toHaveAttribute('autocorrect', 'off'); expect(i).toHaveAttribute('spellcheck', 'false'); expect(i).toHaveAttribute('maxlength', '30');
  });
  it('ok calls change_username, closes and updates the card and the row', async () => {
    mount(); open('username'); await type('benholmes');
    fireEvent.click(saveBtn()!);
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('change_username', { p_username: 'benholmes' }));
    await waitFor(() => expect(screen.queryByTestId('ep-sheet-username')).toBeNull());
    expect(screen.getByTestId('ep-row-username').textContent).toBe('@benholmes');
    expect(screen.getByTestId('ep-line').textContent).toBe('@benholmes · London');
  });
  it.each([['taken', 'taken'], ['invalid', 'invalid']])('reason %s maps to its message', async (reason, shown) => {
    h.rpc.mockResolvedValue({ data: { ok: false, reason }, error: null });
    mount(); open('username'); await type('benholmes'); fireEvent.click(saveBtn()!);
    await waitFor(() => expect(screen.getByTestId('ep-username-error')).toHaveAttribute('data-reason', shown));
    expect(screen.getByTestId('ep-sheet-username')).toBeInTheDocument();
  });
  it('reason too_soon switches to the too-soon state', async () => {
    h.rpc.mockResolvedValue({ data: { ok: false, reason: 'too_soon', next_change_at: new Date(Date.now() + 10 * 86_400_000).toISOString() }, error: null });
    mount(); open('username'); await type('benholmes'); fireEvent.click(saveBtn()!);
    await waitFor(() => expect(saveBtn()).toBeNull());
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveAttribute('readonly');
  });
  it('too-soon state shows both en-GB dates, no action and a read-only field', () => {
    const at = new Date(Date.now() - 2 * 86_400_000);
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    h.profile = { ...base, username_changed_at: at.toISOString() }; mount(); open('username');
    const sheet = screen.getByTestId('ep-sheet-username');
    expect(sheet.querySelector('.bizc-sheet-sub')?.textContent).toBe(`You changed it on ${fmt(at)}. You can change it again on ${fmt(new Date(at.getTime() + 30 * 86_400_000))}.`);
    expect(sheet.querySelector('.bizc-sheet-done')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Username' })).toHaveAttribute('readonly');
    expect(sheet.querySelector('.ep-username')).toHaveAttribute('data-soon', 'true');
  });
  it('a change older than 30 days is allowed', () => {
    h.profile = { ...base, username_changed_at: new Date(Date.now() - 31 * 86_400_000).toISOString() }; mount(); open('username');
    expect(saveBtn()).toBeInTheDocument();
  });
});

describe('EP2 old username links', () => {
  it('resolves through resolve_previous_username', async () => {
    h.rpc.mockResolvedValue({ data: 'benholmes', error: null });
    expect(await resolvePreviousUsername('benjaminholmes')).toBe('benholmes');
    expect(h.rpc).toHaveBeenCalledWith('resolve_previous_username', { p_username: 'benjaminholmes' });
    h.rpc.mockResolvedValue({ data: null, error: null });
    expect(await resolvePreviousUsername('nobody')).toBeNull();
    h.rpc.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await resolvePreviousUsername('nobody')).toBeNull();
  });
  it('keeps the sub-path, query and hash', () => {
    expect(renamedProfilePath('/profile/old/followers', 'old', 'new', '?a=1', '#x')).toBe('/profile/new/followers?a=1#x');
    expect(renamedProfilePath('/profile/old', 'old', 'new')).toBe('/profile/new');
  });
  it('ProfilePageV2 redirects with replace through the helper when the name is not found', () => {
    const src = readFileSync('src/pages/ProfilePageV2.tsx', 'utf8');
    expect(src).toContain('resolvePreviousUsername(routeUsername!)');
    expect(src).toMatch(/navigate\(renamedProfilePath\(location\.pathname, routeUsername, renamedTo, location\.search, location\.hash\), \{ replace: true \}\)/);
  });
});

describe('EP2 Bio, Location, Gender', () => {
  it('bio counter and 300 limit; Done saves bio', async () => {
    mount(); open('bio');
    const ta = screen.getByRole('textbox', { name: 'Bio' }) as HTMLTextAreaElement;
    expect(ta).toHaveAttribute('maxlength', '300');
    expect(screen.getByTestId('ep-bio-count').textContent).toBe('19 / 300');
    fireEvent.change(ta, { target: { value: 'x'.repeat(320) } });
    expect(screen.getByTestId('ep-bio-count').textContent).toBe('300 / 300');
    fireEvent.click(within(screen.getByTestId('ep-sheet-bio')).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ bio: 'x'.repeat(300) }), { profileFields: 'bio' }));
  });
  it('location Done saves country and city together', async () => {
    mount(); open('location');
    fireEvent.click(screen.getByLabelText('Clear town or city'));
    fireEvent.click(within(screen.getByTestId('ep-sheet-location')).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ country: 'England', city: '' }), { profileFields: 'location' }));
    await waitFor(() => expect(screen.getByTestId('ep-row-location').textContent).toBe('England'));
  });
  it('gender saves on tap and closes', async () => {
    mount(); open('gender');
    expect(screen.getByRole('radio', { name: 'Male' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Female' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ gender: 'female' }), { profileFields: 'gender' }));
    await waitFor(() => expect(screen.queryByTestId('ep-sheet-gender')).toBeNull());
    expect(screen.getByTestId('ep-row-gender').textContent).toBe('Female');
  });
});

describe('EP2 leaves /edit-profile alone', () => {
  it('ManageProfile does not import the new You group', () => {
    const src = readFileSync('src/pages/ManageProfile.tsx', 'utf8');
    expect(src).not.toContain('EditProfileYou');
    expect(src).toContain('<LocationSection');
    expect(src).not.toContain('appearance="card"');
  });
});
