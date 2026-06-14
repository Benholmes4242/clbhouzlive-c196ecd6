const CACHE_NAME = 'clbhouz-media-v2';
const MAX_CACHE_SIZE_MB = 200;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

// Only cache Cloudflare Stream segments
const CACHEABLE_PATTERN = /\.cloudflarestream\.com\/.+\.(ts|m4s|mp4)(\?|$)/;
const MANIFEST_PATTERN = /\.cloudflarestream\.com\/.+\.(m3u8)(\?|$)/;

// Dedupe concurrent background full-segment fetches per URL
const inflightFull = new Set();

self.addEventListener('install', (event) => {
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

  // Manifests: stale-while-revalidate (serve cached, update in background)
  if (MANIFEST_PATTERN.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => cached); // Fallback to cache if network fails

          // Return cached immediately if available (only valid 200 entries), otherwise wait for network
          return (cached && cached.status === 200) ? cached : fetchPromise;
        })
      )
    );
    return;
  }

  // Segments: pass-through live request (may be 206 Partial Content on iOS / hls.js),
  // and background-fetch the full body (no Range) to cache as a clean 200.
  //
  // Correctness rules:
  //   - NEVER cache a 206 (partial bytes mis-served to a different Range = corrupt video).
  //   - Only ever serve full 200s from the cache. hls.js handles a 200 response to a
  //     range request fine — it just uses the whole body.
  //   - Dedupe concurrent background fetches per URL so we don't pile up bandwidth.
  if (CACHEABLE_PATTERN.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        // Match by URL only — ignore Range/Vary so a cached full body satisfies any range request.
        cache.match(new Request(url), { ignoreVary: true }).then(cached => {
          if (cached && cached.status === 200) {
            return cached;
          }

          // No cached full body yet — pass the live request through (likely 206).
          const passthrough = fetch(event.request);

          // In the BACKGROUND, fetch the full segment with no Range header → CF returns 200.
          if (!inflightFull.has(url)) {
            inflightFull.add(url);
            fetch(url, { cache: 'no-store' })
              .then(full => {
                if (full.ok && full.status === 200) {
                  cache.put(new Request(url), full.clone());
                  trimCache(cache);
                }
              })
              .catch(() => {})
              .finally(() => inflightFull.delete(url));
          }

          return passthrough;
        })
      )
    );
    return;
  }

  // Everything else: pass through (don't interfere with app requests)
});

// LRU-style cache trimming — delete oldest entries when over budget
async function trimCache(cache) {
  const keys = await cache.keys();

  // Only check every 50 additions to avoid overhead
  if (keys.length % 50 !== 0) return;

  let totalSize = 0;
  const entries = [];

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.clone().blob();
      entries.push({ request, size: blob.size, url: request.url });
      totalSize += blob.size;
    }
  }

  if (totalSize > MAX_CACHE_SIZE_BYTES) {
    // Delete oldest entries (FIFO — earliest cached first)
    let freed = 0;
    const target = totalSize - MAX_CACHE_SIZE_BYTES + (10 * 1024 * 1024); // Free 10MB extra headroom

    for (const entry of entries) {
      if (freed >= target) break;
      await cache.delete(entry.request);
      freed += entry.size;
    }
  }
}
