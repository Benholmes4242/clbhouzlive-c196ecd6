import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import type { ProfileFormData } from '@/components/profile/profile-wizard/types';
import type { WhsConnection } from '@/lib/whs/types';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  picker: vi.fn(), save: vi.fn(async (_f: unknown, _p: unknown) => true),
  home: { state: 'none', pendingName: null } as { state: string; pendingName: string | null },
  top: [] as { course_id: string }[], coach: null as Record<string, unknown> | null,
  update: vi.fn(), insert: vi.fn(), del: vi.fn(), from: vi.fn(),
}));
vi.mock('@/features/home-club/homeClubPickerStore', () => ({ openHomeClubPicker: h.picker }));
vi.mock('@/features/home-club/useHomeClubStatus', () => ({ useHomeClubStatus: () => h.home }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: h.top }) }));
vi.mock('@/features/coach/hooks', () => ({ useMyCoach: () => ({ data: h.coach, isSuccess: true, isError: false }), useInvalidateCoach: () => vi.fn(), useCoachHandicap: () => ({ current: 1, loading: false }), coachRpc: vi.fn() }));
vi.mock('@/components/profile/courses/AddCourseModal', () => ({ AddCourseModal: ({ onClose, userId, initialTab }: { onClose: () => void; userId: string; initialTab: string }) => <div data-testid="top-editor" data-user={userId} data-tab={initialTab}><button onClick={() => { h.top = [{ course_id: 'a' }, { course_id: 'b' }]; onClose(); }}>Finish editor</button></div> }));
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  h.from(table);
  const chain = { select: () => chain, eq: () => chain, not: () => chain, order: () => chain, limit: () => chain, maybeSingle: async () => ({ data: { region: 'Bromley', sub_country: 'Kent' }, error: null }), single: async () => ({ data: { id: 'me' }, error: null }), update: (p: unknown) => { h.update(p); return chain; }, insert: (p: unknown) => { h.insert(p); return chain; }, delete: () => { h.del(table); return chain; }, then: (r: (v: unknown) => unknown) => r({ data: [], error: null }) };
  return chain;
} } }));

import { EditProfileGolf, type GolfPatch } from '@/features/edit-profile/EditProfileGolf';
import { useProfileSave } from '@/hooks/useProfileSave';
import { syncLabel, validOwnHandicap } from '@/features/edit-profile/golfRules';

const form: ProfileFormData = { displayName: 'Ben', username: 'ben', firstName: 'Ben', lastName: 'Holmes', bio: '', city: '', country: '', gender: 'male', profilePhotoUrl: null, headerPhotoUrl: null, profilePhotoBlob: null, headerPhotoBlob: null, homeClubName: '', primaryClubId: null, additionalClubs: [], handicapIndex: '', homeClubVisibility: 'private', additionalClubsVisibility: 'friends', topTenVisibility: 'private', isPublic: false, websites: [], instagramHandle: '', twitterHandle: '', tiktokHandle: '', youtubeHandle: '' };
const connection: WhsConnection = { id: 'whs', passport_id: 1, membership_number: '123', last_synced_at: '2026-10-29T08:00:00Z', last_sync_status: 'success', last_sync_error: null, consecutive_failures: 0, initial_sync_complete: true, created_at: '2026-01-01', provider: 'england_golf' };
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
const mount = (patch: GolfPatch = {}, conn: WhsConnection | null = null, eg: number | null = null, manual: number | null = null) => render(<Routes><Route path="/" element={<EditProfileGolf userId="me" form={{ ...form, ...patch }} connection={conn} egHandicapIndex={eg} manualHandicapIndex={manual} onSave={h.save} />} /><Route path="/manage/handicap" element={<div data-testid="manage-handicap" />} /></Routes>, { wrapper });
const open = (key: string) => { const row = screen.getByTestId('ep-golf').querySelector(`[data-row="${key}"]`); if (!row) throw new Error(`Missing ${key}`); fireEvent.click(row); };
const choose = async (id: string, name: string) => { const args = h.picker.mock.calls.at(-1)?.[0] as { onSelected: (club: { id: string; name: string }) => void }; args.onSelected({ id, name }); await waitFor(() => expect(h.save).toHaveBeenCalled()); };
beforeEach(() => { vi.clearAllMocks(); h.home = { state: 'none', pendingName: null }; h.top = []; h.coach = null; h.save.mockResolvedValue(true); });
afterEach(cleanup);

