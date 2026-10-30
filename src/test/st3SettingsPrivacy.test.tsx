import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { strangerSummary, type StrangerPrivacy } from '@/components/settings/privacySummary';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ count: 0 as number | null, error: false, holdCount: false, holdSave: false, release: null as (() => void) | null, from: vi.fn(), select: vi.fn(), eq: vi.fn(), update: vi.fn(), track: vi.fn(), profile: { id: 'me', is_public: true, handicap_visibility: 'public', leaderboard_visibility: 'public', top100_visibility: 'public', auto_post_rounds: true } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: () => Promise.resolve({ error: null }), from: (table: string) => {
  h.from(table);
  const chain = {
    select: (...args: unknown[]) => { h.select(...args); return chain; },
    eq: (...args: unknown[]) => { h.eq(...args); return chain; },
    update: (payload: unknown) => { h.update(payload); return chain; },
    then: (resolve: (value: unknown) => unknown) => {
      if (table === 'user_blocks') return (h.holdCount ? new Promise(() => {}) : Promise.resolve({ count: h.count, error: h.error ? new Error('count refused') : null })).then(resolve);
      return (h.holdSave ? new Promise(r => { h.release = () => r({ error: null }); }) : Promise.resolve({ error: null })).then(resolve);
    },
  }; return chain;
} } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: h.profile, loading: false }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({ useHasBusinesses: () => ({ count: 0 }) }));
vi.mock('@/hooks/useMyRequests', () => ({ useMyRequestsList: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: vi.fn() }) }));
vi.mock('@/hooks/useDeleteAccount', () => ({ useDeleteAccount: () => ({ showDeleteConfirm: false, setShowDeleteConfirm: vi.fn(), showBusinessWarning: false, setShowBusinessWarning: vi.fn(), ownedBusinessNames: [], deleteConfirmText: '', setDeleteConfirmText: vi.fn(), isDeleting: false, initiateDelete: vi.fn(), confirmDelete: vi.fn() }) }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: vi.fn() }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: (...args: unknown[]) => h.track(...args) } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import { useSettingsBlockedCount } from '@/components/settings/useSettingsBlockedCount';
let qc: QueryClient;
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
function mount() { return render(<Wrapper><div className="ep-shell"><SettingsTabContent /></div><Location /></Wrapper>); }
beforeEach(() => { vi.clearAllMocks(); qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); h.count = 0; h.error = false; h.holdCount = false; h.holdSave = false; h.release = null; h.profile = { id: 'me', is_public: true, handicap_visibility: 'public', leaderboard_visibility: 'public', top100_visibility: 'public', auto_post_rounds: true }; });
afterEach(() => { cleanup(); qc.clear(); });
const allOpen: StrangerPrivacy = { isPublic: true, handicap: 'public', courses: 'public', leaderboards: 'public' };
const sentence = (p: StrangerPrivacy) => strangerSummary(p).map(s => s.text).join('');
describe('ST3 strangerSummary', () => {
  it('ST3-A all Everyone', () => { expect(sentence(allOpen)).toBe("Your profile, your handicap, the courses you've played and where you rank on the boards."); });
  it('ST3-B mixed privacy', () => { expect(sentence({ isPublic: true, handicap: 'friends', courses: 'friends', leaderboards: 'private' })).toBe("Your profile. Only friends see your handicap and the courses you've played. You're left off the boards."); });
  it('all Friends', () => { expect(sentence({ isPublic: false, handicap: 'friends', courses: 'friends', leaderboards: 'friends' })).toBe("Only friends see your profile, your handicap, the courses you've played and where you rank on the boards."); });
  it('private profile and everything else Only me contain no empty clauses', () => { expect(sentence({ isPublic: false, handicap: 'private', courses: 'private', leaderboards: 'private' })).toBe("Only friends see your profile. You're left off the boards. Only you see your handicap and the courses you've played."); });
  it('joining words and clauses are mute while the items are ink', () => {
    const segments = strangerSummary({ isPublic: false, handicap: 'friends', courses: 'private', leaderboards: 'private' });
    expect(segments.filter(s => s.tone === 'mute').map(s => s.text)).toEqual(['Only friends see ', ' and ', ' ', "You're left off ", ' ', 'Only you see ']);
    expect(segments.filter(s => s.tone === 'ink').map(s => s.text)).toEqual(['your profile', 'your handicap', '.', 'the boards', '.', "the courses you've played", '.']);
    expect(strangerSummary(allOpen).filter(s => s.tone === 'mute').map(s => s.text)).toEqual([', ', ', ', ' and ']);
  });
});
describe('ST3 Settings Privacy controls', () => {
  it('ordered rows reflect canonical values and old controls are absent', () => {
    h.profile.is_public = false; h.profile.leaderboard_visibility = 'private'; h.profile.top100_visibility = 'friends';
    mount(); const card = screen.getByTestId('settings-privacy');
    expect([...card.querySelectorAll('.ep-row-label')].map(n => n.textContent)).toEqual(['Profile', 'Leaderboards', 'Courses', 'New rounds', 'Blocked']);
    expect([...card.querySelectorAll('.ep-row-value')].map(n => n.textContent)).toEqual(['Friends', 'Only me', 'Friends', 'Tell my followers', '']);
    expect(within(card).getAllByRole('switch')).toHaveLength(1);
    expect(within(card).queryByRole('radio')).toBeNull();
    expect(within(card).queryByText('Public Profile')).toBeNull();
    expect(within(card).queryByText('Who can see your handicap')).toBeNull();
  });
  it('New rounds calls existing auto-post writer and analytics, disabled during save', async () => {
    h.holdSave = true; mount(); const toggle = screen.getByRole('switch', { name: 'New rounds' });
    fireEvent.click(toggle); expect(h.update).toHaveBeenCalledWith({ auto_post_rounds: false });
    expect(h.track).toHaveBeenCalledWith('settings_auto_post_rounds_toggled', { enabled: false });
    await waitFor(() => expect(toggle).toBeDisabled()); h.release?.(); await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
  it.each([[0, 'No one'], [1, '1 golfer'], [3, '3 golfers']] as const)('Blocked %s has correct count and destination', async (count, label) => {
    h.count = count; mount(); await waitFor(() => expect(screen.getByTestId('settings-blocked-value').textContent).toBe(label));
    expect(screen.getByTestId('settings-blocked-value').classList.contains('ph')).toBe(count === 0);
    expect(h.select).toHaveBeenCalledWith('*', { count: 'exact', head: true }); expect(h.eq).toHaveBeenCalledWith('blocker_id', 'me');
    fireEvent.click(screen.getByRole('button', { name: `Blocked ${label}` })); expect(screen.getByTestId('location').textContent).toBe('/manage/blocked');
  });
  it('Blocked value remains absent while loading', () => { h.holdCount = true; mount(); expect(screen.getByTestId('settings-blocked-value').textContent).toBe(''); });
  it('Blocked error hides stale count', async () => { qc.setQueryData(['blocked-user-ids', 'me', 'settings-count'], 3); h.error = true; mount(); await waitFor(() => expect(qc.getQueryState(['blocked-user-ids', 'me', 'settings-count'])?.status).toBe('error')); expect(screen.getByTestId('settings-blocked-value').textContent).toBe(''); });
  it.each([
    ['Profile', 'Friends', { is_public: false }, 'Only friends see your profile.'],
    ['Leaderboards', 'Only me', { leaderboard_visibility: 'private' }, "You're left off the boards."],
    ['Courses', 'Friends', { top100_visibility: 'friends' }, "Only friends see the courses you've played."],
  ] as const)('%s sheet saves through existing setter, closes and updates summary', async (title, choice, payload, summary) => {
    mount(); fireEvent.click(screen.getByRole('button', { name: `${title} Everyone` }));
    const dialog = screen.getByRole('dialog', { name: title }); expect(within(dialog).getAllByRole('radio')).toHaveLength(title === 'Profile' ? 2 : 3);
    fireEvent.click(within(dialog).getByRole('radio', { name: new RegExp(`^${choice}`) }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); expect(h.update).toHaveBeenCalledWith(payload);
    expect(screen.getByTestId('stranger-summary')).toHaveTextContent(summary);
  });
  it('EP5.2 fix: the checked option carries aria-checked=true and its .ep-radio, inside .bizc-sheet-root on body', () => { mount(); fireEvent.click(screen.getByRole('button', { name: 'Profile Everyone' })); const dialog = screen.getByRole('dialog'); expect(dialog.closest('.bizc-sheet-root')?.parentElement).toBe(document.body); const checked = within(dialog).getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'); expect(checked).toHaveLength(1); expect(checked[0].querySelector('.ep-radio')).not.toBeNull(); });
  it('Done closes without writing', () => { mount(); fireEvent.click(screen.getByRole('button', { name: 'Profile Everyone' })); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Done' })); expect(screen.queryByRole('dialog')).toBeNull(); expect(h.update).not.toHaveBeenCalled(); });
  it('refreshed Profile handicap visibility updates the Settings summary', async () => {
    const view = mount(); h.profile = { ...h.profile, handicap_visibility: 'friends' }; view.rerender(<Wrapper><div className="ep-shell"><SettingsTabContent /></div></Wrapper>);
    await waitFor(() => expect(screen.getByTestId('stranger-summary')).toHaveTextContent('Only friends see your handicap.')); expect(h.update).not.toHaveBeenCalled();
  });
});
describe('ST3 count identity', () => {
  it('no member means no read and no count', () => { const { result } = renderHook(() => useSettingsBlockedCount(undefined), { wrapper: Wrapper }); expect(result.current).toBeNull(); expect(h.from).not.toHaveBeenCalled(); });
  it('switching members cannot reuse a prior member count', async () => {
    h.count = 3; const { result, rerender } = renderHook(({ id }) => useSettingsBlockedCount(id), { initialProps: { id: 'one' }, wrapper: Wrapper });
    await waitFor(() => expect(result.current).toBe(3)); h.holdCount = true; rerender({ id: 'two' }); expect(result.current).toBeNull(); expect(h.eq).toHaveBeenCalledWith('blocker_id', 'one');
  });
});