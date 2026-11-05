import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ signIn: vi.fn(), stored: false }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true }));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => h.stored }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestSessionStarted: vi.fn(), trackGuestSessionFailed: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInAnonymously: h.signIn } } }));

import { __resetGuestSignIn, guestHoldActive, guestMintAllowed, signedOutOutcome, useGuestSessionBootstrap } from '@/features/guest/guestSession';

const KEY = 'clbhouz_preview_guest';
const envs = ['native', 'preview', 'web', 'pending'];
const base = { enabled: true, authLoading: false, hasUser: false, stored: false, guestAttempt: 'idle' as const, pathname: '/courses' };
const navigate = (path: string) => window.history.replaceState(null, '', path);
function expectDecision(envStatus: string, allowed: boolean) {
  expect(guestMintAllowed(envStatus)).toBe(allowed);
  expect(guestHoldActive({ ...base, envStatus })).toBe(allowed);
  expect(signedOutOutcome({ ...base, envStatus })).toBe(allowed ? 'hold' : 'auth');
}

beforeEach(() => {
  vi.clearAllMocks(); __resetGuestSignIn(); h.stored = false;
  window.sessionStorage.clear(); navigate('/');
  vi.spyOn(window.navigator, 'webdriver', 'get').mockReturnValue(false);
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Chrome');
  h.signIn.mockResolvedValue({ data: {}, error: null });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.sessionStorage.clear(); navigate('/'); __resetGuestSignIn(); });

describe('guest mint eligibility and shared hold/outcome', () => {
  it('allows native without preview opt-in', () => expectDecision('native', true));
  it('rejects preview without opt-in', () => expectDecision('preview', false));
  it('opts in with guest=1 and persists on a later path', () => {
    navigate('/tourhub?guest=1'); expectDecision('preview', true);
    expect(window.sessionStorage.getItem(KEY)).toBe('1');
    navigate('/courses'); expectDecision('preview', true);
  });
  it('guest=0 clears the opt-in and stays off on a later path', () => {
    window.sessionStorage.setItem(KEY, '1'); navigate('/?guest=0');
    expectDecision('preview', false); expect(window.sessionStorage.getItem(KEY)).toBeNull();
    navigate('/tourhub'); expectDecision('preview', false);
  });
  it('never allows production web even with opt-in', () => { navigate('/?guest=1'); expectDecision('web', false); });
  it('never allows unresolved environments even with opt-in', () => { navigate('/?guest=1'); expectDecision('pending', false); });
  it('blocks webdriver in every environment even with opt-in', () => {
    vi.mocked(window.navigator.__lookupGetter__('webdriver') as () => boolean);
    vi.spyOn(window.navigator, 'webdriver', 'get').mockReturnValue(true);
    navigate('/?guest=1'); envs.forEach(env => expectDecision(env, false));
  });
  it('blocks HeadlessChrome in every environment even with opt-in', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 HeadlessChrome/131.0');
    navigate('/?guest=1'); envs.forEach(env => expectDecision(env, false));
  });
  it('fails closed when reading preview storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expectDecision('preview', false);
  });
  it('fails closed when writing preview opt-in throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    navigate('/?guest=1'); expectDecision('preview', false);
  });
  it('fails closed when clearing preview opt-in throws', () => {
    window.sessionStorage.setItem(KEY, '1');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    navigate('/?guest=0'); expectDecision('preview', false);
  });
  it('native does not depend on available preview storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expectDecision('native', true);
  });
});

describe('guest session bootstrap eligibility', () => {
  it('does not call anonymous sign-in in a preview without opt-in', () => {
    const { result } = renderHook(() => useGuestSessionBootstrap({ ...base, envStatus: 'preview' }));
    expect(h.signIn).not.toHaveBeenCalled(); expect(result.current).toBe('idle');
  });
  it('calls anonymous sign-in once in an opted-in preview', async () => {
    navigate('/?guest=1'); renderHook(() => useGuestSessionBootstrap({ ...base, envStatus: 'preview' }));
    await waitFor(() => expect(h.signIn).toHaveBeenCalledTimes(1));
  });
  it('never calls anonymous sign-in under webdriver in any environment', () => {
    vi.spyOn(window.navigator, 'webdriver', 'get').mockReturnValue(true); navigate('/?guest=1');
    envs.forEach(envStatus => renderHook(() => useGuestSessionBootstrap({ ...base, envStatus })));
    expect(h.signIn).not.toHaveBeenCalled();
  });
  it('never calls anonymous sign-in under HeadlessChrome in any environment', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('HeadlessChrome'); navigate('/?guest=1');
    envs.forEach(envStatus => renderHook(() => useGuestSessionBootstrap({ ...base, envStatus })));
    expect(h.signIn).not.toHaveBeenCalled();
  });
});