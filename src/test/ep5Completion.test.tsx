import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { readFileSync } from 'node:fs';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ profile: {} as Record<string, unknown>, loading: false, homeLoading: false, topLoading: false, whsLoading: false, coachSuccess: true, coachError: false, coach: null as unknown, top: [] as unknown[], pending: false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile, loading: h.loading }) }));
vi.mock('@/hooks/useProfileSave', () => ({ useProfileSave: () => ({ save: vi.fn(async () => true) }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null, isLoading: h.whsLoading }) }));
vi.mock('@/features/home-club/useHomeClubStatus', () => ({ useHomeClubStatus: () => ({ state: h.pending ? 'pending' : 'none', pendingName: h.pending ? 'Pending' : null, isLoading: h.homeLoading }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: h.top, isLoading: h.topLoading }) }));
vi.mock('@/features/coach/hooks', () => ({ useMyCoach: () => ({ data: h.coach, isSuccess: h.coachSuccess, isError: h.coachError }), useInvalidateCoach: () => vi.fn(), useCoachHandicap: () => ({ current: 1, loading: false }), coachRpc: vi.fn() }));
vi.mock('@/components/settings/SettingsTabContent', () => ({ SettingsTabContent: () => <div data-testid="settings-tab-content" /> }));
vi.mock('@/components/profile/courses/AddCourseModal', () => ({ AddCourseModal: () => <div data-testid="top-editor" /> }));
import EditProfile from '@/pages/EditProfile';
import { CompletionCard } from '@/features/edit-profile/EditProfileCompletion';
import { completionItems, type CompletionInputs } from '@/features/edit-profile/completionRules';
import { EditProfileAlias } from '@/features/edit-profile/EditProfileAlias';
import CreateProfileRedirect from '@/components/redirects/CreateProfileRedirect';
import { useEditProfileRoute } from '@/hooks/useEditProfileRoute';
const complete: CompletionInputs = { avatar: '/a.jpg', cover: '/c.jpg', bio: 'Bio', homeClub: true, pendingClub: false, handicap: 0, coach: true, topTen: 1 };
const base = { id: 'me', display_name: 'Ben', username: 'ben', bio: 'Bio', home_club: 'Club', manual_handicap_index: 0, profile_photo_url: '/a.jpg', header_photo_url: '/c.jpg' };
let qc: QueryClient;
function Location() { const l = useLocation(); return <output data-testid="location">{l.pathname}{l.search}{l.hash}</output>; }
function mount(path = '/edit-profile', back = false) {
 return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={back ? ['/origin', path] : [path]}><Location /><Routes><Route path="/edit-profile" element={<EditProfile />} /><Route path="/edit-profile-v2" element={<EditProfileAlias />} /><Route path="/create-profile" element={<CreateProfileRedirect />} /><Route path="/origin" element={<div data-testid="origin" />} /></Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); h.profile = { ...base }; h.loading = h.homeLoading = h.topLoading = h.whsLoading = h.coachError = h.pending = false; h.coachSuccess = true; h.coach = null; h.top = []; });
