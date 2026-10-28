import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PERSONAL_COVER_ASPECT, PERSONAL_COVER_ASPECT_CSS } from '@/lib/tokens/coverAspect';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
  profile: null as Record<string, unknown> | null,
  save: vi.fn(async (_f: unknown, _o: unknown): Promise<boolean | 'username_taken'> => true),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.user, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile, loading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useProfileSave', () => ({ useProfileSave: () => ({ save: h.save, isSaving: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/components/settings/SettingsTabContent', () => ({ SettingsTabContent: () => <div data-testid="settings-tab-content" /> }));
vi.mock('@/components/skeletons/ManagePageSkeleton', () => ({ ManagePageSkeleton: () => <div data-testid="skeleton" /> }));
vi.mock('@/components/profile/edit-v2/ImageCropperModal', () => ({ getCroppedImg: vi.fn(async () => new Blob(['c'], { type: 'image/jpeg' })) }));
vi.mock('react-easy-crop', () => ({ default: (p: { aspect: number; onCropComplete: (a: unknown, b: unknown) => void }) => <div data-testid="crop" data-aspect={p.aspect}><button onClick={() => p.onCropComplete({}, { x: 0, y: 0, width: 10, height: 10 })}>Position</button></div> }));

import EditProfile from '@/pages/EditProfile';

const base = { id: 'me', display_name: 'Benjamin Holmes', username: 'benjaminholmes', city: 'London', home_club: 'Sundridge Park', manual_handicap_index: 1.5, eg_handicap_index: null, header_photo_url: null, profile_photo_url: null, has_completed_onboarding: true };
const mount = (path = '/edit-profile-v2') => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/edit-profile-v2" element={<EditProfile />} /></Routes></MemoryRouter>);
beforeEach(() => { h.user = { id: 'me' }; h.profile = { ...base }; h.save.mockReset(); h.save.mockResolvedValue(true); URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn(); });
afterEach(() => cleanup());

async function cropAndUse(kind: 'cover' | 'avatar') {
  fireEvent.change(screen.getByTestId(`ep-${kind}-picker`), { target: { files: [new File(['a'], 'a.png', { type: 'image/png' })] } });
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(screen.getByRole('button', { name: 'Position' }));
  return dialog;
}

