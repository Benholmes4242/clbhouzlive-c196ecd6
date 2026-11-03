import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageTitle } from '@/features/chrome-v2/PageTitle';
import { ScopeSegments } from '@/features/explore-magazine/ScoresFilterHead';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';
import { IslandBackCapsule } from '@/features/chrome-v2/IslandBackCapsule';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
import type { ScopeKey } from '@/components/explore-tab-new/courseled/boardFilters';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const original = window.IntersectionObserver;
const callbacks = new Map<Element, IntersectionObserverCallback>();
let scroller: HTMLDivElement;
let unregister: () => void;
function Controls({ scopeVisible = true }: { scopeVisible?: boolean }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useIslandBackName('Rounds', titleRef);
  const [scope, setScope] = useState<ScopeKey>('everyone');
  return <><IslandBackCapsule label="Go back" onBack={() => {}} /><PageTitle ref={titleRef} title="Rounds" />{scopeVisible && <ScopeSegments scope={scope} onScopeChange={setScope} clubApplies />}</>;
}
function node(selector: string) { const value = document.querySelector<HTMLElement>(selector); if (!value) throw new Error(`Missing ${selector}`); return value; }
function pass(selector: string, bottom: number, intersecting = false) {
  const target = node(selector); const callback = callbacks.get(target); if (!callback) throw new Error('Missing observer');
  act(() => callback([{ target, isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
}
async function move(top: number) { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); }
beforeEach(() => {
  resetToExpanded(); callbacks.clear();
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); unregister = registerNavScroller(scroller);
  window.IntersectionObserver = class { cb: IntersectionObserverCallback; constructor(cb: IntersectionObserverCallback) { this.cb = cb; } observe(target: Element) { callbacks.set(target, this.cb); } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; });
describe('G2C Rounds header', () => {
  it('opts /rounds into soft dark back islands with the /amateur fallback', () => {
    expect(resolveChrome('/rounds', new URLSearchParams())).toEqual({ chrome: 'island', tone: 'dark', bleed: true, scrim: 'soft', condense: true, left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/amateur' } });
  });
  it('PageTitle forwards its h1 and keeps subtitle/action optional', () => {
    const ref = React.createRef<HTMLHeadingElement>();
    const view = render(<PageTitle ref={ref} title="Rounds" subtitle="Sub" trailingAction={<a href="/amateur">Action</a>} />);
    expect(ref.current).toBe(screen.getByRole('heading', { level: 1 }));
    expect(screen.getByText('Sub')).toHaveClass('chrome-page-title-subtitle'); expect(screen.getByRole('link')).toBeTruthy();
    view.rerender(<PageTitle title="Rounds" />); expect(screen.queryByText('Sub')).toBeNull(); expect(screen.queryByRole('link')).toBeNull();
  });
  it('shows Rounds only past its actual h1 while expanded', async () => {
    render(<MemoryRouter initialEntries={['/rounds']}><Controls /></MemoryRouter>);
    pass('h1', 160, true); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    pass('h1', 55); expect(screen.getByRole('button', { name: 'Back from Rounds' })).toHaveAttribute('data-named', 'true');
    await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
    await move(140); expect(screen.getByRole('button', { name: 'Back from Rounds' })).toBeTruthy();
  });
  it('docks the scope only past the row and expanded, retaining its hidden copy', async () => {
    render(<MemoryRouter initialEntries={['/rounds']}><Controls /></MemoryRouter>);
    const dock = node('[data-island-dock]'); const copy = node('[data-rounds-scope-copy="docked"]');
    expect(dock).toHaveAttribute('aria-hidden', 'true'); expect(dock).toHaveAttribute('inert');
    pass('[data-rounds-scope-anchor]', 160, true); expect(dock).toHaveAttribute('data-shown', 'false');
    pass('[data-rounds-scope-anchor]', 55); expect(dock).toHaveAttribute('data-shown', 'true');
    await move(160); expect(dock).toHaveAttribute('data-shown', 'false'); expect(node('[data-rounds-scope-copy="docked"]')).toBe(copy);
    await move(140); expect(dock).toHaveAttribute('data-shown', 'true');
  });
  it('shares selections in both directions without changing scope semantics', () => {
    render(<MemoryRouter initialEntries={['/rounds']}><Controls /></MemoryRouter>); pass('[data-rounds-scope-anchor]', 55);
    fireEvent.click(within(node('[data-island-dock]')).getAllByRole('radio')[1]);
    expect(within(node('[data-rounds-scope-copy="in-place"]')).getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(node('[data-rounds-scope-copy="in-place"]')).getAllByRole('radio')[2]);
    expect(within(node('[data-island-dock]')).getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');
  });
  it('does not create a dock when the caller omits the gated scope', () => {
    render(<MemoryRouter initialEntries={['/rounds']}><Controls scopeVisible={false} /></MemoryRouter>);
    expect(document.querySelector('[data-island-dock]')).toBeNull(); expect(screen.queryByRole('radiogroup')).toBeNull();
  });
  it('retains the single original scope on other routes', () => {
    render(<MemoryRouter initialEntries={['/amateur']}><ScopeSegments scope="everyone" onScopeChange={() => {}} clubApplies={false} /></MemoryRouter>);
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1); expect(screen.getAllByRole('radio')).toHaveLength(2); expect(document.querySelector('[data-island-dock]')).toBeNull();
  });
});