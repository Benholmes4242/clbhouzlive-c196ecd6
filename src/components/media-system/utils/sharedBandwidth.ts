/**
 * Shared HLS bandwidth memory across all video instances.
 * Persists within a browser session so each new HLS.js instance
 * starts knowing the connection speed instead of defaulting to lowest quality.
 * Resets on every new browser session — prevents stale cross-network measurements.
 */

let _sharedBandwidth = 0; // bits per second, in-memory

export function getSharedBandwidth(): number {
  if (_sharedBandwidth > 0) return _sharedBandwidth;
  try {
    const v = sessionStorage.getItem('clbhouz-hls-bw');
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

export function saveSharedBandwidth(bps: number): void {
  if (bps <= 0) return;
  _sharedBandwidth = bps;
  try {
    sessionStorage.setItem('clbhouz-hls-bw', String(Math.round(bps)));
  } catch {}
}

/**
 * Fetch an HLS master manifest, parse the rendition ladder,
 * and set the highest quality rendition URL directly on the video element.
 * This bypasses iOS native HLS ABR which always starts at lowest quality.
 */
export async function setNativeHlsSource(
  video: HTMLVideoElement,
  manifestUrl: string
): Promise<void> {
  try {
    console.log('[NativeHLS] Fetching manifest:', manifestUrl.slice(-60));
    const res = await fetch(manifestUrl);
    if (!res.ok) {
      console.log('[NativeHLS] Manifest fetch failed:', res.status, '— falling back to master');
      video.src = manifestUrl;
      return;
    }
    const text = await res.text();
    console.log('[NativeHLS] Manifest received, length:', text.length, 'chars');
    console.log('[NativeHLS] Manifest preview:', text.slice(0, 300));

    const lines = text.split('\n');
    let bestUrl = '';
    let bestBandwidth = 0;
    let renditionCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        const bwMatch = line.match(/BANDWIDTH=(\d+)/);
        const bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !nextLine.startsWith('#')) {
          renditionCount++;
          console.log(`[NativeHLS] Rendition ${renditionCount}: ${Math.round(bandwidth/1000)}kbps — ${nextLine.slice(-50)}`);
          if (bandwidth > bestBandwidth) {
            bestBandwidth = bandwidth;
            bestUrl = nextLine;
          }
        }
      }
    }

    console.log('[NativeHLS] Renditions found:', renditionCount, '| Best bandwidth:', Math.round(bestBandwidth/1000), 'kbps');

    if (bestUrl) {
      const absoluteUrl = bestUrl.startsWith('http')
        ? bestUrl
        : new URL(bestUrl, manifestUrl).href;
      console.log('[NativeHLS] Setting src to highest rendition:', absoluteUrl.slice(-80));
      video.src = absoluteUrl;
    } else {
      console.log('[NativeHLS] No renditions parsed — falling back to master manifest');
      video.src = manifestUrl;
    }
  } catch (err) {
    console.log('[NativeHLS] Exception:', String(err), '— falling back to master manifest');
    video.src = manifestUrl;
  }
}
