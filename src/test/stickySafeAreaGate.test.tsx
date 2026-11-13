import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { PageLoadGate, useSectionReady } from '@/components/courses/browse/PageLoadGate';
import { useStickySafeAreaState } from '@/components/chrome/StickySafeAreaScrim';

let resize: ResizeObserverCallback;
let intersect: IntersectionObserverCallback;
let top = 350;
function Sentinel({ ready }: { ready: boolean }) {
  useSectionReady('hero', ready);
  const { sentinelRef, stuck } = useStickySafeAreaState();
  return <div ref={sentinelRef} data-testid="sentinel" data-stuck={String(stuck)} />;
}
const gate = (ready: boolean) => <PageLoadGate expect={['hero']}><Sentinel ready={ready} /></PageLoadGate>;
beforeEach(() => {
  top = 350;
  document.documentElement.style.setProperty('--sat', '47px');
  vi.stubGlobal('ResizeObserver', class { constructor(cb: ResizeObserverCallback) { resize = cb; } observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { constructor(cb: IntersectionObserverCallback) { intersect = cb; } observe() {} disconnect() {} });
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.closest('[style*="display: none"]') ? [] : [{ top }]) as unknown as DOMRectList;
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return { top: this.closest('[style*="display: none"]') ? 0 : top } as DOMRect;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.style.removeProperty('--sat'); });
describe('Sticky notch state across a load gate', () => {
  it('is not stuck for a sentinel inside an unrevealed PageLoadGate', () => {
    const { getByTestId } = render(gate(false));
    act(() => intersect([{ isIntersecting: false, boundingClientRect: { top: 0 } } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(getByTestId('sentinel')).toHaveAttribute('data-stuck', 'false');
  });
  it('re-measures after reveal and remains unstuck below the 47px notch', () => {
    const { getByTestId, rerender } = render(gate(false));
    rerender(gate(true));
    act(() => resize([], {} as ResizeObserver));
    expect(getByTestId('sentinel')).toHaveAttribute('data-stuck', 'false');
    top = 40;
    act(() => resize([], {} as ResizeObserver));
    expect(getByTestId('sentinel')).toHaveAttribute('data-stuck', 'true');
  });
  it('becomes stuck after scrolling the revealed sentinel past the notch', () => {
    const { getByTestId } = render(gate(true));
    act(() => resize([], {} as ResizeObserver));
    expect(getByTestId('sentinel')).toHaveAttribute('data-stuck', 'false');
    top = 40;
    act(() => intersect([{ isIntersecting: false, boundingClientRect: { top } } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(getByTestId('sentinel')).toHaveAttribute('data-stuck', 'true');
  });
});