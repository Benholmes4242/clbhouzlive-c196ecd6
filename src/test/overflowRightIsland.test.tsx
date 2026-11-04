import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ guest: true, narrow: false, listeners: new Set<() => void>() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: state.guest ? null : { id: 'member' }, loading: false }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => state.guest }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal', name: 'Ben' }, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: true, connected: true, settled: true, connection: { id: 'connection' }, trend: { current: 8.2 }, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span data-testid="avatar" /> }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { resetToExpanded } from '@/hooks/useScrollDirection';

beforeEach(() => {
  resetToExpanded(); state.guest = true; state.narrow = false; state.listeners.clear();
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    get matches() { return query === '(max-width: 340px)' && state.narrow; },
    media: query, onchange: null,
    addEventListener: (_event, listener) => { if (typeof listener === 'function') state.listeners.add(listener as () => void); },
    removeEventListener: (_event, listener) => { if (typeof listener === 'function') state.listeners.delete(listener as () => void); },
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: () => false,
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); resetToExpanded(); });
function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
}
const paths = ['/tourhub', '/', '/amateur', '/courses', '/watch/top100'];
describe('FIX_OVERFLOW_1 right-only narrow fold', () => {
  it.each(paths)('guest folds Log in at rest and retains Join free on %s', path => {
    state.narrow = true; mount(path);
    const login = document.querySelector<HTMLButtonElement>('[data-guest-island] > button:first-of-type');
    expect(login).toHaveAttribute('aria-hidden', 'true'); expect(login).toBeDisabled(); expect(login?.tabIndex).toBe(-1);
    expect(login?.style.maxWidth).toBe('0'); expect(login?.style.opacity).toBe('0'); expect(login?.style.pointerEvents).toBe('none');
    expect(screen.getByRole('button', { name: 'Join free' })).toBeEnabled();
  });
  it.each(paths)('member folds search at rest and retains index/avatar on %s', path => {
    state.guest = false; state.narrow = true; mount(path);
    const search = document.querySelector<HTMLButtonElement>('[data-island-right] > button:first-of-type');
    expect(search).toHaveAttribute('aria-hidden', 'true'); expect(search?.tabIndex).toBe(-1);
    expect(search?.style.maxWidth).toBe('0'); expect(search?.style.opacity).toBe('0'); expect(search?.style.pointerEvents).toBe('none');
    expect(screen.getByRole('button', { name: 'Handicap index 8.2' })).toBeEnabled();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeEnabled();
  });
  it.each([true, false])('above340 keeps the existing expanded guest=%s controls', guest => {
    state.guest = guest; mount('/tourhub');
    const control = screen.getByRole('button', { name: guest ? 'Log in' : 'Search' });
    expect(control).not.toHaveAttribute('aria-hidden'); expect(control.tabIndex).toBe(0);
  });
  it.each([true, false])('media changes live-update only the right island for guest=%s', guest => {
    state.guest = guest; mount('/');
    const left = document.querySelector('[data-island-left]')?.getAttribute('style');
    const control = screen.getByRole('button', { name: guest ? 'Log in' : 'Search' });
    act(() => { state.narrow = true; state.listeners.forEach(listener => listener()); });
    expect(control).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('[data-island-left]')?.getAttribute('style')).toBe(left);
    act(() => { state.narrow = false; state.listeners.forEach(listener => listener()); });
    expect(control).not.toHaveAttribute('aria-hidden');
  });
});