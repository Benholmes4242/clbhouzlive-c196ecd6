// videoPoster - grabs a still frame from a local video preview and caches it.
//
// The filmstrip and the page-2 media strip both need a cheap thumbnail for
// video slides; decoding a <video> per tile is expensive in the WebView, so
// each slide id resolves to a data URL once and is reused thereafter.

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
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      if (value) cache.set(id, value);
      inflight.delete(id);
      resolve(value);
    };

    const draw = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        const ctx = canvas.getContext('2d');
        if (!ctx) return finish(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL('image/jpeg', 0.72));
      } catch {
        finish(null);
      }
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(at, Math.max(0, (video.duration || 1) - 0.05));
      } catch {
        draw();
      }
    };
    video.onseeked = draw;
    video.onerror = () => finish(null);
    // Hard stop so a stubborn file never leaves a tile spinning.
    setTimeout(() => finish(null), 4000);
    video.src = src;
  });

  inflight.set(id, job);
  return job;
}
