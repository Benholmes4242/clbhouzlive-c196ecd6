import { isMedianApp, isMedianBridgeReady, getMedianPlatform } from './isMedianApp';

/**
 * Single source of truth for opening an external https URL.
 *
 * On device (Median/GoNative WebView): opens in the system / in-app browser
 * with native chrome (Done button), via the Median JS bridge. Falls back
 * through the gonative:// URL form and finally window.open so it can never
 * be worse than today.
 *
 * On web / Lovable preview: standard window.open in a new tab.
 *
 * Only use for http(s) URLs. Do NOT route tel:/mailto: through this.
 */
export function openExternalUrl(rawUrl: string): void {
  if (!rawUrl) return;

  // Normalise: ensure protocol so we never feed a bare host to a browser.
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  // Web / preview: plain new-tab open is correct and not a trap.
  if (!isMedianApp()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // Device: try the Median bridge in priority order.
  const median = (window as any).median;

  // 1) Documented bridge method (system browser). Method name is version
  //    specific; guard every access so a missing method just falls through.
  try {
    if (isMedianBridgeReady() && median?.externalLink?.open) {
      median.externalLink.open({ url });
      return;
    }
  } catch (_) { /* fall through */ }

  // 2) gonative:// command form (in-app browser w/ native top bar + Done).
  //    Open in external/system browser to guarantee a Done/close affordance.
  try {
    const platform = getMedianPlatform();
    const encoded = encodeURIComponent(url);
    const cmd =
      `gonative://webview/open?url=${encoded}` +
      `&androidOpenInExternalBrowser=true&iosOpenInSafari=true`;
    window.location.href = cmd;
    void platform;
    return;
  } catch (_) { /* fall through */ }

  // 3) Last resort: standard open (same as today; never worse).
  window.open(url, '_blank', 'noopener,noreferrer');
}
