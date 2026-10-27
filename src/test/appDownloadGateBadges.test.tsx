/** Web download gate: App Store and Google Play badges side by side, no device detection. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
const fetchStoreLinks = vi.hoisted(() => vi.fn());
vi.mock('@/lib/storeLinks', async (orig) => ({ ...(await orig<typeof import('@/lib/storeLinks')>()), fetchStoreLinks }));
vi.mock('@/pages/gate/useGateContext', () => ({ useGateContext: () => ({ data: null }) }));
vi.mock('@/hooks/usePlatformReach', () => ({ usePlatformReach: () => ({ data: null, isPending: false, isError: true }) }));

import AppDownloadGate from '@/pages/AppDownloadGate';
import { FALLBACK_PLAY_URL, FALLBACK_STORE_URL } from '@/lib/storeLinks';

class RO { observe() {} disconnect() {} unobserve() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
const APP = 'https://apps.apple.com/app/clbhouz';
const PLAY = 'https://play.google.com/store/apps/details?id=clbhouz';

afterEach(() => { cleanup(); fetchStoreLinks.mockReset(); vi.restoreAllMocks(); });

const badges = (c: HTMLElement) => {
  const row = c.querySelector('[data-store-badges]')!;
  const links = Array.from(row.querySelectorAll('a'));
  return { row, links, imgs: links.map((a) => a.querySelector('img')!) };
};
const renderGate = () => render(<MemoryRouter initialEntries={['/']}><AppDownloadGate /></MemoryRouter>);

describe('download gate badges', () => {
  it('renders App Store then Google Play; App Store stays the App Store on Android', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ANDROID);
    fetchStoreLinks.mockResolvedValue({ appStore: APP, play: PLAY });
    const { container } = renderGate();
    await waitFor(() => expect(badges(container).links[0].getAttribute('href')).toBe(APP));
    const { links, imgs } = badges(container);
    expect(links).toHaveLength(2);
    expect(links[1].getAttribute('href')).toBe(PLAY);
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual(['/brand/apple-app-store-badge.svg', '/brand/google-play-badge.svg']);
  });

  it('with no play link set, Google Play uses FALLBACK_PLAY_URL', async () => {
    fetchStoreLinks.mockResolvedValue({ appStore: APP, play: null });
    const { container } = renderGate();
    await waitFor(() => expect(badges(container).links[0].getAttribute('href')).toBe(APP));
    expect(badges(container).links[1].getAttribute('href')).toBe(FALLBACK_PLAY_URL);
  });

  it('a failed fetch keeps both fallbacks', async () => {
    fetchStoreLinks.mockRejectedValue(new Error('down'));
    const { container } = renderGate();
    await waitFor(() => expect(fetchStoreLinks).toHaveBeenCalled());
    const { links } = badges(container);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([FALLBACK_STORE_URL, FALLBACK_PLAY_URL]);
  });

  it('both badges are 46px tall in a wrapping centred row, with no Play "coming soon"', async () => {
    fetchStoreLinks.mockResolvedValue({ appStore: null, play: null });
    const { container } = renderGate();
    const { row, imgs } = badges(container);
    expect(imgs.map((i) => i.style.height)).toEqual(['46px', '46px']);
    const s = (row as HTMLElement).style;
    expect([s.display, s.flexWrap, s.justifyContent, s.gap]).toEqual(['flex', 'wrap', 'center', '10px']);
    expect(container.querySelector('[aria-disabled]')).toBeNull();
    expect(container.textContent).not.toContain('Coming soon to Google Play');
  });
});
