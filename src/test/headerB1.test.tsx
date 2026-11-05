import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({
  guest: false, profile: { hide_handicap_chip: false },
  update: vi.fn(), eq: vi.fn(), from: vi.fn(),
  success: vi.fn(), error: vi.fn(), avatar: vi.fn(),
  scores: vi.fn(), lastRound: vi.fn(),
  gate: vi.fn(), track: vi.fn(), openVideoList: vi.fn(),
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
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/features/explore-magazine/watch/openVideoList', () => ({ openVideoList: mocks.openVideoList }));
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useWatchRegions: () => ({ data: [] }), useRegionCourses: () => ({ data: [] }),
  useGridVideos: () => ({ data: { pages: [[{ post_id: 'video', course_name: 'Test course', duration_seconds: 10 }]] }, isSuccess: true, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }),
}));

vi.mock('@/features/guest/useIsGuest', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/features/guest/useIsGuest')>()), useIsGuest: () => mocks.guest }));
vi.mock('@/features/pro-verification/useMyProStatus', () => ({ useMyProStatus: () => ({ verified: false, verifiedKnown: true, pending: false, declined: false, kind: null, tour: null, tourCode: null, club: null, body: null, reviewReason: null, request: null, isLoading: false, unknown: false }) }));
vi.mock('@/features/guest/guestGateStore', async (importOriginal) => ({ ...await importOriginal<typeof import('@/features/guest/guestGateStore')>(), openGuestCard: mocks.gate }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestGateShown: mocks.track }));
import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { registerNavScroller, resetToExpanded, pushForceExpand } from '@/hooks/useScrollDirection';
import { useIslandsCondensed } from '@/features/chrome-v2/useIslandsCondensed';
import { renderHook } from '@testing-library/react';
import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { CHROME_REGISTRY, resolveChrome } from '@/features/chrome-v2/registry';
import NotFound from '@/pages/NotFound';
import WatchGridPage from '@/pages/WatchGridPage';
import { readFileSync } from 'node:fs';


