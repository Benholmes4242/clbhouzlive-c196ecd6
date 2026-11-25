// videoPoster - grabs a still frame from a local video preview and caches it.
//
// The filmstrip and the page-2 media strip both need a cheap thumbnail for
// video slides; decoding a <video> per tile is expensive in the WebView, so
// each slide id resolves to a data URL once and is reused thereafter.
// RULE: the first argument (the cache key) is a STABLE ITEM ID, never a blob
// URL — blob URLs are reminted per mount and this cache is never evicted.
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
//
// Brief 21 H: the WebView handles about ONE decoder at a time, so every request
// runs through one queue (global concurrency 1) with one <video> per source.
// All times queued for a source (thumb + cover frames) are drawn in sequence by
// seeking that same element, which is torn down once its queue is empty. Draws
// are capped at 480px on the long edge; a null job retries once at the back.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

export const POSTER_MAX_EDGE = 480;
const JOB_TIMEOUT_MS = 8000;

interface Job { id: string; src: string; at: number; retried: boolean; resolve: (v: string | null) => void }
const queue: Job[] = [];
let pumping = false;

/** Cached poster for a slide id, if one has already been extracted. */
export function getCachedPoster(id: string): string | null {
  return cache.get(id) ?? null;
}

/** Test-only: clear the cache and queue between cases. */
export function __resetPosterQueue(): void { cache.clear(); inflight.clear(); queue.length = 0; pumping = false; }

/**
 * Extract a poster frame (defaults to 0.1s in) for a local video URL.
 * Resolves null when the frame cannot be read (after one retry).
 */
export function extractPoster(id: string, src: string, at = 0.1): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(id);
  if (running) return running;
  const job = new Promise<string | null>((resolve) => {
    queue.push({ id, src, at, retried: false, resolve });
  });
  inflight.set(id, job);
  void pump();
  return job;
}

function settle(job: Job, value: string | null) {
  if (value) cache.set(job.id, value);
  inflight.delete(job.id);
  job.resolve(value);
}

async function pump(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    while (queue.length) {
      const first = queue.shift() as Job;
      const src = first.src;
      const video = openVideo(src);
      // Retries queued during this element's session wait for a later one.
      const deferred: Job[] = [];
      let job: Job | undefined = first;
      let ticked = false;
      while (job) {
        const value = await grab(video, job.at, !ticked);
        ticked = true;
        if (value) settle(job, value);
        else if (!job.retried) deferred.push({ ...job, retried: true });
        else settle(job, null);
        const next = queue.findIndex((j) => j.src === src);
        job = next >= 0 ? queue.splice(next, 1)[0] : undefined;
      }
      closeVideo(video);
      queue.push(...deferred);
    }
  } finally {
    pumping = false;
  }
}

function openVideo(src: string): HTMLVideoElement {
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
  /* A REMOTE source must be CORS-enabled or drawImage taints the canvas and
   * toDataURL throws — that is exactly what made edit-mode thumbnails black.
   * A `blob:` source must NOT carry crossOrigin: WebKit fails the load
   * outright (see this file's header). The scheme decides, never the caller. */
  if (!src.startsWith('blob:')) video.crossOrigin = 'anonymous';
  video.src = src;
  try { video.load(); } catch { /* load best-effort */ }
  return video;
}

function closeVideo(video: HTMLVideoElement) {
  try {
    video.pause();
    video.removeAttribute('src');
    video.load();
  } catch { /* teardown best-effort */ }
  try { video.remove(); } catch { /* teardown best-effort */ }
}

/** Draw the current frame, capped at POSTER_MAX_EDGE on the long edge. */
function drawFrame(video: HTMLVideoElement): string | null | undefined {
  // A frame that hasn't decoded yet paints black — wait for the next signal.
  if (video.readyState < 2) return undefined;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return undefined;
  const scale = Math.min(1, POSTER_MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

/** Seek the shared element to `at` and draw once the frame is decodable. */
function grab(video: HTMLVideoElement, at: number, firstTick: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false;
    let seekedTo: number | null = null;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const [ev, fn] of handlers) video.removeEventListener(ev, fn);
      resolve(value);
    };
    const tryDraw = () => {
      if (done || seekedTo == null) return;
      try {
        const out = drawFrame(video);
        if (out !== undefined) finish(out);
      } catch { finish(null); }
    };
    const seek = () => {
      if (done || seekedTo != null) return;
      if (video.readyState < 1) return;
      const target = Math.min(at, Math.max(0, (video.duration || 1) - 0.05));
      seekedTo = target;
      const already = Math.abs((video.currentTime || 0) - target) < 0.01;
      try { if (!already) video.currentTime = target; } catch { /* seek unsupported: rely on the play tick */ }
      if (firstTick) {
        // iOS needs a play tick before the first frame is decodable.
        void video.play?.()?.then(() => {
          window.setTimeout(() => { try { video.pause(); } catch { /* noop */ } tryDraw(); }, 60);
        }).catch(() => { /* autoplay refused: the seek path still fires */ });
      }
      if (already) tryDraw();
    };
    const handlers: Array<[string, () => void]> = [
      ['loadedmetadata', seek],
      ['loadeddata', () => { seek(); tryDraw(); }],
      ['seeked', tryDraw],
      ['canplay', tryDraw],
      ['timeupdate', tryDraw],
      ['error', () => finish(null)],
    ];
    for (const [ev, fn] of handlers) video.addEventListener(ev, fn);
    // Hard stop so a stubborn file never leaves a tile waiting forever.
    const timer = setTimeout(() => finish(null), JOB_TIMEOUT_MS);
    if (video.error) finish(null);
    else seek();
  });
}
