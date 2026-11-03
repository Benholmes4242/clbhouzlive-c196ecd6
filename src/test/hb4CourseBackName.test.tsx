import React, { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { IslandBackCapsule } from '@/features/chrome-v2/IslandBackCapsule';
import { useIslandBackName } from '@/features/chrome-v2/useIslandBackName';
import { useIslandBackNameValue } from '@/features/chrome-v2/islandBackNameStore';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';

let callback: IntersectionObserverCallback;
let options: IntersectionObserverInit | undefined;
let observed: Element | undefined;
let scroller: HTMLDivElement;
let off: () => void;
const original = window.IntersectionObserver;
const back = vi.fn();
function Hero({ name }: { name: string }) {
  const anchor = useRef<HTMLHeadingElement>(null);
  useIslandBackName(shortCourseName(name), anchor);
  return <h1 ref={anchor} data-testid="hero-name">{name}</h1>;
}
function StoreProbe() { const value = useIslandBackNameValue(); return <output data-testid="published-name">{value?.name ?? ''}</output>; }
function Controls({ name = 'Hayling Golf Club', hero = true }: { name?: string; hero?: boolean }) {
  return <><IslandBackCapsule onBack={back} label="Go back" />{hero && <Hero name={name} />}<StoreProbe /></>;
}
const mount = (props = {}) => render(<MemoryRouter initialEntries={['/courses/course-id']}><Controls {...props} /></MemoryRouter>);
const passed = (bottom = 55, intersecting = false) => act(() => callback([{ isIntersecting: intersecting, boundingClientRect: { bottom }, rootBounds: { top: 56 } } as IntersectionObserverEntry], {} as IntersectionObserver));
const move = async (top: number) => { scroller.scrollTop = top; await act(async () => { fireEvent.scroll(scroller); await new Promise(resolve => requestAnimationFrame(() => resolve(null))); }); };
beforeEach(() => {
  resetToExpanded(); back.mockClear(); options = undefined; observed = undefined;
  scroller = document.createElement('div'); scroller.id = 'root'; document.body.appendChild(scroller); off = registerNavScroller(scroller);
  window.IntersectionObserver = class { constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) { callback = cb; options = opts; } observe(el: Element) { observed = el; } disconnect() {} unobserve() {} } as unknown as typeof IntersectionObserver;
});
afterEach(() => { cleanup(); off(); scroller.remove(); resetToExpanded(); window.IntersectionObserver = original; vi.restoreAllMocks(); });
describe('HB4 course detail back name', () => {
  it('opts existing course details into fixed soft folding chrome only', () => {
    const spec = resolveChrome('/courses/course-id', new URLSearchParams());
    expect(spec).toMatchObject({ scrim: 'soft', condense: true, left: { kind: 'back', backTarget: 'history', backFallback: '/courses' } });
    expect(spec.scrollAway).toBeUndefined();
    expect(resolveChrome('/courses/course-id/reviews', new URLSearchParams()).chrome).toBe('none');
  });
  it('starts with the arrow-only back control and preserves its tap', () => {
    mount(); const button = screen.getByRole('button', { name: 'Go back' });
    expect(button).toHaveAttribute('data-named', 'false');
    expect(button.querySelector('svg')).toHaveAttribute('width', '30');
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();
    fireEvent.click(button); expect(back).toHaveBeenCalledTimes(1);
  });
  it('shows the short course name only above the boundary and open, hiding on fold or return', async () => {
    mount(); passed(1000); expect(screen.getByRole('button')).toHaveAttribute('data-named', 'false');
    passed(); expect(screen.getByRole('button')).toHaveAttribute('data-named', 'true');
    expect(screen.getByRole('button')).toHaveTextContent('Hayling');
    await move(160); expect(screen.getByRole('button')).toHaveAttribute('data-named', 'false');
    await move(140); expect(screen.getByRole('button')).toHaveAttribute('data-named', 'true');
    passed(160, true); expect(screen.getByRole('button')).toHaveAttribute('data-named', 'false');
  });
  it('updates the accessible label only while the name shows', async () => {
    mount(); expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    passed(); expect(screen.getByRole('button', { name: 'Back from Hayling' })).toBeTruthy();
    await move(160); expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });
  it('fits a long name down to the 13px floor without changing the text', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
    const name = 'A very long championship course name'; mount({ name }); passed();
    const span = document.querySelector<HTMLElement>('.island-back-name');
    expect(span?.style.fontSize).toBe('13px'); expect(span?.textContent).toBe(name);
  });
  it('clears its published name when the hero unmounts', () => {
    const { rerender } = mount(); passed(); expect(screen.getByTestId('published-name')).toHaveTextContent('Hayling');
    rerender(<MemoryRouter initialEntries={['/courses/course-id']}><Controls hero={false} /></MemoryRouter>);
    expect(screen.getByTestId('published-name').textContent).toBe('');
    expect(screen.getByRole('button', { name: 'Go back' })).toHaveAttribute('data-named', 'false');
  });
  it('observes the actual heading using the shared 56px boundary and page root', () => {
    mount(); expect(observed).toBe(screen.getByTestId('hero-name')); expect(options?.root).toBe(scroller);
    expect(options?.rootMargin).toBe('-56px 0px 0px 0px'); expect(options?.threshold).toEqual([0, 1]);
  });
  it('uses IntersectionObserver only and shares boundary measurement with IslandDock', () => {
    const hook = readFileSync('src/features/chrome-v2/useIslandBackName.ts', 'utf8');
    const dock = readFileSync('src/features/chrome-v2/IslandDock.tsx', 'utf8');
    expect(hook).toContain('new IntersectionObserver'); expect(hook).not.toContain('addEventListener');
    expect(hook).toContain('measureIslandBoundary()'); expect(dock).toContain('measureIslandBoundary()');
  });
  it('defines instant reduced-motion back and name transitions', () => {
    const css = readFileSync('src/features/chrome-v2/island-back.css', 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion:reduce) { .island-back.island-back, .island-back-fold { transition:none; } }');
  });
  it('does not leak a previous detail name into a different route', () => {
    mount(); passed();
    render(<MemoryRouter initialEntries={['/handicap']}><IslandBackCapsule onBack={back} label="Other back" /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Other back' })).toHaveAttribute('data-named', 'false');
  });
});