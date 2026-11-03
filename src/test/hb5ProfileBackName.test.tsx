import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal', name: 'Ben', avatarUrl: null }, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => false }));

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';
import { useIslandBackNameValue } from '@/features/chrome-v2/islandBackNameStore';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

let callback: IntersectionObserverCallback;
let observed: Element | undefined;
let scroller: HTMLDivElement;
let off: () => void;
const original = window.IntersectionObserver;
function Hero({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useIslandBackName(name, ref);
  return <ProfileCoverBand coverUrl={null} avatar={null} displayName={name} subline={null} nameRef={ref} />;
}
function Probe() { const location = useLocation(); const value = useIslandBackNameValue(); return <><output data-testid="route">{location.pathname}</output><output data-testid="name">{value?.name ?? ''}</output></>; }
function Controls({ name = 'Chris Leeson', hero = true }: { name?: string; hero?: boolean }) { return <><ChromeIsland />{hero && <Hero name={name} />}<Probe /></>; }
const mount = (path = '/profile', props = {}, entries = [path]) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}><Controls {...props} /></MemoryRouter></QueryClientProvider>);
const passed = (bottom = 55, intersecting = false) => act(() => callback([{ isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as IntersectionObserverEntry], {} as IntersectionObserver));
const move = async (top: number) => { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); };
beforeEach(() => {
  resetToExpanded(); observed = undefined;
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); off = registerNavScroller(scroller);
  window.IntersectionObserver = class { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe(el: Element) { observed = el; } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); off(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; vi.restoreAllMocks(); });
describe('HB5 profile back-name header', () => {
  it.each(['/profile', '/profile/abc'])('opts %s into soft folding history-back chrome', path => {
    expect(resolveChrome(path, new URLSearchParams())).toMatchObject({ chrome: 'island', tone: 'dark', bleed: true, scrim: 'soft', condense: true, left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/' } });
    mount(path); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-island-back');
    expect(screen.queryByRole('button', { name: 'Go to home' })).toBeNull();
  });
  it('starts arrow-only and observes the real cover heading', () => {
    mount(); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    expect(observed).toBe(screen.getByRole('heading', { level: 1 }));
  });
  it('goes back through history', () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    mount('/profile/abc', {}, ['/courses', '/profile/abc']); fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('route').textContent).toBe('/courses');
  });
  it('falls back to home without history', () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Go back' })); expect(screen.getByTestId('route').textContent).toBe('/');
  });
  it('shows the full name only past the heading while open and hides when folded or returned', async () => {
    mount(); passed(1000); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    passed(); expect(screen.getByRole('button', { name: 'Back from Chris Leeson' })).toHaveAttribute('data-named', 'true');
    await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    await move(140); expect(screen.getByRole('button', { name: 'Back from Chris Leeson' })).toHaveAttribute('data-named', 'true');
    passed(160, true); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
  });
  it('fits the unchanged full long display name to 13px', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
    const name = 'Alexandra Elizabeth Montgomery-Worthington'; mount('/profile/abc', { name }); passed();
    const span = document.querySelector<HTMLElement>('.island-back-name');
    expect(span?.style.fontSize).toBe('13px'); expect(span?.textContent).toBe(name); expect(screen.getByTestId('name').textContent).toBe(name);
  });
  it('clears the published name on unmount', () => {
    const view = mount(); passed(); expect(screen.getByTestId('name').textContent).toBe('Chris Leeson'); view.unmount();
    render(<MemoryRouter><Probe /></MemoryRouter>); expect(screen.getByTestId('name').textContent).toBe('');
  });
  it.each(['/profile/abc/followers', '/profile/abc/following', '/profile/quest', '/profile/abc/edit'])('keeps %s out of soft folding chrome', path => {
    const spec = resolveChrome(path, new URLSearchParams()); expect(spec.condense).toBeUndefined(); expect(spec.scrim).toBeUndefined(); expect(spec.left?.kind).toBe('back');
  });
  it('preserves business profile logo and nonfolding chrome', () => {
    const spec = resolveChrome('/business/abc', new URLSearchParams()); expect(spec.condense).toBeUndefined(); expect(spec.scrim).toBeUndefined(); expect(spec.left).toBeUndefined();
  });
});