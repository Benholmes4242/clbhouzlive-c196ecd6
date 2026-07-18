import { isMedianApp } from './isMedianApp';

/**
 * Open an http(s) URL. In the Median app, uses the documented JS bridge
 * median.window.open(url, mode). modes: 'appbrowser' = in-app browser with
 * native Done chrome; 'external' = system browser / registered app (Maps).
 * On web, plain new-tab open. Do NOT route tel:/mailto: through this.
 */
export function openExternalUrl(
  rawUrl: string,
  mode: 'appbrowser' | 'external' = 'appbrowser',
): void {
  if (!rawUrl) return;
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  if (!isMedianApp()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const median = (window as any).median;
  try {
    if (median?.window?.open) {
      median.window.open(url, mode);
      return;
    }
  } catch (_) { /* fall through */ }

  // Bridge not injected yet: plain open - Median's link-behavior rules
  // route other-domain URLs to the app browser, so this is never a dead end.
  window.open(url, '_blank', 'noopener,noreferrer');
}
