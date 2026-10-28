import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const mocks = vi.hoisted(() => ({ business: false, logout: vi.fn(), invite: vi.fn(), mobile: true }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'p', email: '' } }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { display_name: 'Ben' }, isLoading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => {
  const actor = mocks.business ? { type: 'business', id: 'b', slug: 'club', name: 'Club', meta: { category: 'Golf Club' } } : { type: 'personal', id: 'p', name: 'Ben' };
  return { activeActor: actor, availableActors: [actor], setActiveActor: vi.fn() };
} }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUnreadNotifications', () => ({ useUnreadNotifications: () => ({ hasUnread: false, unreadCount: 0 }) }));
vi.mock('@/hooks/messaging/useConversations', () => ({ useConversations: () => ({ conversations: [] }) }));
vi.mock('@/hooks/useIsMobile', () => ({ useIsMobile: () => mocks.mobile }));
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ logout: mocks.logout }) }));
vi.mock('@/hooks/useInviteSheet', () => ({ useInviteSheet: () => ({ openInviteSheet: mocks.invite }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/uploads/useUploadJobs', () => ({ useUploadJobs: () => ({ hasPending: false, hasFailed: false }) }));
vi.mock('@/components/uploads/UploadCenterPanel', () => ({ UploadCenterPanel: () => null }));
vi.mock('@/hooks/useEditProfileRoute', () => ({ useEditProfileRoute: () => '/edit-profile' }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: async () => ({ data: false }) } }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet', () => ({ default: ({ open }: { open: boolean }) => open ? <div role="dialog" aria-label="Course analytics" /> : null }));
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { AvatarCell } from '@/features/chrome-v2/ChromeIsland';
function Probe() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function Harness() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);
  return <><div data-island-right><AvatarCell tone="dark" triggerRef={ref} onOpen={() => setOpen(v => !v)} isOpen={open} /></div><PostingAsMenu isOpen={open} onClose={() => setOpen(false)} anchorRef={ref} /><Probe /></>;
}
function setup() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Harness /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => { vi.clearAllMocks(); mocks.business = false; mocks.mobile = true; });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('avatar account wiring', () => {
  it('avatar tap opens AccountGlance rather than the retired bottom sheet', () => {
    setup(); const avatar = screen.getByRole('button', { name: 'Open profile menu' }); fireEvent.click(avatar);
    expect(screen.getByRole('dialog', { name: 'Your account' })).toBeInTheDocument();
    expect(avatar).toHaveAttribute('aria-expanded', 'true'); expect(document.querySelector('#ps2-title')).toBeNull();
  });
  it('closes before navigating to the personal profile', () => {
    vi.useFakeTimers(); setup(); fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ben View profile' })); expect(screen.queryByRole('dialog')).toBeNull(); expect(screen.getByTestId('location')).toHaveTextContent('/');
    act(() => vi.advanceTimersByTime(80)); expect(screen.getByTestId('location')).toHaveTextContent('/profile');
  });
  it('closes before navigating to the active business slug', () => {
    vi.useFakeTimers(); mocks.business = true; setup(); fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Club Golf club · View page' })); expect(screen.queryByRole('dialog')).toBeNull();
    act(() => vi.advanceTimersByTime(80)); expect(screen.getByTestId('location')).toHaveTextContent('/business/club');
  });
  it('closes the account tile before opening course analytics', () => {
    vi.useFakeTimers(); setup(); fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' })); fireEvent.click(screen.getByRole('button', { name: 'Your courses' }));
    expect(screen.queryByRole('dialog')).toBeNull(); act(() => vi.advanceTimersByTime(250)); expect(screen.getByRole('dialog', { name: 'Course analytics' })).toBeInTheDocument();
  });
  it('closes before opening the existing invite sheet', () => {
    vi.useFakeTimers(); setup(); fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' })); fireEvent.click(screen.getByRole('button', { name: 'Invite friends' }));
    expect(screen.queryByRole('dialog')).toBeNull(); expect(mocks.invite).not.toHaveBeenCalled(); act(() => vi.advanceTimersByTime(250)); expect(mocks.invite).toHaveBeenCalledWith('profile_sheet');
  });
  it('second sign-out tap calls the existing logout and closes', () => {
    setup(); fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' })); fireEvent.click(screen.getByRole('button', { name: 'SIGN OUT' })); expect(mocks.logout).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to confirm' })); expect(mocks.logout).toHaveBeenCalledOnce(); expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('Escape closes and returns focus to the avatar', () => {
    setup(); const avatar = screen.getByRole('button', { name: 'Open profile menu' }); fireEvent.click(avatar); fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(avatar);
  });
});