describe('EP3 golf', () => {
  it('connected resolution never uses a stale manual figure', () => { mount({}, connection, 1.5, 20); expect(screen.getByTestId('ep-golf-handicap').textContent?.startsWith('1.5')).toBe(true); });
  it('connected unknown does not fall back to manual', () => { mount({}, connection, null, 20); expect(screen.getByTestId('ep-golf-handicap').textContent).not.toContain('20'); });
  it('disconnected resolution uses manual', () => { mount({}, null, 1.5, 14.2); expect(screen.getByTestId('ep-golf-handicap').textContent?.startsWith('14.2')).toBe(true); });
  it('no handicap has no numeric value', () => { mount(); expect(screen.getByTestId('ep-golf-handicap').textContent).not.toMatch(/\d/); });
  it('connected sheet has no input and Done does not save', () => { mount({}, connection, 1.5); open('handicap'); expect(within(screen.getByTestId('ep-sheet-handicap')).queryByRole('textbox')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Done' })); expect(h.save).not.toHaveBeenCalled(); });
  it('disconnected Connect navigates to manage handicap', () => { mount(); open('handicap'); fireEvent.click(screen.getByRole('button', { name: 'Connect' })); expect(screen.getByTestId('manage-handicap')).toBeInTheDocument(); });
  it('Done saves a manual figure', async () => { mount(); open('handicap'); fireEvent.change(screen.getByRole('textbox'), { target: { value: '14.2' } }); fireEvent.click(screen.getByRole('button', { name: 'Done' })); await waitFor(() => expect(h.save).toHaveBeenCalledWith('handicap', { handicapIndex: '14.2' })); });
  it('Done clears the manual figure', async () => { mount({ handicapIndex: '14.2' }, null, null, 14.2); open('handicap'); fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } }); fireEvent.click(screen.getByRole('button', { name: 'Done' })); await waitFor(() => expect(h.save).toHaveBeenCalledWith('handicap', { handicapIndex: '' })); });
  it('pending home club displays its pending name', () => { h.home = { state: 'pending', pendingName: 'New Club' }; mount(); expect(screen.getByTestId('ep-golf-homeClub').textContent).toContain('New Club'); });
  it('home club selection saves name and primary id together', async () => { mount(); open('homeClub'); expect(h.picker).toHaveBeenCalledWith(expect.objectContaining({ keyboardSearch: true })); await choose('park', 'Park Golf Club'); expect(h.save).toHaveBeenCalledWith('homeClub', { homeClubName: 'Park Golf Club', primaryClubId: 'park' }); });
  it('other clubs row has the first name and additional count', () => { mount({ additionalClubs: [{ id: 'a', clubId: 'a', name: 'Shortlands' }, { id: 'b', clubId: 'b', name: 'Park' }] }); expect(screen.getByTestId('ep-golf-additionalClubs').textContent).toBe('Shortlands +1'); });
  it('adding an other club saves independently', async () => { mount(); open('additionalClubs'); fireEvent.click(screen.getByRole('button', { name: 'Add a club' })); await choose('park', 'Park'); expect(h.save).toHaveBeenCalledWith('additionalClubs', { additionalClubs: [{ id: 'park', clubId: 'park', name: 'Park' }] }); });
  it('removing an other club saves independently', async () => { mount({ additionalClubs: [{ id: 'a', clubId: 'a', name: 'Shortlands' }] }); open('additionalClubs'); fireEvent.click(screen.getByRole('button', { name: 'Remove Shortlands' })); await waitFor(() => expect(h.save).toHaveBeenCalledWith('additionalClubs', { additionalClubs: [] })); });
  it('coach opens the existing find sheet', async () => { mount(); open('coach'); await waitFor(() => expect(document.querySelector('[data-coach-find]')).not.toBeNull()); });
  it('named coach uses the existing manage sheet', async () => { h.coach = { link_id: 'link', business_id: 'coach', name: 'Coach Park', started_at: '2026-01-01', show_on_profile: true, share_name: false }; mount(); open('coach'); await waitFor(() => expect(document.querySelector('[data-coach-manage]')).not.toBeNull()); });
  it('Top 10 opens profile editor and refreshes on close', () => { mount(); open('topTen'); expect(screen.getByTestId('top-editor')).toHaveAttribute('data-user', 'me'); expect(screen.getByTestId('top-editor')).toHaveAttribute('data-tab', 'manage'); fireEvent.click(screen.getByRole('button', { name: 'Finish editor' })); expect(screen.getByTestId('ep-golf-topTen').textContent).toContain('2 of 10'); });
});

