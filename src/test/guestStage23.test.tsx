/**
 * GUEST STAGE 2.3 — scroller cache, course sheets sharing the course's look,
 * and a session hold that cannot hang.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const h = vi.hoisted(() => ({
  failed: vi.fn(),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  resolve: null as null | ((v: unknown) => void),
}));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => true, isGuestUser: () => true }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true, guestEnabledForHost: () => true }));
vi.mock('@/features/guest/guestAnalytics', () => ({
  trackGuestGateShown: () => {}, trackGuestSessionStarted: () => {}, trackGuestSessionFailed: (r: string) => h.failed(r),
}));
vi.mock('@/utils/native/envStatus', () => ({ useEnvStatus: () => 'preview' }));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInAnonymously: () => new Promise(r => { h.resolve = r; }),
    signOut: h.signOut,
  } },
}));

import { getDocumentScrollParent, __resetScrollerCache } from '@/lib/getScrollParent';
import { useGuestSheetScrollGate } from '@/features/guest/useGuestSurfaceGate';
import { courseSurfaceKey, getGuestCardRequest, isSurfaceLocked, lockSurface, resetGuestGateState } from '@/features/guest/guestGateStore';
import { GuestSessionHold } from '@/features/guest/GuestSessionHold';
import { GuestGateHost } from '@/features/guest/GuestGateHost';
import { openGuestCard, registerGuestCourseSheet, useGuestCourseSheetOpen } from '@/features/guest/guestGateStore';
import { useNavigate } from 'react-router-dom';
import { __resetGuestSignIn, GUEST_SIGN_IN_TIMEOUT_MS } from '@/features/guest/guestSession';

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

beforeEach(() => { resetGuestGateState(); __resetScrollerCache(); h.failed.mockClear(); h.signOut.mockClear(); h.resolve = null; __resetGuestSignIn(); });
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.useRealTimers(); });

describe('Stage 2.3 §1 — the scroller cache', () => {
  it('the first call while #root has overflow-y hidden still returns #root, and so does a call after unlock', () => {
    const root = document.createElement('div'); root.id = 'root'; root.style.overflowY = 'hidden';
    document.body.appendChild(root);
    expect(getDocumentScrollParent()).toBe(root);
    root.style.overflowY = 'auto';
    expect(getDocumentScrollParent()).toBe(root);
  });
  it('the fallback is never cached: once #root appears it wins', () => {
    expect(getDocumentScrollParent()).not.toBe(document.getElementById('root'));
    const root = document.createElement('div'); root.id = 'root';
    document.body.appendChild(root);
    expect(getDocumentScrollParent()).toBe(root);
  });
});

describe('Stage 2.3 §2 — course sheets share the course look', () => {
  it('a sheet locks at its threshold (1.5 sheet heights)', () => {
    const el = makeScroller(5000, 600);
    const { result } = renderHook(() => useGuestSheetScrollGate('c1', true));
    act(() => result.current(el));
    scrollTo(el, 900);
    expect(isSurfaceLocked(courseSurfaceKey('c1'))).toBe(false);
    scrollTo(el, 901);
    expect(isSurfaceLocked(courseSurfaceKey('c1'))).toBe(true);
  });
  it('a locked course shows the card as soon as its sheet opens', () => {
    lockSurface(courseSurfaceKey('c2'));
    renderHook(() => useGuestSheetScrollGate('c2', true));
    expect(getGuestCardRequest()).toEqual({ kind: 'scroll', surface: courseSurfaceKey('c2') });
  });
  it('a sheet lock locks its course page (one key)', () => {
    const el = makeScroller(1000, 600);
    const { result } = renderHook(() => useGuestSheetScrollGate('c3', true));
    act(() => result.current(el));
    scrollTo(el, 300); // within 120px of the end
    expect(isSurfaceLocked(courseSurfaceKey('c3'))).toBe(true);
    expect(getGuestCardRequest()).toEqual({ kind: 'scroll', surface: courseSurfaceKey('c3') });
  });
  it('another course is unaffected', () => {
    lockSurface(courseSurfaceKey('c4'));
    renderHook(() => useGuestSheetScrollGate('c5', true));
    expect(isSurfaceLocked(courseSurfaceKey('c5'))).toBe(false);
    expect(getGuestCardRequest()).toBeNull();
  });
});

describe('Stage 2.3 §3 — the hold cannot hang', () => {
  const mount = () => render(<MemoryRouter initialEntries={['/courses']}><GuestSessionHold><p>page</p></GuestSessionHold></MemoryRouter>);
  it('stops holding after 8 seconds and tracks guest_session_failed timeout', () => {
    vi.useFakeTimers();
    const { container, queryByText } = mount();
    expect(container.querySelector('[data-guest-session-hold]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(GUEST_SIGN_IN_TIMEOUT_MS); });
    expect(GUEST_SIGN_IN_TIMEOUT_MS).toBe(8000);
    expect(h.failed).toHaveBeenCalledWith('timeout');
    expect(container.querySelector('[data-guest-session-hold]')).toBeNull();
    expect(queryByText('page')).not.toBeNull();
  });
  it('a late success after the timeout is signed out again', async () => {
    vi.useFakeTimers();
    mount();
    act(() => { vi.advanceTimersByTime(GUEST_SIGN_IN_TIMEOUT_MS); });
    await act(async () => { h.resolve?.({ data: { session: {} }, error: null }); await Promise.resolve(); await Promise.resolve(); });
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('Stage 2.3 — leaving a locked course clears its card; raise only with a sheet', () => {
  it('a course scroll card is cleared when another tab is opened', () => {
    let go: (p: string) => void = () => {};
    const Nav = () => { const n = useNavigate(); go = n; return null; };
    lockSurface(courseSurfaceKey('c6'));
    openGuestCard({ kind: 'scroll', surface: courseSurfaceKey('c6') });
    render(<MemoryRouter initialEntries={['/courses/c6']}><Nav /><GuestGateHost /></MemoryRouter>);
    expect(document.querySelector('[data-guest-gate-card]')).not.toBeNull();
    act(() => go('/tourhub'));
    expect(getGuestCardRequest()).toBeNull();
    expect(document.querySelector('[data-guest-gate-card]')).toBeNull();
  });
  it('the raised layer is on only while a course sheet is registered', () => {
    const { result } = renderHook(() => useGuestCourseSheetOpen());
    expect(result.current).toBe(false);
    let release: () => void = () => {};
    act(() => { release = registerGuestCourseSheet(); });
    expect(result.current).toBe(true);
    act(() => release());
    expect(result.current).toBe(false);
  });
});
