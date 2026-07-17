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

  // Contract-violation guard: if the input carries a non-http(s) scheme
  // (e.g. maps://, tel:, mailto:, whatsapp://, itms-apps://), do NOT
  // prefix https:// — that silently mangles the URL. Warn loudly, pass
  // the URL through to a best-effort window.open, and return. Bare hosts
  // (no scheme at all) still get the https prefix, preserving today's
  // behaviour for the legitimate https-only callers.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(rawUrl);
  const isHttp = /^https?:\/\//i.test(rawUrl);
  if (hasScheme && !isHttp) {
    // eslint-disable-next-line no-console
    console.warn(
      '[openExternalUrl] Non-http(s) scheme passed to https-only helper; ' +
        'route custom schemes through their own path instead. url=',
      rawUrl,
    );
    try { window.open(rawUrl, '_blank', 'noopener,noreferrer'); } catch (_) { /* no-op */ }
    return;
  }

  const url = isHttp ? rawUrl : `https://${rawUrl}`;

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