describe('EP3 isolated real save payloads', () => {
  it.each([['14.2', 14.2], ['', null], ['+1.8', -1.8]] as const)('manual %s saves only manual index', async (value, stored) => { const { result } = renderHook(() => useProfileSave('me'), { wrapper }); await result.current.save({ ...form, handicapIndex: value }, { profileFields: 'handicap' }); expect(h.update).toHaveBeenCalledWith({ manual_handicap_index: stored, updated_at: expect.any(String) }); expect(h.del).not.toHaveBeenCalled(); });
  it('connected manual save is refused', async () => { const { result } = renderHook(() => useProfileSave('me'), { wrapper }); expect(await result.current.save(form, { profileFields: 'handicap', hasWhsConnection: true })).toBe(false); expect(h.update).not.toHaveBeenCalled(); });
  it('home save contains both fields and no visibility', async () => { const { result } = renderHook(() => useProfileSave('me'), { wrapper }); await result.current.save({ ...form, homeClubName: 'Park', primaryClubId: 'park' }, { profileFields: 'homeClub' }); expect(h.update).toHaveBeenCalledWith({ home_club: 'Park', primary_club_id: 'park', updated_at: expect.any(String) }); expect(h.del).not.toHaveBeenCalled(); });
  it('other clubs save memberships only, without profile/visibility writes', async () => { const { result } = renderHook(() => useProfileSave('me'), { wrapper }); await result.current.save({ ...form, additionalClubs: [{ id: 'a', clubId: 'park', name: 'Park' }] }, { profileFields: 'additionalClubs' }); expect(h.del).toHaveBeenCalledWith('user_home_clubs'); expect(h.insert).toHaveBeenCalledWith([{ user_profile_id: 'me', club_id: 'park' }]); expect(h.update).not.toHaveBeenCalled(); });
});

describe('EP3 existing limits and sync time', () => {
  it('standard range remains 0–54', () => { expect(validOwnHandicap('54')).toBe(true); expect(validOwnHandicap('54.1')).toBe(false); });
  it('plus range remains through +10', () => { expect(validOwnHandicap('+10')).toBe(true); expect(validOwnHandicap('+10.1')).toBe(false); });
  it('empty clears and malformed figures cannot save', () => { expect(validOwnHandicap('')).toBe(true); expect(validOwnHandicap('1.2.3')).toBe(false); });
  it('today uses time and previous days use date', () => { const now = new Date(2026, 9, 29, 12); expect(syncLabel(new Date(2026, 9, 29, 8).toISOString(), now)).toBe('synced 08:00'); expect(syncLabel(new Date(2026, 9, 28, 8).toISOString(), now)).toBe('synced 28 Oct'); });
  it('ManageProfile remains independent', () => { expect(readFileSync('src/pages/ManageProfile.tsx', 'utf8')).not.toContain('EditProfileGolf'); });
});