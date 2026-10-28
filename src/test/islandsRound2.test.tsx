import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({
  profile: { hide_handicap_chip: false },
  update: vi.fn(), eq: vi.fn(), from: vi.fn(),
  success: vi.fn(), error: vi.fn(), avatar: vi.fn(),
  scores: vi.fn(), lastRound: vi.fn(),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal', name: 'Ben', avatarUrl: '/avatar.jpg' }, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: mocks.profile, isFetched: true, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }), useAllScores: mocks.scores, useLastRound: mocks.lastRound }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/toast', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: (props: unknown) => { mocks.avatar(props); return <div data-testid="avatar" />; } }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));

import { HcpCell, AvatarCell } from '@/features/chrome-v2/ChromeIsland';

function LocationProbe() { const location = useLocation(); return <output data-testid="path">{location.pathname}</output>; }
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const view = render(<QueryClientProvider client={client}><MemoryRouter><HcpCell tone="dark" dividerColor="transparent" /><LocationProbe /></MemoryRouter></QueryClientProvider>);
  return { ...view, invalidate };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.profile.hide_handicap_chip = false;
  mocks.eq.mockResolvedValue({ error: null });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ update: mocks.update });
});
afterEach(cleanup);

describe('Islands round two disconnected glance', () => {
  it('opens a dialog rather than navigating from the no-handicap cell', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('path')).toHaveTextContent('/');
    expect(mocks.scores).not.toHaveBeenCalled();
    expect(mocks.lastRound).not.toHaveBeenCalled();
  });
  it('does not render invented figures in the no-handicap variant', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    expect(screen.getByRole('dialog').textContent).not.toMatch(/[0-9−–—]/);
  });
  it('Connect closes the glance and navigates to /manage/handicap', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('path')).toHaveTextContent('/manage/handicap');
  });
  it('decline saves true, invalidates both Settings keys and disappears once profile reads back', async () => {
    const view = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    const decline = screen.getByRole('dialog').querySelectorAll('button')[1];
    fireEvent.click(decline);
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Hidden. You can turn it back on in Settings.'));
    expect(mocks.from).toHaveBeenCalledWith('user_profiles');
    expect(mocks.update).toHaveBeenCalledWith({ hide_handicap_chip: true });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'member');
    expect(view.invalidate).toHaveBeenCalledWith({ queryKey: ['user-profile', 'member'] });
    expect(view.invalidate).toHaveBeenCalledWith({ queryKey: ['profile', 'member'] });
    mocks.profile.hide_handicap_chip = true;
    view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter><HcpCell tone="dark" dividerColor="transparent" /></MemoryRouter></QueryClientProvider>);
    expect(screen.queryByRole('button', { name: 'Connect your handicap' })).toBeNull();
  });
  it('failed decline leaves the dialog open and does not invalidate', async () => {
    mocks.eq.mockResolvedValue({ error: new Error('refused') });
    const view = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' }));
    fireEvent.click(screen.getByRole('dialog').querySelectorAll('button')[1]);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Could not update. Please try again.'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(view.invalidate).not.toHaveBeenCalled();
  });
  it('Escape closes and returns focus to the original cell', () => {
    setup();
    const cell = screen.getByRole('button', { name: 'Connect your handicap' });
    fireEvent.click(cell);
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(cell);
  });
  it('hands the shared avatar its amber ring and member identity', () => {
    render(<AvatarCell tone="dark" onOpen={() => {}} triggerRef={React.createRef<HTMLButtonElement>()} />);
    expect(mocks.avatar).toHaveBeenCalledWith(expect.objectContaining({ ringColor: '#F7931E', size: 36, userId: 'member', src: '/avatar.jpg', alt: 'Ben' }));
  });
});