describe('EP1 frame', () => {
  it('signed in renders the card; signed out renders no card', () => {
    mount(); expect(screen.getByTestId('ep-card')).toBeInTheDocument(); cleanup();
    h.user = null; h.profile = null; mount(); expect(screen.queryByTestId('ep-card')).toBeNull();
  });
  it('bottom nav hides and chrome registry has an exact entry', () => {
    expect(readFileSync('src/components/GlobalBottomNavigation.tsx', 'utf8')).toMatch(/HIDDEN_ROUTES = \[[^\]]*'\/edit-profile-v2'/);
    expect(readFileSync('src/features/chrome-v2/registry.ts', 'utf8')).toMatch(/exact: '\/edit-profile-v2' \},\s+spec: \{ chrome: 'none'/);
  });
  it('tabs switch and Settings renders SettingsTabContent', () => {
    mount(); expect(screen.queryByTestId('settings-tab-content')).toBeNull();
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(screen.getByTestId('settings-tab-content')).toBeInTheDocument();
    expect(screen.queryByTestId('ep-card')).toBeNull();
  });
  it('?tab=settings opens Settings', () => { mount('/edit-profile-v2?tab=settings'); expect(screen.getByTestId('settings-tab-content')).toBeInTheDocument(); });
  it('/edit-profile still routes to ManageProfile', () => {
    expect(readFileSync('src/App.tsx', 'utf8')).toMatch(/path="\/edit-profile" element=\{<Suspense fallback=\{<ManagePageSkeleton \/>\}><ManageProfilePage \/>/);
  });
});

describe('EP1 card', () => {
  it('shows name, username and city, and the cover at the personal aspect', () => {
    mount();
    expect(screen.getByTestId('ep-name').textContent).toBe('Benjamin Holmes');
    expect(screen.getByTestId('ep-line').textContent).toBe('@benjaminholmes · London');
    expect(screen.getByTestId('ep-cover').style.aspectRatio).toBe(PERSONAL_COVER_ASPECT_CSS);
  });
  it('username alone without a city', () => { h.profile = { ...base, city: '' }; mount(); expect(screen.getByTestId('ep-line').textContent).toBe('@benjaminholmes'); });
  it('index tag only with an index', () => {
    mount(); expect(screen.getByTestId('ep-index-tag').querySelector('b')?.textContent).toBe('1.5'); cleanup();
    h.profile = { ...base, manual_handicap_index: null }; mount(); expect(screen.queryByTestId('ep-index-tag')).toBeNull();
  });
  it('home club tag only with a club', () => {
    mount(); expect(screen.getByTestId('ep-club-tag').textContent).toBe('Sundridge Park'); cleanup();
    h.profile = { ...base, home_club: null }; mount(); expect(screen.queryByTestId('ep-club-tag')).toBeNull();
  });
});

describe('EP1 photos', () => {
  it('empty cover opens the square frame at the cover aspect and saves only the header', async () => {
    let resolve!: (v: boolean) => void; h.save.mockImplementation(() => new Promise(r => { resolve = r; }));
    mount(); const dialog = await cropAndUse('cover');
    expect(dialog).toHaveAttribute('data-frame-shape', 'square');
    expect(screen.getByTestId('crop')).toHaveAttribute('data-aspect', String(PERSONAL_COVER_ASPECT));
    fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    const [formArg, opts] = h.save.mock.calls[0] as [{ headerPhotoBlob: unknown; profilePhotoBlob: unknown }, unknown];
    expect(opts).toEqual({ photoField: 'header' });
    expect(formArg.headerPhotoBlob).toBeInstanceOf(File); expect(formArg.profilePhotoBlob).toBeNull();
    expect(screen.getByTestId('ep-saved')).toHaveAttribute('data-state', 'saving');
    resolve(true);
    await waitFor(() => expect(screen.getByTestId('ep-saved')).toHaveAttribute('data-state', 'idle'));
  });
  it('empty avatar opens the squircle frame and saves only the profile photo', async () => {
    mount(); const dialog = await cropAndUse('avatar');
    expect(dialog).toHaveAttribute('data-frame-shape', 'squircle');
    fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ profilePhotoBlob: expect.any(File), headerPhotoBlob: null }), { photoField: 'profile' }));
  });
  it('a failed save shows the retry line and retrying saves again', async () => {
    h.save.mockResolvedValueOnce(false);
    mount(); await cropAndUse('avatar'); fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    const line = await waitFor(() => { const el = screen.getByTestId('ep-saved'); expect(el).toHaveAttribute('data-state', 'error'); return el; });
    expect(line.tagName).toBe('BUTTON');
    fireEvent.click(line);
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('ep-saved')).toHaveAttribute('data-state', 'idle'));
  });
  it('a filled cover opens change-or-remove and remove saves the cleared header', async () => {
    h.profile = { ...base, header_photo_url: 'https://x/c.jpg' }; mount();
    fireEvent.click(screen.getByTestId('ep-cover'));
    expect(screen.getByTestId('ep-photo-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose another photo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove cover photo' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ headerPhotoUrl: null, headerPhotoBlob: null }), { photoField: 'header' }));
  });
  it('a filled avatar offers Remove photo and saves the cleared profile photo', async () => {
    h.profile = { ...base, profile_photo_url: 'https://x/a.jpg' }; mount();
    fireEvent.click(screen.getByTestId('ep-avatar'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
    await waitFor(() => expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ profilePhotoUrl: null, profilePhotoBlob: null }), { photoField: 'profile' }));
  });
});
