// videoPoster - grabs a still frame from a local video preview and caches it.
//
// The filmstrip and the page-2 media strip both need a cheap thumbnail for
// video slides; decoding a <video> per tile is expensive in the WebView, so
// each slide id resolves to a data URL once and is reused thereafter.
//
// WebView notes (this is the whole reason posters were black/grey on device):
//  - `preload = 'metadata'` never loads frame data, so `loadeddata` may never
//    fire in the iOS WebView and the job timed out with nothing drawn.
//  - setting `crossOrigin` on a `blob:` source makes WebKit fail the load
//    outright, so the element errored before any frame existed.
//  - the element must be IN THE DOM (offscreen) and, on iOS, needs a muted
//    inline play tick before the first frame is decodable; seeking alone is
//    not enough.
// The pipeline below waits for metadata, seeks, and then draws on whichever of
// `seeked` / `timeupdate` / `canplay` lands first, with a longer hard stop.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/** Cached poster for a slide id, if one has already been extracted. */
export function getCachedPoster(id: string): string | null {
  return cache.get(id) ?? null;
}

/**
 * Extract a poster frame (defaults to 0.1s in) for a local video URL.
 * Resolves null when the frame cannot be read.
 */
export function extractPoster(id: string, src: string, at = 0.1): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(id);
  if (running) return running;

  const job = new Promise<string | null>((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    // Frame data is required, not just metadata.
    video.preload = 'auto';
    // Offscreen but attached: a detached element never decodes in the WebView.
    video.style.cssText = 'position:fixed;left:-10000px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(video);

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch { /* teardown best-effort */ }
      try { video.remove(); } catch { /* teardown best-effort */ }
    };

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      if (value) cache.set(id, value);
      inflight.delete(id);
      cleanup();
      resolve(value);
    };

    const draw = () => {
      if (settled) return;
      // A frame that hasn't decoded yet paints black — wait for the next signal.
      if (video.readyState < 2) return;
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) return;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, w, h);
        finish(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        finish(null);
      }
    };

    const seek = () => {
      const target = Math.min(at, Math.max(0, (video.duration || 1) - 0.05));
      try {
        video.currentTime = target;
      } catch { /* seek unsupported: rely on the play tick below */ }
      // iOS needs a play tick before the first frame is decodable.
      void video.play?.()?.then(() => {
        window.setTimeout(() => { try { video.pause(); } catch { /* noop */ } draw(); }, 60);
      }).catch(() => { /* autoplay refused: the seek path still fires */ });
    };

    video.onloadedmetadata = seek;
    video.onloadeddata = draw;
    video.onseeked = draw;
    video.oncanplay = draw;
    video.ontimeupdate = draw;
    video.onerror = () => finish(null);
    // Hard stop so a stubborn file never leaves a tile spinning.
    timer = setTimeout(() => finish(null), 8000);
    video.src = src;
    try { video.load(); } catch { /* load best-effort */ }
  });

  inflight.set(id, job);
  return job;
}
