/**
 * FUNNEL_TRACKING_1: sign-up funnel measurement.
 * (a) editor/preview/framed hosts insert no analytics_events row;
 * (b) error_detail redaction + 120-char truncation;
 * (c) session_start carries utm_* and referrer_host;
 * (d) store badge taps fire store_link_tapped on both surfaces.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const h = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(() => ({ insert: h.insert })),
  },
  SUPABASE_URL: 'https://example.test',
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/pages/gate/useGateContext', () => ({ useGateContext: () => ({ data: null }) }));
vi.mock('@/hooks/usePlatformReach', () => ({ usePlatformReach: () => ({ data: null, isPending: false, isError: true }) }));
vi.mock('@/lib/storeLinks', async (orig) => ({ ...(await orig<typeof import('@/lib/storeLinks')>()), fetchStoreLinks: vi.fn().mockResolvedValue({ appStore: null, play: null }) }));

import { isAnalyticsExcludedHost } from '@/utils/analyticsSession';
import { buildAuthErrorExtras } from '@/lib/authAnalytics';
import AppDownloadGate from '@/pages/AppDownloadGate';
import HandoffPage from '@/pages/gate/HandoffPage';

class RO { observe() {} disconnect() {} unobserve() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

const stubHost = (hostname: string, search = '') =>
  vi.stubGlobal('location', { hostname, pathname: '/', search });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  h.insert.mockClear();
});

describe('FUNNEL_TRACKING_1 (a) excluded hosts', () => {
  it('isAnalyticsExcludedHost: true for editor, id-preview and framed; false for production', () => {
    stubHost('x.lovableproject.com');
    expect(isAnalyticsExcludedHost()).toBe(true);
    stubHost('id-preview--abc.lovable.app');
    expect(isAnalyticsExcludedHost()).toBe(true);
    stubHost('clbhouz.lovable.app');
    expect(isAnalyticsExcludedHost()).toBe(false);
    stubHost('app.clbhouz.co.uk');
    expect(isAnalyticsExcludedHost()).toBe(false);
    vi.unstubAllGlobals();
    vi.stubGlobal('top', {}); // framed: window.self !== window.top
    expect(isAnalyticsExcludedHost()).toBe(true);
    vi.unstubAllGlobals();
    expect(isAnalyticsExcludedHost()).toBe(false); // unframed localhost
  });

  it('no analytics_events row is inserted on an excluded host; host is stamped otherwise', async () => {
    stubHost('x.lovableproject.com');
    const { analyticsEvents } = await import('@/utils/analyticsEvents');
    await analyticsEvents.track('funnel_test_event');
    expect(h.insert).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
    await analyticsEvents.track('funnel_test_event');
    const rows = h.insert.mock.calls.map((c) => c[0]).filter((r) => r.name === 'funnel_test_event');
    expect(rows).toHaveLength(1);
    expect(rows[0].props.host).toBe('localhost');
  });
});

describe('FUNNEL_TRACKING_1 (b) real auth error', () => {
  it('error_detail redacts emails and 4+ digit runs, and truncates at 120 chars', () => {
    expect(buildAuthErrorExtras({ message: 'Code for ben@x.com 123456 failed' }).error_detail)
      .toBe('Code for [email] [n] failed');
    expect(buildAuthErrorExtras({ message: 'x'.repeat(200) }).error_detail).toHaveLength(120);
  });

  it('error_code and error_status pass through when present', () => {
    expect(buildAuthErrorExtras({ message: 'nope', code: 'otp_expired', status: 403 }))
      .toMatchObject({ error_code: 'otp_expired', error_status: 403, error_detail: 'nope' });
    const bare = buildAuthErrorExtras({ message: 'nope' });
    expect('error_code' in bare).toBe(false);
    expect('error_status' in bare).toBe(false);
  });
});

describe('FUNNEL_TRACKING_1 (c) campaign capture', () => {
  it('session_start carries utm_source/utm_campaign and referrer_host', async () => {
    vi.resetModules();
    stubHost('clbhouz.co.uk', '?utm_source=instagram&utm_campaign=bio');
    Object.defineProperty(document, 'referrer', { value: 'https://instagram.com/p/x', configurable: true });
    window.localStorage.removeItem('analytics_session_id');
    window.localStorage.removeItem('analytics_session_last_seen');
    await import('@/utils/analyticsEvents'); // registers the mint listener
    const { getSessionId } = await import('@/utils/analyticsSession');
    h.insert.mockClear();
    getSessionId(); // mints -> session_start
    await waitFor(() => expect(h.insert).toHaveBeenCalled());
    const row = h.insert.mock.calls[0][0];
    expect(row.name).toBe('session_start');
    expect(row.props.utm_source).toBe('instagram');
    expect(row.props.utm_campaign).toBe('bio');
    expect(row.props.referrer_host).toBe('instagram.com');
  });
});

describe('FUNNEL_TRACKING_1 (d) store taps', () => {
  it('download gate App Store badge fires store_link_tapped', async () => {
    const { container } = render(<MemoryRouter initialEntries={['/']}><AppDownloadGate /></MemoryRouter>);
    fireEvent.click(container.querySelector('[data-store-badges] a')!);
    await waitFor(() =>
      expect(h.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'store_link_tapped',
        props: expect.objectContaining({ surface: 'download_gate', store: 'app_store' }),
      })),
    );
  });

  it('handoff App Store badge fires store_link_tapped', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/go/handicap']}>
        <Routes><Route path="/go/:target" element={<HandoffPage />} /></Routes>
      </MemoryRouter>,
    );
    fireEvent.click(container.querySelector('a[href*="apps.apple.com"]')!);
    await waitFor(() =>
      expect(h.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'store_link_tapped',
        props: expect.objectContaining({ surface: 'handoff', store: 'app_store' }),
      })),
    );
  });
});
