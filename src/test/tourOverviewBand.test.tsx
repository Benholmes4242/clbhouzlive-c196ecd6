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
  it('at rest: hero fade at 1 with its existing values, band at 0', () => {
    mount('/tourhub');
    const hero = layer('island-scrim-hero')!;
    expect(hero.style.opacity).toBe('1');
    expect(hero.style.height).toBe('140px');
    expect(hero.style.pointerEvents).toBe('none');
    expect(layer('island-scrim-band')!.style.opacity).toBe('0');
    expect(layer('island-scrim')).toBeNull();
  });
  it('scrolled: band at 1 with the Clubhouse values, fade at 0; reverses back', () => {
    scroll.scrolled = true;
    const view = mount('/tourhub');
    const band = layer('island-scrim-band')!;
    expect(band.style.opacity).toBe('1');
    expect(band.style.position).toBe('fixed');
    expect(band.style.background).toBe('rgba(10, 10, 12, 0.88)');
    expect(band.style.borderBottom.replace(/\s/g, '')).toBe('1pxsolidrgba(255,255,255,0.06)');
    expect(band.style.pointerEvents).toBe('none');
    expect(layer('island-scrim-hero')!.style.opacity).toBe('0');
    scroll.scrolled = false;
    view.rerender(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/tourhub']}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
    expect(layer('island-scrim-hero')!.style.opacity).toBe('1');
    expect(layer('island-scrim-band')!.style.opacity).toBe('0');
  });
  it('one shared band element in source, with env()/blur values and the reduced-motion transition', () => {
    const src = readFileSync('src/features/chrome-v2/ChromeIsland.tsx', 'utf8');
    expect(src.match(/data-chrome="island-scrim-band"/g)).toHaveLength(1);
    expect(src).toContain("(spec.scrim === true || spec.scrim === 'hero') && (");
    expect(src).toContain("height: 'calc(var(--sat, 0px) + 68px)'");
    expect(src).toContain("background: 'linear-gradient(180deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.25) 55%, rgba(10,10,12,0) 100%)'");
    expect(src).toContain("height: 'calc(var(--sat, 0px) + 80px)'");
    expect(src).toContain("background: 'linear-gradient(180deg, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.75) 45%, rgba(10,10,12,0) 100%)'");
    expect(src).toContain("backdropFilter: 'blur(20px) saturate(150%)'");
    expect(src).toContain("WebkitBackdropFilter: 'blur(20px) saturate(150%)'");
    expect(src).toContain("const scrimTransition = REDUCED_MOTION ? 'none' : 'opacity 180ms linear';");
    expect(src.match(/transition: scrimTransition/g)?.length).toBe(3);
  });
  it('/clubhouse and / keep their rest and band layers', () => {
    for (const path of ['/clubhouse', '/']) {
      mount(path);
      const rest = layer('island-scrim')!;
      expect(rest.style.opacity).toBe('1');
      expect(layer('island-scrim-band')!.style.opacity).toBe('0');
      expect(layer('island-scrim-hero')).toBeNull();
      cleanup();
    }
  });
  it('no wordmark on /tourhub', () => {
    scroll.scrolled = true;
    mount('/tourhub');
    expect(Array.from(document.querySelectorAll('img')).some((i) => i.getAttribute('src')?.includes('wordmark'))).toBe(false);
  });
  it('arriving at the top after a scrolled page resets the flag from the real position', async () => {
    const real = await vi.importActual<typeof import('@/hooks/useScrollDirection')>('@/hooks/useScrollDirection');
    const { renderHook } = await import('@testing-library/react');
    const el = document.createElement('div');
    document.body.appendChild(el);
    const off = real.registerNavScroller(el);
    const { result } = renderHook(() => real.useChromeScrolled());
    el.scrollTop = 400;
    await act(async () => { el.dispatchEvent(new Event('scroll')); await new Promise((r) => requestAnimationFrame(() => r(null))); });
    expect(result.current).toBe(true);
    el.scrollTop = 0;
    act(() => real.resetToExpanded());
    expect(result.current).toBe(false);
    el.scrollTop = 300;
    act(() => real.resetToExpanded());
    expect(result.current).toBe(true);
    el.scrollTop = 0; act(() => real.resetToExpanded());
    off(); el.remove();
  });
});
