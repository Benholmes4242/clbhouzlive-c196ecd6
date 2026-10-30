import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ preview: true, anonymous: true, refresh: vi.fn(), profile: vi.fn(), track: vi.fn(), anon: vi.fn(), listener: undefined as undefined | ((e: string, s: unknown) => void) }));
vi.mock('@/utils/native/isNativeApp', () => ({ isPreviewHost: () => h.preview }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'same', is_anonymous: h.anonymous } }) }));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { refreshSession: h.refresh, signInAnonymously: h.anon, onAuthStateChange: (cb: (e: string, s: unknown) => void) => { h.listener = cb; cb('INITIAL_SESSION', { user: { id: 'same', is_anonymous: true } }); } },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: h.profile }) }) }),
} }));

import { refreshGuestConversion } from '@/features/guest/refreshGuestConversion';
import { handleGuestServerError, guestAwareFetch } from '@/features/guest/guestServerResponse';
import '@/features/guest/useGuestActionGate';
import { getGuestCardRequest, resetGuestGateState } from '@/features/guest/guestGateStore';
import { isGuestAllowedPath } from '@/features/guest/guestRoutes';
import { signedOutOutcome, useGuestSessionBootstrap } from '@/features/guest/guestSession';

beforeEach(() => {
  vi.clearAllMocks(); resetGuestGateState(); h.preview = true;
  h.listener?.('SIGNED_IN', { user: { id: 'same', is_anonymous: true } });
  h.refresh.mockResolvedValue({ data: { session: { user: { id: 'same', is_anonymous: false } } }, error: null });
  h.profile.mockResolvedValue({ data: { id: 'same' }, error: null });
  h.anon.mockResolvedValue({ error: null });
});

describe('Stage 3 switch and preview', () => {
  it('enables the switch on every host outside test mode', async () => {
    const actual = await vi.importActual<typeof import('@/features/guest/guestConfig')>('@/features/guest/guestConfig');
    expect(actual.guestEnabledForHost(true, 'development')).toBe(true);
    expect(actual.guestEnabledForHost(true, 'production')).toBe(true);
    expect(actual.guestEnabledForHost(false, 'production')).toBe(true);
  });
  it('enables production hosts but keeps every test run off', async () => {
    const actual = await vi.importActual<typeof import('@/features/guest/guestConfig')>('@/features/guest/guestConfig');
    expect(actual.guestEnabledForHost(false, 'development')).toBe(true);
    // jsdom is a preview host; the MODE guard keeps the switch off under test.
    expect(actual.guestEnabledForHost(true, 'test')).toBe(false);
    expect(actual.guestEnabledForHost(false, 'test')).toBe(false);
    expect(actual.GUEST_BROWSING_ENABLED).toBe(false);
  });
  it('bootstraps a preview guest once', async () => {
    renderHook(() => useGuestSessionBootstrap({ envStatus: 'preview', authLoading: false, hasUser: false }));
    await waitFor(() => expect(h.anon).toHaveBeenCalledTimes(1));
    expect(signedOutOutcome({ enabled: true, envStatus: 'preview', guestAttempt: 'pending', stored: false })).toBe('hold');
  });
  it('never allows anonymous welcome or signup', () => {
    expect(isGuestAllowedPath('/welcome')).toBe(false); expect(isGuestAllowedPath('/signup')).toBe(false);
  });
  it('refreshes the same user before profile read and continuation', async () => {
    const navigate = vi.fn(); await refreshGuestConversion(true); navigate();
    expect(h.refresh).toHaveBeenCalledTimes(1);
    expect(h.refresh.mock.invocationCallOrder[0]).toBeLessThan(h.profile.mock.invocationCallOrder[0]);
    expect(h.profile.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0]);
  });
  it('does not refresh ordinary member sign-in', async () => {
    await refreshGuestConversion(false); expect(h.refresh).not.toHaveBeenCalled(); expect(h.profile).not.toHaveBeenCalled();
  });
  it('does not continue with an anonymous refreshed JWT', async () => {
    h.refresh.mockResolvedValue({ data: { session: { user: { is_anonymous: true } } }, error: null });
    await expect(refreshGuestConversion(true)).rejects.toThrow('not confirmed'); expect(h.profile).not.toHaveBeenCalled();
  });
  it('opens the server action card and tracks the precise trigger', () => {
    expect(handleGuestServerError({ code: '42501', message: 'guests_cannot_write' })).toBe(true);
    expect(getGuestCardRequest()).toMatchObject({ kind: 'action', action: 'other' });
    expect(h.track).toHaveBeenCalledWith('guest_gate_shown', expect.objectContaining({ trigger: 'server' }));
  });
  it('leaves members unaffected by the same error', () => {
    h.listener?.('SIGNED_IN', { user: { id: 'same', is_anonymous: false } });
    expect(handleGuestServerError({ code: '42501', message: 'guests_cannot_write' })).toBe(false);
    expect(getGuestCardRequest()).toBeNull(); expect(h.track).not.toHaveBeenCalled();
  });
  it('does not turn other permission read failures into gates', () => {
    expect(handleGuestServerError({ code: '42501', message: 'permission denied for table user_roles' })).toBe(false);
    expect(getGuestCardRequest()).toBeNull();
  });
  it('preserves the failing response and payload for callers', async () => {
    const response = new Response(JSON.stringify({ code: '42501', message: 'guests_cannot_write' }), { status: 403 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const result = await guestAwareFetch('https://example.test');
    expect(result).toBe(response); expect(await result.json()).toEqual({ code: '42501', message: 'guests_cannot_write' });
    vi.unstubAllGlobals();
  });
});