import { describe, expect, it, vi } from 'vitest';
import { FALLBACK_STORE_URL, fetchStoreLinks, pickStoreUrl } from './storeLinks';

const from = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const MAC_TOUCH = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const links = { appStore: 'https://apps.apple.com/app/clbhouz', play: 'https://play.google.com/store/apps/details?id=clbhouz' };

describe('pickStoreUrl', () => {
  it('sends an iPhone to the App Store link, or the fallback when unset', () => {
    expect(pickStoreUrl(links, IPHONE, 5)).toBe(links.appStore);
    expect(pickStoreUrl({ appStore: null, play: null }, IPHONE, 5)).toBe(FALLBACK_STORE_URL);
  });
  it('treats a Macintosh with touch as an iPad', () => {
    expect(pickStoreUrl(links, MAC_TOUCH, 5)).toBe(links.appStore);
    expect(pickStoreUrl(links, MAC_TOUCH, 0)).toBeNull();
  });
  it('sends Android to the Play link, or null when it is not set', () => {
    expect(pickStoreUrl(links, ANDROID, 5)).toBe(links.play);
    expect(pickStoreUrl({ appStore: links.appStore, play: null }, ANDROID, 5)).toBeNull();
  });
  it('returns null on desktop', () => {
    expect(pickStoreUrl(links, DESKTOP, 0)).toBeNull();
  });
});

describe('fetchStoreLinks', () => {
  it('parses string and { url } values and drops a non-https value', async () => {
    from.mockReturnValue({
      select: () => ({
        in: async () => ({
          data: [
            { key: 'app_download_url', value: 'https://apps.apple.com/app/clbhouz' },
            { key: 'play_store_url', value: { url: 'https://play.google.com/store/apps/details?id=clbhouz' } },
          ],
          error: null,
        }),
      }),
    });
    expect(await fetchStoreLinks()).toEqual(links);

    from.mockReturnValue({
      select: () => ({
        in: async () => ({
          data: [
            { key: 'app_download_url', value: 'http://insecure.example' },
            { key: 'play_store_url', value: 'https://play.google.com/x' },
          ],
          error: null,
        }),
      }),
    });
    expect(await fetchStoreLinks()).toEqual({ appStore: null, play: 'https://play.google.com/x' });
  });
});
