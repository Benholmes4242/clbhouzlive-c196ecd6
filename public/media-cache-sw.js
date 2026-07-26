const CACHE_NAME = 'clbhouz-media-v3';
const MAX_CACHE_SIZE_MB = 200;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

// Only cache Cloudflare Stream media segments.
const CACHEABLE_PATTERN = /\.cloudflarestream\.com\/.+\.(ts|m4s|mp4)(\?|$)/;

// Trim at most once every 60s, and never while a segment fetch is in flight.
const TRIM_INTERVAL_MS = 60_000;
let lastTrim = 0;
let trimming = false;
let putsSinceTrim = 0;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // MANIFESTS ARE NEVER CACHED.
  // Cloudflare Stream manifests contain per-segment signed URLs with a limited
  // lifetime. Serving a stale manifest from cache hands the player expired
  // segment URLs, which fail and then force a full manifest+level reload —
  // exactly the multi-second "video sits still before it plays" stall. Let
  // them go straight to network (they are small and CDN-cached anyway).

  // SEGMENTS: cache-first, then a single network fetch.
  //
  // Correctness rules:
  //   - NEVER cache a 206 (partial bytes served to a different Range = corrupt).
  //   - Only ever serve full 200s from the cache. hls.js handles a 200 to a
  //     range request fine — it just uses the whole body.
  //   - Exactly ONE network request per segment. The previous version fired a
  //     second, full-body fetch in parallel with the player's own request,
  //     doubling bandwidth for every segment on the critical path and starving
  //     startup on mobile connections.
  if (CACHEABLE_PATTERN.test(url)) {
    event.respondWith(handleSegment(event));
    return;
  }

  // Everything else: pass through (don't interfere with app requests).
});

async function handleSegment(event) {
  const url = event.request.url;
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
  } catch {
    return fetch(event.request);
  }

  // Match by URL only — ignore Range/Vary so a cached full body satisfies any
  // range request.
  const cached = await cache.match(new Request(url), { ignoreVary: true }).catch(() => null);
  if (cached && cached.status === 200) return cached;

  // Single pass-through fetch. Only a complete 200 is cacheable; a 206 is
  // served to the player and simply not stored.
  const response = await fetch(event.request);
  if (response.ok && response.status === 200) {
    const copy = response.clone();
    // Store off the critical path so the player never waits on the cache write.
    event.waitUntil(
      cache.put(new Request(url), copy)
        .then(() => { putsSinceTrim++; return maybeTrim(cache); })
        .catch(() => {})
    );
  }
  return response;
}

// LRU-style trimming — delete oldest entries when over budget.
// Time-boxed and rate-limited: the old version walked EVERY entry and read
// each one into a Blob on the worker thread, which blocked concurrent segment
// requests for hundreds of milliseconds mid-playback.
async function maybeTrim(cache) {
  const now = Date.now();
  if (trimming) return;
  if (putsSinceTrim < 40 && now - lastTrim < TRIM_INTERVAL_MS) return;
  trimming = true;
  lastTrim = now;
  putsSinceTrim = 0;

  try {
    const keys = await cache.keys();
    // Estimate size from Content-Length headers instead of reading bodies.
    let totalSize = 0;
    const entries = [];
    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) continue;
      const len = Number(response.headers.get('content-length')) || 0;
      // Fall back to a nominal segment size when the header is missing.
      const size = len > 0 ? len : 512 * 1024;
      entries.push({ request, size });
      totalSize += size;
    }

    if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

    // FIFO: earliest cached first.
    let freed = 0;
    const target = totalSize - MAX_CACHE_SIZE_BYTES + 10 * 1024 * 1024;
    for (const entry of entries) {
      if (freed >= target) break;
      await cache.delete(entry.request);
      freed += entry.size;
    }
  } catch {
    /* trimming is best-effort */
  } finally {
    trimming = false;
  }
}
