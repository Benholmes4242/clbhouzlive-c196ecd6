import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { ExploreTopControls } from '@/features/explore-magazine/watch/ExploreTopControls';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

let callback: IntersectionObserverCallback;
let options: IntersectionObserverInit | undefined;
let scroller: HTMLDivElement;
let off: () => void;
const original = window.IntersectionObserver;
const move = async (top: number) => { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(r => requestAnimationFrame(() => r(null))); }); };
function Controls() {
  const [query, setQuery] = useState('');
  const [value, setValue] = useState('all');
  return <ExploreTopControls query={query} onQuery={setQuery} value={value} onChange={setValue} options={[{ id: 'all', label: 'For you' }, { id: 'quick', label: 'Shorts' }, { id: 'long', label: 'Long form' }, { id: 'community', label: 'Community' }]} ariaLabel="Filters" placeholder="Search" />;
}
const mount = () => render(<MemoryRouter initialEntries={['/amateur']}><Controls /></MemoryRouter>);
const dock = () => document.querySelector<HTMLElement>('[data-island-dock]') as HTMLElement;
const passed = (bottom = -10, intersecting = false) => act(() => callback([{ isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as IntersectionObserverEntry], {} as IntersectionObserver));
beforeEach(() => {
  resetToExpanded();
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); off = registerNavScroller(scroller);
  window.IntersectionObserver = class { constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) { callback = cb; options = opts; } observe() {} disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); off(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; });
describe('HB2 Explore island dock', () => {
  it('/amateur opts into soft fading and squircle condensation without scrollAway', () => {
    expect(resolveChrome('/amateur', new URLSearchParams())).toMatchObject({ chrome: 'island', left: { kind: 'logo' }, scrim: 'soft', condense: true });
    expect(resolveChrome('/amateur', new URLSearchParams()).scrollAway).toBeUndefined();
  });
  it('no docked controls while the in-place row remains visible', () => { mount(); passed(160, true); expect(dock()).toHaveAttribute('data-shown', 'false'); expect(dock().querySelector('[role="tablist"]')).toBeNull(); });
  it('only a row above the island boundary qualifies, not a row below the viewport', () => { mount(); passed(1000); expect(dock()).toHaveAttribute('data-shown', 'false'); passed(55); expect(dock()).toHaveAttribute('data-shown', 'true'); });
  it('appears below open islands, hides folded, and returns on up scroll', async () => { mount(); passed(); expect(dock()).toHaveAttribute('data-shown', 'true'); await move(160); expect(dock()).toHaveAttribute('data-shown', 'false'); await move(140); expect(dock()).toHaveAttribute('data-shown', 'true'); });
  it('docked filters update the same in-place selection and vice versa', () => {
    mount(); passed(); fireEvent.click(within(dock()).getByRole('tab', { name: 'Shorts' }));
    const inPlace = document.querySelector<HTMLElement>('[data-explore-controls="in-place"]') as HTMLElement;
    expect(within(inPlace).getByRole('tab', { name: 'Shorts' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(inPlace).getByRole('tab', { name: 'Community' })); expect(within(dock()).getByRole('tab', { name: 'Community' })).toHaveAttribute('aria-selected', 'true');
  });
  it('hidden dock is aria-hidden, inert and contains no focusable controls', () => { mount(); expect(dock()).toHaveAttribute('aria-hidden', 'true'); expect(dock()).toHaveAttribute('inert'); expect(dock().querySelector('button,input,[tabindex]')).toBeNull(); });
  it('focused docked search remains shown and shares query with the in-place field', async () => {
    mount(); passed(); fireEvent.click(within(dock()).getByRole('button', { name: 'Search' })); const input = within(dock()).getByRole('searchbox'); expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: 'links' } }); expect(document.querySelector<HTMLInputElement>('[data-explore-controls="in-place"] input')?.value).toBe('links');
    passed(160, true); await move(200); expect(dock()).toHaveAttribute('data-shown', 'true'); fireEvent.blur(input, { relatedTarget: document.body }); expect(dock()).toHaveAttribute('data-shown', 'false');
  });
  it('observes the page root with the island boundary, adding no scroll listener', () => { mount(); expect(options?.root).toBe(scroller); expect(options?.rootMargin).toBe('-56px 0px 0px 0px'); const source = readFileSync('src/features/chrome-v2/IslandDock.tsx', 'utf8'); expect(source).toContain('new IntersectionObserver'); expect(source).not.toContain('addEventListener'); });
  it('reduced motion disables dock transitions', () => { const css = readFileSync('src/features/chrome-v2/island-dock.css', 'utf8'); expect(css).toContain('@media (prefers-reduced-motion:reduce) { .island-dock { transition:none; } }'); });
});