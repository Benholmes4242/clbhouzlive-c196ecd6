/**
 * BRIEF_ADMIN_SETTINGS S.11 — the ONE reader of the app_config store links.
 * app_download_url is the App Store link (never clearable server-side);
 * play_store_url is optional ('' clears it). Only https:// values are kept.
 */
import { supabase } from '@/integrations/supabase/client';

export const FALLBACK_STORE_URL = 'https://apps.apple.com/app/id6752538886';

export interface StoreLinks {
  appStore: string | null;
  play: string | null;
}

/** Accepts a string value or { url }, exactly as useStoreUrl did. */
function httpsOnly(value: unknown): string | null {
  const url =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string'
        ? (value as { url: string }).url
        : null;
  return url && url.startsWith('https://') ? url : null;
}

export async function fetchStoreLinks(): Promise<StoreLinks> {
  const { data, error } = await supabase
    .from('app_config' as never)
    .select('key, value')
    .in('key', ['app_download_url', 'play_store_url']);
  if (error) throw error;
  const map = new Map(((data ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));
  return { appStore: httpsOnly(map.get('app_download_url')), play: httpsOnly(map.get('play_store_url')) };
}

/**
 * iPhone, iPad or iPod (or a Macintosh with touch) -> App Store, falling back
 * to FALLBACK_STORE_URL. Android -> the Play link, null when not set.
 * Anything else (desktop) -> null.
 */
export function pickStoreUrl(links: StoreLinks, ua: string, maxTouchPoints?: number): string | null {
  const s = ua.toLowerCase();
  const touch = maxTouchPoints ?? (typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0);
  const isIOS = /iphone|ipad|ipod/.test(s) || (s.includes('macintosh') && touch > 0);
  if (isIOS) return links.appStore ?? FALLBACK_STORE_URL;
  if (s.includes('android')) return links.play;
  return null;
}
