/**
 * GUEST STAGE 2.2 §4 — the scroll lock on a short page (Claude's ruling).
 * Locks at 1.5 viewports OR within 120px of the end, only after a real scroll.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({ track: vi.fn(), scroller: null as HTMLElement | null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => true, isGuestUser: () => true }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestGateShown: (a: unknown) => h.track(a) }));
vi.mock('@/lib/getScrollParent', () => ({ getPrimaryScrollElement: () => h.scroller ?? undefined }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }) } } }));

import { shouldScrollLock, useGuestScrollGate } from '@/features/guest/useGuestSurfaceGate';
import { isSurfaceLocked } from '@/features/guest/guestGateStore';

function makeScroller(scrollHeight: number, clientHeight: number) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
  let top = 0;
  Object.defineProperty(el, 'scrollTop', { get: () => top, set: v => { top = v; }, configurable: true });
  document.body.appendChild(el);
  return el;
}
const scrollTo = (el: HTMLElement, top: number) => act(() => { el.scrollTop = top; el.dispatchEvent(new Event('scroll')); });

let n = 0;
const surface = () => `test-surface-${++n}`;
beforeEach(() => { h.track.mockClear(); Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true }); });
afterEach(() => { cleanup(); h.scroller?.remove(); h.scroller = null; document.body.innerHTML = ''; });

describe('shouldScrollLock', () => {
  const base = { startTop: 0, viewportHeight: 800, clientHeight: 800 };
  it('never locks before a real scroll, even on a short page', () => {
    expect(shouldScrollLock({ ...base, top: 0, scrollHeight: 900 })).toBe(false);
  });
  it('locks within 120px of the end of a short page', () => {
    expect(shouldScrollLock({ ...base, top: 79, scrollHeight: 1000 })).toBe(false); // 121px left
    expect(shouldScrollLock({ ...base, top: 80, scrollHeight: 1000 })).toBe(true); // 120px left
  });
  it('locks past 1.5 viewports on a long page', () => {
    expect(shouldScrollLock({ ...base, top: 1200, scrollHeight: 10000 })).toBe(false);
    expect(shouldScrollLock({ ...base, top: 1201, scrollHeight: 10000 })).toBe(true);
  });
});

describe('useGuestScrollGate', () => {
  it('a short page locks at its end', () => {
    const el = makeScroller(1100, 800); h.scroller = el; const s = surface();
    renderHook(() => useGuestScrollGate(s));
    scrollTo(el, 100);
    expect(isSurfaceLocked(s)).toBe(false);
    scrollTo(el, 300);
    expect(isSurfaceLocked(s)).toBe(true);
    expect(h.track).toHaveBeenCalledWith({ surface: s, trigger: 'scroll' });
  });
  it('a page that cannot scroll never locks by scroll', () => {
    const el = makeScroller(800, 800); h.scroller = el; const s = surface();
    renderHook(() => useGuestScrollGate(s));
    scrollTo(el, 0);
    expect(isSurfaceLocked(s)).toBe(false);
    expect(h.track).not.toHaveBeenCalled();
  });
});
