import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { TourPageShell } from '@/features/tourhub/components/TourPageShell';
import { useChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';
import { IslandBackCapsule } from '@/features/chrome-v2/IslandBackCapsule';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
import { TournamentHero } from '@/features/tourhub/tournament-v2/sections/TournamentV3Sections';
import { HeroSection } from '@/features/tourhub/player-v2/sections/HeroSection';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
import type { TourPlayer } from '@/features/tourhub/hooks/useTourHubData';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/components/chrome/AppHeader', () => ({ AppHeader: () => <div data-testid="app-header" /> }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({ PlayerAvatar: () => <div data-player-avatar /> }));

const routes = [
  ['/tourhub/tournament/e', '/tourhub?tab=schedule', 'VidantaWorld Mexico Open', 'tournament'],
  ['/tourhub/player/p', '/tourhub?tab=players', 'Andrew Novak', 'player'],
] as const;
let callback: IntersectionObserverCallback;
let observed: Element | undefined;
let scroller: HTMLDivElement;
let unregister: () => void;
const nativeObserver = window.IntersectionObserver;
function Suppression() { return <output data-testid="suppression">{String(useChromeSuppressed())}</output>; }
function Name({ name, kind }: { name: string | null; kind: 'tournament' | 'player' }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useIslandBackName(name, ref);
  if (!name) return null;
  return kind === 'tournament'
    ? <TournamentHero nameRef={ref} meta={{ id: 'e', name } as TournamentMeta} phase="upcoming" rows={[]} field={[]} last={[]} holes={[]} image={null} />
    : <HeroSection nameRef={ref} player={{ id: 'p', full_name: name } as TourPlayer} header={null} results={[]} tour="pga" race={null} following={false} busy={false} onFollow={() => {}} onPick={() => {}} />;
}
function NamedPage({ name, kind }: { name: string | null; kind: 'tournament' | 'player' }) {
  return <><IslandBackCapsule label="Go back" onBack={() => {}} /><Name name={name} kind={kind} /></>;
}
function past(bottom = 55, intersecting = false) {
  act(() => callback([{ isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as IntersectionObserverEntry], {} as IntersectionObserver));
}
async function move(top: number) { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); }
beforeEach(() => {
  resetToExpanded(); observed = undefined;
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe(target: Element) { observed = target; } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = nativeObserver; });

describe('G2B Tour detail header B', () => {
  it.each(routes)('%s has the canonical dark back/fade/folding spec', (route, fallback) => {
    expect(resolveChrome(route, new URLSearchParams())).toEqual({ chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: fallback }, tone: 'dark', bleed: true, scrim: 'soft', condense: true });
  });
  it.each(routes)('%s headerB mounts no old header and makes no suppression claim', (route) => {
    render(<MemoryRouter initialEntries={[route]}><TourPageShell headerB title="Name"><div data-testid="body" /></TourPageShell><Suppression /></MemoryRouter>);
    expect(screen.queryByTestId('app-header')).toBeNull(); expect(screen.getByTestId('body')).toBeTruthy(); expect(screen.getByTestId('suppression').textContent).toBe('false');
  });
  it.each(['/tourhub?tab=schedule', '/tourhub?tab=leaderboard'])('keeps legacy shell ownership on %s', (route) => {
    const view = render(<MemoryRouter initialEntries={[route]}><TourPageShell title="Tour"><div /></TourPageShell><Suppression /></MemoryRouter>);
    expect(screen.getByTestId('app-header')).toBeTruthy(); expect(screen.getByTestId('suppression').textContent).toBe('true');
    view.unmount(); render(<Suppression />); expect(screen.getByTestId('suppression').textContent).toBe('false');
  });
  it.each(routes)('%s observes its actual full-name h1 and clears when unavailable', async (route, _fallback, name, kind) => {
    const view = render(<MemoryRouter initialEntries={[route]}><NamedPage name={name} kind={kind} /></MemoryRouter>);
    expect(observed).toBe(screen.getByRole('heading', { level: 1 }));
    expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    past(); expect(screen.getByRole('button', { name: `Back from ${name}` })).toHaveAttribute('data-named', 'true');
    await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    await move(140); expect(screen.getByRole('button', { name: `Back from ${name}` })).toBeTruthy();
    view.rerender(<MemoryRouter initialEntries={[route]}><NamedPage name={null} kind={kind} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
  });
  it.each(routes)('%s error/loading name stays arrow-only', (route, _fallback, _name, kind) => {
    render(<MemoryRouter initialEntries={[route]}><NamedPage name={null} kind={kind} /></MemoryRouter>);
    expect(observed).toBeUndefined(); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
  });
  it('does not opt in deeper Tour routes', () => {
    expect(resolveChrome('/tourhub/player/p/stats', new URLSearchParams()).chrome).toBe('none');
    expect(resolveChrome('/tourhub/tournament/e/other', new URLSearchParams()).chrome).toBe('none');
  });
});