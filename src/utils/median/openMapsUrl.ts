import { isMedianApp } from './isMedianApp';

/**
 * Open a maps universal link (https://maps.apple.com/... or
 * https://www.google.com/maps/...). Deliberately bridge-free.
 *
 * On device (Median/GoNative WebView): direct location assignment lets the
 * OS route the universal link into the native Apple Maps / Google Maps app.
 * Routing through the Median external-link bridge would open an in-app
 * browser instead of the native map app, defeating the whole point.
 *
 * On web / preview: standard new-tab open.
 *
 * By convention this helper accepts https universal links ONLY. It performs
 * no protocol normalisation and does no allowlisting; the caller is trusted
 * to hand it a well-formed https URL that both OSes recognise as a map
 * universal link.
 */
export function openMapsUrl(url: string): void {
  if (!url) return;

  if (!isMedianApp()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    window.location.href = url;
    return;
  } catch (_) {
    /* fall through */
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
