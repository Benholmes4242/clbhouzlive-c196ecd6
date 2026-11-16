import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IslandDock } from '@/features/chrome-v2/IslandDock';
import { resolveChrome } from '@/features/chrome-v2/registry';
import CoursesShellTabs from '@/features/courses/components/CoursesShellTabs';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

let callback: IntersectionObserverCallback;
let scroller: HTMLDivElement;
let off: () => void;
let observed: Element[];
let disconnected: Element[];
const original = window.IntersectionObserver;
const originalRect = HTMLElement.prototype.getBoundingClientRect;
/* jsdom rects are all zero, which the dock's immediate recompute would read as
   "above the islands". Stub a rect below the boundary so mount starts unpinned,
   matching the first passed(160, true) entry the tests already send. */
const stubRect = () => ({ top: 100, bottom: 160, left: 0, right: 375, width: 375, height: 60, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;
function Controls() {
  const anchor = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'explore' | 'top100'>('explore');
  return <><div ref={anchor}><CoursesShellTabs activeTab={tab} onTabChange={setTab} /></div>
    <IslandDock anchorRef={anchor}>{() => <CoursesShellTabs docked activeTab={tab} onTabChange={setTab} />}</IslandDock></>;
}
function SwappingAnchor() {
  const anchor = useRef<HTMLDivElement>(null);
  const [second, setSecond] = useState(false);
  return <>{second ? <div key="second" ref={anchor} data-anchor="second" /> : <div key="first" ref={anchor} data-anchor="first" />}
    <button onClick={() => setSecond(true)}>swap anchor</button>
    <IslandDock anchorRef={anchor}>{() => null}</IslandDock></>;
}
const mount = () => render(<MemoryRouter initialEntries={['/courses']}><Controls /></MemoryRouter>);
function element(selector: string) {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
const dock = () => element('[data-island-dock]');
const passed = (bottom: number, intersecting = false) => act(() => callback([{ isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as IntersectionObserverEntry], {} as IntersectionObserver));
const move = async (top: number) => { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); };
beforeEach(() => {
  resetToExpanded();
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); off = registerNavScroller(scroller);
  observed = []; disconnected = [];
  window.IntersectionObserver = class {
    private seen: Element[] = [];
    constructor(cb: IntersectionObserverCallback) { callback = cb; }
    observe(el: Element) { this.seen.push(el); observed.push(el); }
    disconnect() { disconnected.push(...this.seen); this.seen = []; }
    unobserve() {}
  } as unknown as typeof IntersectionObserver;
  HTMLElement.prototype.getBoundingClientRect = stubRect;
});
afterEach(() => { cleanup(); off(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; HTMLElement.prototype.getBoundingClientRect = originalRect; });
describe('HB3 Courses island dock', () => {
  it('/courses uses Clubhouse soft fading and squircle condensation without scrollAway', () => {
    const spec = resolveChrome('/courses', new URLSearchParams());
    expect(spec).toMatchObject({ chrome: 'island', left: { kind: 'logo' }, scrim: 'soft', condense: true });
    expect(spec.scrollAway).toBeUndefined();
    expect(spec).toMatchObject(resolveChrome('/', new URLSearchParams()));
  });
  it('docks only above the island boundary while islands are open', async () => {
    mount(); passed(160, true); expect(dock()).toHaveAttribute('data-shown', 'false');
    passed(1000); expect(dock()).toHaveAttribute('data-shown', 'false');
    passed(55); expect(dock()).toHaveAttribute('data-shown', 'true');
    await move(160); expect(dock()).toHaveAttribute('data-shown', 'false');
    await move(140); expect(dock()).toHaveAttribute('data-shown', 'true');
  });
  it('keeps the hidden docked switch mounted inert and aria-hidden', async () => {
    mount(); const row = element('[data-courses-controls="docked"]');
    expect(dock()).toHaveAttribute('aria-hidden', 'true'); expect(dock()).toHaveAttribute('inert');
    expect(within(dock()).queryByRole('tab')).toBeNull();
    passed(55); await move(160);
    expect(element('[data-courses-controls="docked"]')).toBe(row);
    expect(dock()).toHaveAttribute('aria-hidden', 'true'); expect(dock()).toHaveAttribute('inert');
  });
  it('shares selection between docked and in-place switches', () => {
    mount(); passed(55); const inPlace = element('[data-courses-controls="in-place"]');
    fireEvent.click(within(dock()).getByRole('tab', { name: 'Top 100' }));
    expect(within(inPlace).getByRole('tab', { name: 'Top 100' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(inPlace).getByRole('tab', { name: 'Courses' }));
    expect(within(dock()).getByRole('tab', { name: 'Courses' })).toHaveAttribute('aria-selected', 'true');
  });
  it('marks only the selected docked segment for shared selected-glass treatment', () => {
    mount(); passed(55);
    expect(within(dock()).getAllByRole('tab').filter(tab => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(within(dock()).getByRole('tab', { name: 'Courses' })).toHaveAttribute('aria-selected', 'true');
    expect(within(dock()).getByRole('tab', { name: 'Top 100' })).toHaveAttribute('aria-selected', 'false');
  });
  it('switching tabs via the docked copy then returning to the top shows exactly one tab row', () => {
    mount(); passed(55); expect(dock()).toHaveAttribute('data-shown', 'true');
    fireEvent.click(within(dock()).getByRole('tab', { name: 'Top 100' }));
    passed(160, true);
    expect(dock()).toHaveAttribute('data-shown', 'false');
    expect(dock()).toHaveAttribute('aria-hidden', 'true');
    const inPlace = element('[data-courses-controls="in-place"]');
    expect(within(inPlace).getByRole('tab', { name: 'Top 100' })).toHaveAttribute('aria-selected', 'true');
  });
  it('on Top 100, scrolling the in-flow row above the islands shows the dock, and scrolling back hides it', () => {
    mount();
    fireEvent.click(within(element('[data-courses-controls="in-place"]')).getByRole('tab', { name: 'Top 100' }));
    passed(160, true); expect(dock()).toHaveAttribute('data-shown', 'false');
    passed(55); expect(dock()).toHaveAttribute('data-shown', 'true');
    passed(160, true); expect(dock()).toHaveAttribute('data-shown', 'false');
  });
  it('re-observes when the anchor element is replaced', () => {
    render(<MemoryRouter initialEntries={['/courses']}><SwappingAnchor /></MemoryRouter>);
    const first = element('[data-anchor="first"]');
    expect(observed).toContain(first);
    fireEvent.click(screen.getByRole('button', { name: 'swap anchor' }));
    const second = element('[data-anchor="second"]');
    expect(observed[observed.length - 1]).toBe(second);
    expect(disconnected).toContain(first);
  });
  it('preserves course detail and deeper route chrome', () => {
    expect(resolveChrome('/courses/course-id', new URLSearchParams())).toEqual({ chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/courses' }, tone: 'dark', bleed: true, scrim: 'soft', condense: true });
    const deeper = resolveChrome('/courses/course-id/reviews', new URLSearchParams());
    expect(deeper.chrome).toBe('none'); expect(deeper.condense).toBeUndefined(); expect(deeper.scrim).toBeUndefined();
  });
});