import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IslandDock } from '@/features/chrome-v2/IslandDock';
import { resolveChrome } from '@/features/chrome-v2/registry';
import CoursesShellTabs from '@/features/courses/components/CoursesShellTabs';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

let callback: IntersectionObserverCallback;
let scroller: HTMLDivElement;
let off: () => void;
const original = window.IntersectionObserver;
function Controls() {
  const anchor = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'explore' | 'top100'>('explore');
  return <><div ref={anchor}><CoursesShellTabs activeTab={tab} onTabChange={setTab} /></div>
    <IslandDock anchorRef={anchor}>{() => <CoursesShellTabs docked activeTab={tab} onTabChange={setTab} />}</IslandDock></>;
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
  window.IntersectionObserver = class { constructor(cb: IntersectionObserverCallback) { callback = cb; } observe() {} disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); off(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; });
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
  it('preserves course detail and deeper route chrome', () => {
    expect(resolveChrome('/courses/course-id', new URLSearchParams())).toEqual({ chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/courses' }, tone: 'dark', bleed: true, scrollAway: true });
    const deeper = resolveChrome('/courses/course-id/reviews', new URLSearchParams());
    expect(deeper.chrome).toBe('none'); expect(deeper.condense).toBeUndefined(); expect(deeper.scrim).toBeUndefined();
  });
});