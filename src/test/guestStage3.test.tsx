/** Stage 3: exercise the actual RootGate body with the shared envStatus store.
 * Extracting this leaf avoids mounting unrelated app providers and listeners.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({
  preview: false, native: false, resolveBridge: undefined as undefined | ((native: boolean) => void),
  bridge: vi.fn(), anon: vi.fn(),
  session: { user: null as null | { id: string; is_anonymous: boolean }, loading: false },
  listeners: new Set<() => void>(),
}));
vi.mock('@/utils/native/isNativeApp', () => ({
  isNativeAppSync: () => h.native,
  isPreviewHost: () => h.preview,
  waitForNativeBridge: (timeout: number) => {
    h.bridge(timeout);
    return new Promise<boolean>(resolve => { h.resolveBridge = resolve; });
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => React.useSyncExternalStore(
    cb => { h.listeners.add(cb); return () => { h.listeners.delete(cb); }; }, () => h.session,
  ),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInAnonymously: h.anon } } }));
vi.mock('@/utils/auth/hasStoredSession', () => ({ hasStoredSession: () => false }));
vi.mock('@/features/guest/guestAnalytics', () => ({ trackGuestSessionStarted: vi.fn(), trackGuestSessionFailed: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en', changeLanguage: () => Promise.resolve() } }) }));
vi.mock('@/pages/gate/useGateContext', () => ({ useGateContext: () => ({ data: null }) }));
vi.mock('@/hooks/usePlatformReach', () => ({ usePlatformReach: () => ({ data: null, isPending: false, isError: true }) }));
vi.mock('@/lib/storeLinks', () => ({ FALLBACK_PLAY_URL: 'https://play.google.com/store', FALLBACK_STORE_URL: 'https://apps.apple.com', fetchStoreLinks: async () => ({ appStore: null, play: null }) }));

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.stubEnv('MODE', 'production');
  h.native = false; h.preview = false; h.resolveBridge = undefined;
  h.session = { user: null, loading: false }; h.listeners.clear();
  h.anon.mockImplementation(async () => {
    h.session = { user: { id: 'guest', is_anonymous: true }, loading: false };
    h.listeners.forEach(cb => cb());
    return { data: {}, error: null };
  });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

async function mountRoot() {
  const config = await import('@/features/guest/guestConfig');
  const env = await import('@/utils/native/envStatus');
  const session = await import('@/features/guest/guestSession');
  const { GuestSessionHold } = await import('@/features/guest/GuestSessionHold');
  const { useSupabaseSession } = await import('@/hooks/useSupabaseSession');
  const { default: AppDownloadGate } = await import('@/pages/AppDownloadGate');
  const source = readFileSync('src/App.tsx', 'utf8');
  const start = source.indexOf('const RootGate:');
  const end = source.indexOf('\n};', start) + 3;
  if (start < 0 || end < 3) throw new Error('RootGate source boundary missing');
  const js = ts.transpileModule(source.slice(start, end), { compilerOptions: { jsx: ts.JsxEmit.React } }).outputText;
  const deps = {
    React, useLocation, Navigate, useSupabaseSession, useEnvStatus: env.useEnvStatus,
    useSuspensionStatus: () => ({ status: 'active' }),
    useGuestSessionBootstrap: session.useGuestSessionBootstrap, signedOutOutcome: session.signedOutOutcome,
    GUEST_BROWSING_ENABLED: config.GUEST_BROWSING_ENABLED, hasStoredSession: () => false,
    BootHold: () => <div data-testid="boot" />, AppDownloadGate,
    ClubhouseWrapped: () => <div data-testid="clubhouse" data-guest={String(h.session.user?.is_anonymous)} />,
    SuspendedScreen: () => null, PAGE_CANVAS: 'var(--background)',
  };
  const RootGate = new Function(...Object.keys(deps), `${js}\nreturn RootGate;`)(...Object.values(deps)) as React.FC;
  const mounted = render(<MemoryRouter initialEntries={['/']}><GuestSessionHold><RootGate /></GuestSessionHold></MemoryRouter>);
  return { ...mounted, config, env };
}

describe('Stage 3 launch', () => {
  it('production mode enables the switch even before native detection', async () => {
    const config = await import('@/features/guest/guestConfig');
    expect(config.GUEST_BROWSING_ENABLED).toBe(true);
    expect(config.guestEnabledForHost(false, 'production')).toBe(true);
    expect(h.bridge).not.toHaveBeenCalled();
  });
  it('production web renders AppDownloadGate and never attempts anonymous sign-in', async () => {
    const { container, env } = await mountRoot();
    expect(env.getEnvStatus()).toBe('pending');
    expect(h.anon).not.toHaveBeenCalled();
    await act(async () => { h.resolveBridge?.(false); });
    expect(env.getEnvStatus()).toBe('web');
    expect(container.querySelector('[data-store-badges]')).not.toBeNull();
    expect(screen.queryByTestId('clubhouse')).toBeNull();
    expect(h.anon).not.toHaveBeenCalled();
  });
  it('a native bridge arriving after module load opens the first launch as a Clubhouse guest', async () => {
    const { env } = await mountRoot();
    expect(env.getEnvStatus()).toBe('pending');
    expect(h.bridge).toHaveBeenCalledWith(2000);
    expect(h.anon).not.toHaveBeenCalled();
    h.native = true;
    await act(async () => { h.resolveBridge?.(true); });
    await waitFor(() => expect(screen.getByTestId('clubhouse').getAttribute('data-guest')).toBe('true'));
    expect(env.getEnvStatus()).toBe('native');
    expect(h.anon).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('boot')).toBeNull();
  });
  it('preview still opens as a Clubhouse guest', async () => {
    h.preview = true;
    await mountRoot();
    await waitFor(() => expect(screen.getByTestId('clubhouse').getAttribute('data-guest')).toBe('true'));
    expect(h.anon).toHaveBeenCalledTimes(1);
    expect(h.bridge).not.toHaveBeenCalled();
  });
  it('a signed-in native member reaches Clubhouse without anonymous sign-in', async () => {
    h.session = { user: { id: 'member', is_anonymous: false }, loading: false };
    await mountRoot();
    await act(async () => { h.resolveBridge?.(true); });
    expect(screen.getByTestId('clubhouse').getAttribute('data-guest')).toBe('false');
    expect(h.anon).not.toHaveBeenCalled();
  });
});