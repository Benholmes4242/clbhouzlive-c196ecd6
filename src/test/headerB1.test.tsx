import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({
  guest: false, profile: { hide_handicap_chip: false },
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

vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => mocks.guest }));
import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { registerNavScroller, resetToExpanded, pushForceExpand } from '@/hooks/useScrollDirection';
import { useIslandsCondensed } from '@/features/chrome-v2/useIslandsCondensed';
import { renderHook } from '@testing-library/react';
import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { readFileSync } from 'node:fs';


let el: HTMLDivElement; let off: () => void;
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const mount = (path = '/') => render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
const move = async (top: number) => { el.scrollTop = top; await act(async () => { fireEvent.scroll(el); await new Promise(r => requestAnimationFrame(() => r(null))); }); };
beforeEach(() => { resetToExpanded(); mocks.guest = false; el = document.createElement('div'); document.body.appendChild(el); off = registerNavScroller(el); });
afterEach(() => { cleanup(); off(); el.remove(); resetToExpanded(); });
describe('HEADER_B1 shared state and controls', () => {
  it.each(['/', '/clubhouse', '/tourhub'])('only opted %s condenses past the top zone and expands on up scroll', async (path) => {
    const { result } = renderHook(useIslandsCondensed, { wrapper: ({ children }) => <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter> });
    await move(79); expect(result.current).toBe(false);
    await move(105); expect(result.current).toBe(true);
    await move(92); expect(result.current).toBe(false);
    await move(140); expect(result.current).toBe(true);
    let release = () => {}; act(() => { release = pushForceExpand(); }); expect(result.current).toBe(false); act(release);
    await move(30); expect(result.current).toBe(false);
  });
  it('non-opted profile remains byte-identical when the nav signal changes', async () => {
    const { container } = mount('/profile/ben'); const before = container.innerHTML;
    await move(150); expect(container.innerHTML).toBe(before);
  });
  it('search and divider fold inaccessible while Connect and avatar stay active', async () => {
    mount(); const search = screen.getByRole('button', { name: 'Search' });
    expect(search.getAttribute('aria-hidden')).toBeNull();
    await move(150); expect(search).toHaveAttribute('aria-hidden', 'true'); expect(search.tabIndex).toBe(-1); expect(search.style.pointerEvents).toBe('none'); expect(search.style.maxWidth).toBe('0');
    expect(document.querySelector<HTMLElement>('[data-island-divider]')?.style.maxWidth).toBe('0');
    expect(screen.getByRole('button', { name: 'Connect your handicap' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /posting as/i })).toBeEnabled();
    await move(130); expect(search.getAttribute('aria-hidden')).toBeNull(); expect(search.style.maxWidth).toBe('19px');
  });
  it('guest right capsule remains byte-identical through condensation', async () => {
    mocks.guest = true; mount(); const guest = document.querySelector('[data-guest-island]'); const before = guest?.outerHTML;
    await move(150); expect(guest?.outerHTML).toBe(before);
  });
  it('opted left and right glass move from rest token to canonical material', async () => {
    mount(); const left = screen.getByRole('button', { name: 'Go to home' }); const right = document.querySelector<HTMLElement>('[data-island-right]');
    expect(left.style.background).toBe('var(--island-rest-glass)'); expect(right?.style.background).toBe('var(--island-rest-glass)');
    await move(150); expect(left.style.background).toBe('rgba(14, 14, 16, 0.84)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.84)');
  });
  it('Tour folds text and chevron but preserves its picker anchor and aria label', async () => {
    const open = vi.fn(); render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/tourhub']}><TourIsland label="All tours" caption="Events this week" captionLive={false} glyph="globe" onOpen={open} /></MemoryRouter></QueryClientProvider>);
    const button = screen.getByRole('button'); const name = button.getAttribute('aria-label'); const fold = document.querySelector<HTMLElement>('[data-tour-island-fold]');
    expect(fold?.style.opacity).toBe('1'); await move(150); expect(fold?.style.maxWidth).toBe('0'); expect(fold?.style.opacity).toBe('0'); expect(button.getAttribute('aria-label')).toBe(name);
    fireEvent.click(button); expect(open).toHaveBeenCalledWith(button);
  });
  it('the condensation hook reuses nav state without adding any scroll listener', () => {
    const src = readFileSync('src/features/chrome-v2/useIslandsCondensed.ts', 'utf8'); expect(src).toContain('useNavScrollState()'); expect(src).not.toContain('addEventListener'); expect(src).not.toContain('registerNavScroller');
  });
  it('split timing uses 300ms geometry and 200ms opacity with one easing', () => {
    const css = readFileSync('src/index.css', 'utf8'); expect(css).toContain('max-width 300ms var(--island-fold-ease), opacity 200ms var(--island-fold-ease)'); expect(css).toContain('--island-fold-ease: cubic-bezier(.2,.8,.2,1)');
  });
});