let el: HTMLDivElement; let off: () => void;
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const mount = (path = '/') => render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
const move = async (top: number) => { el.scrollTop = top; await act(async () => { fireEvent.scroll(el); await new Promise(r => requestAnimationFrame(() => r(null))); }); };
beforeEach(() => { resetToExpanded(); mocks.guest = false; el = document.createElement('div'); document.body.appendChild(el); off = registerNavScroller(el); });
afterEach(() => { cleanup(); off(); el.remove(); resetToExpanded(); });
describe('HEADER_B1 shared state and controls', () => {
  it.each(['history', 'fallback'] as const)('FIX_GRID_1 top100 back uses %s navigation without opening the underlying video', mode => {
    const length = vi.spyOn(window.history, 'length', 'get').mockReturnValue(mode === 'history' ? 2 : 1);
    const Location = () => <output data-testid="back-location">{useLocation().pathname}</output>;
    mocks.openVideoList.mockClear();
    try {
      render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={mode === 'history' ? ['/amateur', '/watch/top100'] : ['/watch/top100']} initialIndex={mode === 'history' ? 1 : 0}><ChromeIsland /><Location /><Routes><Route path="/watch/top100" element={<WatchGridPage kind="top100" />} /><Route path="/amateur" element={<div data-testid="returned-amateur" />} /></Routes></MemoryRouter></QueryClientProvider>);
      expect(document.querySelector('[data-grid-tile="video"]')).toBeInTheDocument();
      const back = document.querySelector<HTMLElement>('[data-island-back]');
      expect(back).not.toBeNull(); if (!back) return;
      fireEvent.click(back);
      expect(screen.getByTestId('back-location')).toHaveTextContent('/amateur');
      expect(screen.getByTestId('returned-amateur')).toBeInTheDocument();
      expect(mocks.openVideoList).not.toHaveBeenCalled();
    } finally { length.mockRestore(); }
  });
  it.each(['/', '/clubhouse', '/tourhub'])('only opted %s condenses past the top zone and expands on up scroll', async (path) => {
    const { result } = renderHook(useIslandsCondensed, { wrapper: ({ children }) => <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter> });
    await move(79); expect(result.current).toBe(false);
    await move(105); expect(result.current).toBe(true);
    await move(92); expect(result.current).toBe(false);
    await move(140); expect(result.current).toBe(true);
    let release = () => {}; act(() => { release = pushForceExpand(); }); expect(result.current).toBe(false); act(release);
    await move(30); expect(result.current).toBe(false);
  });
  it('HB5 profile folds when the nav signal changes', async () => {
    mount('/profile/ben');
    const back = screen.getByRole('button', { name: 'Go back' });
    expect(back).toHaveAttribute('data-condensed', 'false');
    await move(150); expect(back).toHaveAttribute('data-condensed', 'true');
  });
  it('search and divider fold inaccessible while Connect and avatar stay active', async () => {
    mount(); const search = screen.getByRole('button', { name: 'Search' });
    expect(search.getAttribute('aria-hidden')).toBeNull();
    await move(150); expect(search).toHaveAttribute('aria-hidden', 'true'); expect(search.tabIndex).toBe(-1); expect(search.style.pointerEvents).toBe('none'); expect(search.style.maxWidth).toBe('0');
    expect(document.querySelector<HTMLElement>('[data-island-divider]')?.style.maxWidth).toBe('0');
    expect(screen.getByRole('button', { name: 'Connect your handicap' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeEnabled();
    await move(130); expect(search.getAttribute('aria-hidden')).toBeNull(); expect(search.style.maxWidth).toBe('19px');
  });
  it('GI1 guest fold hides and disables Log in while Join free keeps its handlers', async () => {
    mocks.guest = true; mocks.gate.mockClear(); mocks.track.mockClear(); mount();
    const login = screen.getByRole('button', { name: 'Log in' });
    const join = screen.getByRole('button', { name: 'Join free' });
    await move(150);
    expect(login).toHaveAttribute('aria-hidden', 'true'); expect(login.tabIndex).toBe(-1); expect(login).toBeDisabled();
    expect(login.style.pointerEvents).toBe('none'); expect(login.style.maxWidth).toBe('0');
    expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull();
    expect(join).toBeEnabled(); expect(screen.getByRole('button', { name: 'Join free' })).toBe(join);
    fireEvent.click(login); expect(mocks.gate).not.toHaveBeenCalled();
    fireEvent.click(join);
    expect(mocks.track).toHaveBeenCalledExactlyOnceWith({ surface: 'clubhouse', trigger: 'join_button' });
    expect(mocks.gate).toHaveBeenCalledExactlyOnceWith({ kind: 'join_button', surface: 'clubhouse' });
    const guest = document.querySelector<HTMLElement>('[data-guest-island]');
    expect(guest?.style.background).toBe('rgba(14, 14, 16, 0.84)');
    expect(guest?.style.padding).toBe('0px 6px'); expect(guest?.style.gap).toBe('0');
  });
  it('GI1 guest rest uses member squircle glass and preserves Join free dimensions', () => {
    mocks.guest = true; mount();
    const guest = document.querySelector<HTMLElement>('[data-guest-island]');
    const join = screen.getByRole('button', { name: 'Join free' });
    expect(guest?.style.borderRadius).toBe('16px'); expect(guest?.style.background).toBe('rgba(14, 14, 16, 0.55)');
    expect(guest?.style.padding).toBe('0px 6px 0px 16px'); expect(guest?.style.gap).toBe('12px');
    expect(join.style.borderRadius).toBe('12px'); expect(join.style.height).toBe('34px'); expect(join.style.padding).toBe('0px 16px');
  });
  it('DEFAULT_B1 unregistered paths resolve to the soft condensing logo default', () => {
    expect(resolveChrome('/no-such-page', new URLSearchParams())).toEqual({
      chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: false, scrim: 'soft', condense: true,
    });
  });
  it('DEFAULT_B1 every explicit island rule retains soft condensing chrome', () => {
    const islands = CHROME_REGISTRY.filter(rule => rule.spec.chrome === 'island');
    expect(islands.length).toBeGreaterThan(0);
    for (const rule of islands) expect(rule.spec).toMatchObject({ scrim: 'soft', condense: true });
  });
  it('DEFAULT_B1 messages renders neither an island nor a soft fade', () => {
    expect(resolveChrome('/messages', new URLSearchParams()).chrome).toBe('none');
    mount('/messages');
    expect(document.querySelector('[data-chrome="island"]')).toBeNull();
    expect(document.querySelector('[data-chrome="island-scrim-soft"]')).toBeNull();
  });
  it('DEFAULT_B1 NotFound renders a soft-fade logo squircle and folds on scroll', async () => {
    // NotFound intentionally logs a 404; keep that expected diagnostic local.
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/no-such-page']}><ChromeIsland /><Routes><Route path="*" element={<NotFound />} /></Routes></MemoryRouter></QueryClientProvider>);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      const left = screen.getByRole('button', { name: 'Go to home' });
      const right = document.querySelector<HTMLElement>('[data-island-right]');
      const wordmark = left.querySelector<HTMLImageElement>('img[src*="wordmark"]');
      const search = screen.getByRole('button', { name: 'Search' });
      expect(document.querySelectorAll('[data-chrome="island-scrim-soft"]')).toHaveLength(1);
      expect(left.style.borderRadius).toBe('16px'); expect(right?.style.borderRadius).toBe('16px');
      expect(left.style.background).toBe('rgba(14, 14, 16, 0.55)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.55)');
      expect(wordmark?.style.maxWidth).toBe('64px');
      await move(150);
      expect(wordmark?.style.maxWidth).toBe('0'); expect(search).toHaveAttribute('aria-hidden', 'true');
      expect(left.style.padding).toBe('0px 7px'); expect(left.style.height).toBe('46px');
      expect(left.style.borderRadius).toBe('16px'); expect(right?.style.borderRadius).toBe('16px');
      expect(left.style.background).toBe('rgba(14, 14, 16, 0.84)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.84)');
      expect(document.querySelectorAll('[data-chrome="island-scrim-soft"]')).toHaveLength(1);
      await move(130); expect(wordmark?.style.maxWidth).toBe('64px'); expect(search).not.toHaveAttribute('aria-hidden');
    } finally { diagnostic.mockRestore(); }
  });
  it('GI1 Log in restores after upward scroll and retains auth navigation', async () => {
    const Location = () => <output data-testid="location">{useLocation().pathname}</output>;
    mocks.guest = true;
    render(<QueryClientProvider client={client()}><MemoryRouter><ChromeIsland /><Location /></MemoryRouter></QueryClientProvider>);
    const login = screen.getByRole('button', { name: 'Log in' });
    await move(150); fireEvent.click(login); expect(screen.getByTestId('location')).toHaveTextContent('/');
    await move(130); expect(login).toBeEnabled(); expect(login).not.toHaveAttribute('aria-hidden'); expect(login.tabIndex).toBe(0);
    fireEvent.click(login); expect(screen.getByTestId('location')).toHaveTextContent('/auth');
  });
  it('opted left and right glass move from rest token to canonical material', async () => {
    mount(); const left = screen.getByRole('button', { name: 'Go to home' }); const right = document.querySelector<HTMLElement>('[data-island-right]');
    expect(left.style.background).toBe('rgba(14, 14, 16, 0.55)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.55)');
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
