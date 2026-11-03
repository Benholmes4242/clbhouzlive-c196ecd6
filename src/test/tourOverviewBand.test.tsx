import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const scroll = vi.hoisted(() => ({ scrolled: false }));
vi.mock('@/hooks/useScrollDirection', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/hooks/useScrollDirection')>()), useChromeScrolled: () => scroll.scrolled }));
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

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { readFileSync } from 'node:fs';

/* BRIEF_TOUR_OVERVIEW_BAND — '/tourhub' fade at rest, shared band past 24px. */
const mount = (path: string) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter>
  </QueryClientProvider>,
);
const layer = (name: string) => document.querySelector(`[data-chrome="${name}"]`) as HTMLElement | null;
afterEach(() => { cleanup(); scroll.scrolled = false; });

describe('Tour overview band', () => {
  it('all three opted routes have one persistent soft fade and no legacy band', () => {
    for (const path of ['/', '/clubhouse', '/tourhub']) {
      const view = mount(path);
      const fade = layer('island-scrim-soft');
      expect(fade?.style.height).toBe('calc(var(--sat, 0px) + 96px)');
      expect(fade?.style.background).toBe('var(--island-soft-fade)');
      expect(fade?.style.position).toBe('fixed');
      expect(fade?.style.pointerEvents).toBe('none');
      expect(layer('island-scrim-band')).toBeNull();
      expect(layer('island-scrim-hero')).toBeNull();
      expect(layer('island-scrim')).toBeNull();
      scroll.scrolled = true;
      view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
      expect(layer('island-scrim-soft')?.getAttribute('style')).toBe(fade?.getAttribute('style'));
      cleanup(); scroll.scrolled = false;
    }
  });
  it('soft fade token holds the signed-off safe-area stops without a transition', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toContain('--island-soft-fade: linear-gradient(180deg, rgba(10,10,12,0.92) 0px, rgba(10,10,12,0.80) var(--sat, 0px), rgba(10,10,12,0.35) calc(var(--sat, 0px) + 48px), rgba(10,10,12,0) calc(var(--sat, 0px) + 96px));');
    mount('/tourhub');
    expect(layer('island-scrim-soft')?.style.transition).toBe('');
  });
  it('other routes have no opt-in fade and retain canonical glass', () => {
    mount('/profile/ben');
    expect(layer('island-scrim-soft')).toBeNull();
    const left = document.querySelector<HTMLElement>('[aria-label="Go to home"]');
    expect(left?.style.background).toBe('rgba(14, 14, 16, 0.84)');
    expect(left?.style.transition).toBe('');
  });
  it('legacy band and fades have no remaining route consumers or rendered layers', () => {
    const src = readFileSync('src/features/chrome-v2/ChromeIsland.tsx', 'utf8');
    expect(src).not.toContain('data-chrome="island-scrim-band"');
    expect(src).not.toContain('data-chrome="island-scrim-hero"');
    expect(src).not.toContain('data-chrome="island-scrim"');
  });
  it('no wordmark on /tourhub', () => {
    scroll.scrolled = true;
    mount('/tourhub');
    expect(Array.from(document.querySelectorAll('img')).some((i) => i.getAttribute('src')?.includes('wordmark'))).toBe(false);
  });
  it('arriving from a scrolled page: the route-change reset clears the flag', async () => {
    const real = await vi.importActual<typeof import('@/hooks/useScrollDirection')>('@/hooks/useScrollDirection');
    const { renderHook } = await import('@testing-library/react');
    const el = document.createElement('div');
    document.body.appendChild(el);
    const off = real.registerNavScroller(el);
    const { result } = renderHook(() => real.useChromeScrolled());
    el.scrollTop = 400;
    await act(async () => { el.dispatchEvent(new Event('scroll')); await new Promise((r) => requestAnimationFrame(() => r(null))); });
    expect(result.current).toBe(true);
    // The route-change reset (GlobalBottomNavigation) clears the flag, so a
    // scrolled Clubhouse never carries into '/tourhub'.
    act(() => real.resetToExpanded());
    expect(result.current).toBe(false);
    off(); el.remove();
  });
});
