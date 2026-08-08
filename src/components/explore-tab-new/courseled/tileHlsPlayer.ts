/**
 * TILE HLS PLAYER — the minimum needed to play a Cloudflare Stream manifest in
 * a muted, looping Discover tile (BRIEF_MOMENT_TILE_AUTOPLAY).
 *
 * WHY THIS EXISTS AT ALL. The review tiles could autoplay from `mediaUrl`, a
 * progressive file a bare <video src> plays anywhere. MOMENT media has no such
 * URL: useMomentsOfTheWeek only ever produces an `hlsUrl` (built from
 * stream_id — the hls_url column is null for Stream rows). A bare
 * <video src={m3u8}> plays on Safari/iOS WKWebView and plays NOTHING on
 * Chromium — desktop web and the Android Median WebView — so "identical to the
 * review tiles" is not literally possible at the source layer. Everything
 * ABOVE the source (gating, cap, glyph, release) is identical; only the attach
 * differs, and it differs because the media does.
 *
 * WHY NOT VideoEngine. It owns three physical feed lanes with role rotation and
 * an audio policy; a grid of tiles does not map onto that, and the brief puts
 * the engine out of scope. This helper owns no pool and no audio: it attaches
 * one hls.js instance to one element and tears it down completely, which is the
 * engine's own stated core rule (one <video> = one Hls) applied locally. It can
 * only ever run MAX_PLAYING (2) times at once because the coordinator gates it.
 */

/** Native HLS: Safari and iOS WKWebView. Chromium returns ''. */
function canPlayNativeHls(v: HTMLVideoElement): boolean {
  return (
    v.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    v.canPlayType('application/x-mpegURL') !== ''
  );
}

export interface TileAttachment {
  detach: () => void;
}

/**
 * Attach `hlsUrl` to `v` and return a detach that releases EVERYTHING (hls.js
 * instance, buffers, src attribute). Safe to call detach twice.
 *
 * `onFail` fires for a genuine media failure so the tile can fall back to its
 * image chain — never a black rectangle.
 */
export function attachTileHls(
  v: HTMLVideoElement,
  hlsUrl: string,
  onFail: () => void,
): TileAttachment {
  let detached = false;

  // NATIVE PATH — no library, no worker, no extra memory.
  if (canPlayNativeHls(v)) {
    v.setAttribute('src', hlsUrl);
    v.load();
    return {
      detach: () => {
        if (detached) return;
        detached = true;
        v.pause();
        v.removeAttribute('src');
        v.load();
      },
    };
  }

  // hls.js PATH — imported lazily so a member who never reaches a video tile
  // never pays for it. The instance is created only for a tile the coordinator
  // has already declared a winner, so at most two exist.
  let hls: import('hls.js').default | null = null;
  void import('hls.js').then(({ default: Hls }) => {
    if (detached) return;
    if (!Hls.isSupported()) {
      onFail();
      return;
    }
    hls = new Hls({
      // A 81-220px tile needs the smallest rung, not the sharpest: cap to the
      // element box and start at the bottom so first frame is immediate.
      capLevelToPlayerSize: true,
      startLevel: 0,
      // Tiny buffers. A looping tile only ever needs the next few seconds, and
      // two of these must not cost what a fullscreen player costs.
      maxBufferLength: 4,
      maxMaxBufferLength: 8,
      backBufferLength: 0,
      enableWorker: true,
      lowLatencyMode: false,
    });
    hls.on(Hls.Events.ERROR, (_e, data) => {
      // Only a FATAL error is a failure. Non-fatal errors are hls.js's normal
      // recovery chatter and must not strand the tile on its poster.
      if (data.fatal) {
        try {
          hls?.destroy();
        } catch {
          /* already gone */
        }
        hls = null;
        onFail();
      }
    });
    hls.loadSource(hlsUrl);
    hls.attachMedia(v);
  });

  return {
    detach: () => {
      if (detached) return;
      detached = true;
      v.pause();
      try {
        hls?.destroy();
      } catch {
        /* already gone */
      }
      hls = null;
      if (v.getAttribute('src')) {
        v.removeAttribute('src');
        v.load();
      }
    },
  };
}
