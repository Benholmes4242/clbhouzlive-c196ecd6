import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
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

import { HcpCell, AvatarCell, ChromeIsland } from '@/features/chrome-v2/ChromeIsland';

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
  it('hands the shared avatar the island hairline ring and member identity', () => {
    render(<AvatarCell tone="dark" onOpen={() => {}} triggerRef={React.createRef<HTMLButtonElement>()} />);
    expect(mocks.avatar).toHaveBeenCalledWith(expect.objectContaining({ ringWidth: 1, ringColor: 'rgba(255,255,255,0.10)', size: 36, userId: 'member', src: '/avatar.jpg', alt: 'Ben' }));
  });
});

describe('Islands round two wordmark', () => {
  it('shows the white wordmark beside the mark only once scrolled', async () => {
    const { registerNavScroller, resetToExpanded } = await import('@/hooks/useScrollDirection');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/']}>
          <ChromeIsland />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const wordmark = () =>
      Array.from(document.querySelectorAll('img[alt="clbhouz"]')).find(
        (img) => img.getAttribute('src')?.includes('clbhouz-wordmark-white'),
      ) as HTMLImageElement | undefined;

    // Registered in the '/' rule; present but collapsed and invisible at rest.
    expect(wordmark()).toBeDefined();
    const image = wordmark();
    if (!image) throw new Error('Missing wordmark');
    expect(image.getAttribute('src')).toBe('/brand/clbhouz-wordmark-white@3x.png');
    expect(image.style.height).toBe('20px');
    expect(image.style.opacity).toBe('0');
    expect(image.style.maxWidth).toBe('0');
    // The plain-text "Clubhouse" title is gone in favour of the artwork.
    expect(view.container.textContent).not.toContain('Clubhouse');

    const capsule = screen.getByRole('button', { name: 'Go to home' });
    expect(capsule.style.padding).toBe('0px 7px');
    expect(capsule.style.gap).toBe('0');
    const mark = capsule.querySelector('img');
    expect(mark?.parentElement).toBe(capsule);
    expect(mark?.style.width).toBe('30px');
    expect(mark?.style.height).toBe('30px');
    expect(capsule.querySelector('span')).toBeNull();

    const scroller = document.createElement('div');
    document.body.appendChild(scroller);
    const unregister = registerNavScroller(scroller);
    scroller.scrollTop = 100;
    fireEvent.scroll(scroller);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    expect(image.style.opacity).toBe('1');
    expect(image.style.maxWidth).toBe('64px');
    expect(capsule.style.padding).toBe('0px 15px 0px 11px');
    expect(capsule.style.gap).toBe('9px');

    act(() => resetToExpanded());
    expect(image.style.opacity).toBe('0');
    expect(image.style.maxWidth).toBe('0');
    expect(capsule.style.padding).toBe('0px 7px');

    unregister();
    scroller.remove();
  });
});