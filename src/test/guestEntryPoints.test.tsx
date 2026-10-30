/**
 * GUEST BROWSING Stage 1 — session bootstrap, blocked-route actions, sheet and
 * write-layer gates. The switch is a getter so each test picks on or off.
 * react-i18next mock copied in full per project rule.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  on: true,
  anon: vi.fn(),
  stored: false,
  track: vi.fn(),
  session: null as null | { user: { id: string; is_anonymous: boolean } },
}));

vi.mock('@/features/guest/guestConfig', () => ({
  get GUEST_BROWSING_ENABLED() { return h.on; },
}));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => h.stored }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInAnonymously: h.anon,
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        cb('INITIAL_SESSION', { user: { id: 'guest-1', is_anonymous: true } });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  },
}));

import { signedOutOutcome, useGuestSessionBootstrap } from '@/features/guest/guestSession';
import { guestActionForPath } from '@/features/guest/guestRoutes';
import { assertNotGuestWrite, GuestGatedError, useGuestSheetGate } from '@/features/guest/useGuestActionGate';
import { getGuestCardRequest, resetGuestGateState } from '@/features/guest/guestGateStore';

beforeEach(() => {
  vi.clearAllMocks();
  h.on = true;
  h.stored = false;
  h.anon.mockResolvedValue({ data: {}, error: null });
  resetGuestGateState();
});
afterEach(cleanup);

describe('RootGate signed-out outcome', () => {
  it('switch off: a signed-out phone goes to /auth exactly as today', () => {
    expect(signedOutOutcome({ enabled: false, envStatus: 'native', guestAttempt: 'idle', stored: false })).toBe('auth');
    expect(signedOutOutcome({ enabled: false, envStatus: 'native', guestAttempt: 'pending', stored: false })).toBe('auth');
  });
  it('switch on: holds the canvas while the anonymous session is minted', () => {
    expect(signedOutOutcome({ enabled: true, envStatus: 'native', guestAttempt: 'pending', stored: false })).toBe('hold');
  });
  it('switch on: a failed anonymous sign-in falls back to /auth', () => {
    expect(signedOutOutcome({ enabled: true, envStatus: 'native', guestAttempt: 'failed', stored: false })).toBe('auth');
  });
});

describe('anonymous session bootstrap', () => {
  it('switch off: never calls signInAnonymously', () => {
    h.on = false;
    renderHook(() => useGuestSessionBootstrap({ envStatus: 'native', authLoading: false, hasUser: false }));
    expect(h.anon).not.toHaveBeenCalled();
  });
  it('switch on: signs in anonymously once on a native cold start and tracks it', async () => {
    const { rerender } = renderHook(() => useGuestSessionBootstrap({ envStatus: 'native', authLoading: false, hasUser: false }));
    rerender();
    await waitFor(() => expect(h.track).toHaveBeenCalledWith('guest_session_started'));
    expect(h.anon).toHaveBeenCalledTimes(1);
  });
  it('switch on: never runs with a stored session, a signed-in user or on the web', () => {
    h.stored = true;
    renderHook(() => useGuestSessionBootstrap({ envStatus: 'native', authLoading: false, hasUser: false }));
    h.stored = false;
    renderHook(() => useGuestSessionBootstrap({ envStatus: 'native', authLoading: false, hasUser: true }));
    renderHook(() => useGuestSessionBootstrap({ envStatus: 'web', authLoading: false, hasUser: false }));
    expect(h.anon).not.toHaveBeenCalled();
  });
  it('switch on: a failure reports failed and tracks the reason', async () => {
    h.anon.mockResolvedValue({ data: {}, error: { message: 'Anonymous sign-ins are disabled' } });
    const { result } = renderHook(() => useGuestSessionBootstrap({ envStatus: 'native', authLoading: false, hasUser: false }));
    await waitFor(() => expect(result.current).toBe('failed'));
    expect(h.track).toHaveBeenCalledWith('guest_session_failed', { reason: 'Anonymous sign-ins are disabled' });
  });
});

describe('blocked routes name their action', () => {
  it('maps rate, own profile, handicap, messages and claim; everything else is other', () => {
    expect(guestActionForPath('/courses/abc/rate')).toBe('rate');
    expect(guestActionForPath('/rate-course-v2/abc')).toBe('rate');
    expect(guestActionForPath('/profile')).toBe('own_profile');
    expect(guestActionForPath('/edit-profile')).toBe('own_profile');
    expect(guestActionForPath('/manage/handicap')).toBe('connect_handicap');
    expect(guestActionForPath('/messages/123')).toBe('message');
    expect(guestActionForPath('/business/create')).toBe('claim_course');
    expect(guestActionForPath('/notificationmessages')).toBe('other');
  });
});

describe('sheet gate (report, claim)', () => {
  it('a guest never sees the sheet: it closes and the action card opens', () => {
    const close = vi.fn();
    const { result } = renderHook(() => useGuestSheetGate(true, close, 'report'));
    expect(result.current).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
    expect(getGuestCardRequest()).toMatchObject({ kind: 'action', action: 'report' });
  });
  it('switch off: the sheet opens untouched', () => {
    h.on = false;
    const close = vi.fn();
    const { result } = renderHook(() => useGuestSheetGate(true, close, 'claim_course'));
    expect(result.current).toBe(true);
    expect(close).not.toHaveBeenCalled();
    expect(getGuestCardRequest()).toBeNull();
  });
});

describe('write-layer backstop', () => {
  it('a guest write throws before anything is sent and opens the card', () => {
    expect(() => assertNotGuestWrite('like')).toThrow(GuestGatedError);
    expect(getGuestCardRequest()).toMatchObject({ kind: 'action', action: 'like' });
  });
  it('switch off: no-op', () => {
    h.on = false;
    expect(() => assertNotGuestWrite('comment')).not.toThrow();
    expect(getGuestCardRequest()).toBeNull();
  });
});

// render is imported for parity with sibling guest suites' harness.
void render;