afterEach(() => { cleanup(); qc.clear(); });
describe('EP5 completion eligibility', () => {
 it.each([['avatar', { avatar: null }], ['cover', { cover: null }], ['bio', { bio: '  ' }], ['homeClub', { homeClub: false }], ['handicap', { handicap: null }], ['coach', { coach: false }], ['topTen', { topTen: 0 }]] as const)('%s has its own missing rule', (key, patch) => { expect(completionItems({ ...complete, ...patch }).find(i => i.key === key)?.done).toBe(false); expect(completionItems(complete).find(i => i.key === key)?.done).toBe(true); });
 it('pending home club is complete without a named club', () => { expect(completionItems({ ...complete, homeClub: false, pendingClub: true }).find(i => i.key === 'homeClub')?.done).toBe(true); });
 it('coach counts with zero handicap but not an absent handicap', () => { expect(completionItems(complete).map(i => i.key)).toContain('coach'); expect(completionItems({ ...complete, handicap: null }).map(i => i.key)).not.toContain('coach'); });
 it('order and three-action cap', () => { const inputs = { ...complete, avatar: null, cover: null, bio: '', homeClub: false, coach: false, topTen: 0 }; expect(completionItems(inputs).filter(i => !i.done).map(i => i.key)).toEqual(['avatar', 'cover', 'bio', 'homeClub', 'coach', 'topTen']); render(<CompletionCard inputs={inputs} loading={false} onAction={vi.fn()} />); expect(screen.getAllByRole('button').map(b => b.dataset.action)).toEqual(['avatar', 'cover', 'bio']); });
 it('bar exposes exact done and applicable totals', () => { render(<CompletionCard inputs={{ ...complete, coach: false, topTen: 0 }} loading={false} onAction={vi.fn()} />); expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5'); expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '7'); expect(screen.getByRole('progressbar').querySelectorAll('[data-done=true]')).toHaveLength(5); });
 it('complete hides the card and loading hides incomplete', () => { const r = render(<CompletionCard inputs={complete} loading={false} onAction={vi.fn()} />); expect(screen.queryByTestId('ep-completion')).toBeNull(); r.rerender(<CompletionCard inputs={{ ...complete, topTen: 0 }} loading onAction={vi.fn()} />); expect(screen.queryByTestId('ep-completion')).toBeNull(); });
 it('singular, plural and updates as completion changes', () => { const r = render(<CompletionCard inputs={{ ...complete, coach: false, topTen: 0 }} loading={false} onAction={vi.fn()} />); expect(screen.getByTestId('ep-completion').querySelector('b')?.textContent).toBe('2 things left'); r.rerender(<CompletionCard inputs={{ ...complete, topTen: 0 }} loading={false} onAction={vi.fn()} />); expect(screen.getByTestId('ep-completion').querySelector('b')?.textContent).toBe('1 thing left'); r.rerender(<CompletionCard inputs={complete} loading={false} onAction={vi.fn()} />); expect(screen.queryByTestId('ep-completion')).toBeNull(); });
 it.each(['homeLoading', 'topLoading', 'whsLoading', 'loading'] as const)('hidden while %s', key => { h[key] = true; mount(); expect(screen.queryByTestId('ep-completion')).toBeNull(); });
 it('failed coach read suppresses stale completion', () => { h.coachError = true; h.coach = { name: 'stale' }; mount(); expect(screen.queryByTestId('ep-completion')).toBeNull(); });
});
describe('EP5 action reuse and arrival', () => {
 it.each(['avatar', 'cover'] as const)('%s chip opens the EP1 picker', key => { h.profile[key === 'avatar' ? 'profile_photo_url' : 'header_photo_url'] = null; mount(); const input = screen.getByTestId(`ep-${key}-picker`); const spy = vi.spyOn(input, 'click'); fireEvent.click(within(screen.getByTestId('ep-completion')).getByRole('button', { name: key === 'avatar' ? 'Add a photo' : 'Add a cover' })); expect(spy).toHaveBeenCalledTimes(1); });
 it.each([['bio', 'Add a bio', 'ep-sheet-bio'], ['homeClub', 'Add your home club', 'ep-sheet-homeClub'], ['handicap', 'Connect your handicap', 'ep-sheet-handicap'], ['topTen', 'Add your Top 10', 'top-editor']] as const)('%s chip opens the existing editor', (key, label, target) => { if (key === 'bio') h.profile.bio = ''; if (key === 'homeClub') h.profile.home_club = ''; if (key === 'handicap') h.profile.manual_handicap_index = null; mount(); fireEvent.click(within(screen.getByTestId('ep-completion')).getByRole('button', { name: label })); expect(screen.getByTestId(target)).toBeInTheDocument(); });
 it('coach chip opens the existing finder', () => { mount(); fireEvent.click(within(screen.getByTestId('ep-completion')).getByRole('button', { name: 'Name your coach' })); expect(document.querySelector('[data-coach-find]')).not.toBeNull(); });
 it.each([['nudge_club', 'ep-sheet-homeClub'], ['nudge_username', 'ep-sheet-username']] as const)('%s opens on arrival', (src, target) => { mount(`/edit-profile?src=${src}`); expect(screen.getByTestId(target)).toBeInTheDocument(); });
 it('unknown src opens no sheet', () => { mount('/edit-profile?src=other'); expect(screen.queryByRole('dialog')).toBeNull(); });
 it('settings intent opens Settings', () => { mount('/edit-profile?tab=settings'); expect(screen.getByTestId('settings-tab-content')).toBeInTheDocument(); expect(screen.queryByTestId('ep-card')).toBeNull(); });
 it('canonical route renders new page', () => { mount(); expect(screen.getByTestId('ep-page')).toBeInTheDocument(); });
 it('v2 alias preserves query and hash', () => { mount('/edit-profile-v2?tab=settings&src=test#keep'); expect(screen.getByTestId('location').textContent).toBe('/edit-profile?tab=settings&src=test#keep'); expect(screen.getByTestId('settings-tab-content')).toBeInTheDocument(); });
 it('CreateProfileRedirect preserves query and renders new editor', () => { mount('/create-profile?src=nudge_username'); expect(screen.getByTestId('location').textContent).toBe('/edit-profile?src=nudge_username'); expect(screen.getByTestId('ep-sheet-username')).toBeInTheDocument(); });
 it('Back preserves legacy history behavior', () => { mount('/edit-profile', true); fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByTestId('origin')).toBeInTheDocument(); });
 it('profile Edit shared entrypoint lands on new editor', () => { function Entry() { const n = useNavigate(), route = useEditProfileRoute(); return <button onClick={() => n(route)}>Edit</button>; } render(<QueryClientProvider client={qc}><MemoryRouter><Routes><Route path="/" element={<Entry />} /><Route path="/edit-profile" element={<EditProfile />} /></Routes></MemoryRouter></QueryClientProvider>); fireEvent.click(screen.getByRole('button', { name: 'Edit' })); expect(screen.getByTestId('ep-page')).toBeInTheDocument(); });
});
describe('EP5 switch-over wiring', () => {
 it('nav hidden on all editor tabs with no obsolete special case', () => { const nav = readFileSync('src/components/GlobalBottomNavigation.tsx', 'utf8'); expect(nav).toMatch(/HIDDEN_ROUTES = \[[^\]]*'\/edit-profile'/); expect(nav).not.toContain('isOnboardingEditProfile'); expect(nav).not.toContain("'/edit-profile-v2'"); const registry = readFileSync('src/features/chrome-v2/registry.ts', 'utf8'); expect(registry.match(/exact: '\/edit-profile'/g)).toHaveLength(1); expect(registry).not.toContain("exact: '/edit-profile-v2'"); });
 it('Settings menu, PostingAsMenu, rounds, nudges and leftOverride retain canonical destinations', () => { for (const path of ['src/pages/ProfilePageV2.tsx', 'src/components/header/PostingAsMenu.tsx', 'src/features/chrome-v2/leftOverride.ts']) expect(readFileSync(path, 'utf8')).toContain('/edit-profile?tab=settings'); expect(readFileSync('src/components/profile/rounds/ProfileRoundsTab.tsx', 'utf8')).toContain("navigate('/edit-profile')"); const nudges = readFileSync('src/features/activity-v2/utils/activityLinks.ts', 'utf8'); expect(nudges).toContain('/edit-profile?src=nudge_club'); expect(nudges).toContain('/edit-profile?src=nudge_username'); });
});
