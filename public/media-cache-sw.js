const CACHE_NAME = 'clbhouz-media-v1';
const MAX_CACHE_SIZE_MB = 200;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

// Only cache Cloudflare Stream segments
const CACHEABLE_PATTERN = /\.cloudflarestream\.com\/.+\.(ts|m4s|mp4)(\?|$)/;
const MANIFEST_PATTERN = /\.cloudflarestream\.com\/.+\.(m3u8)(\?|$)/;

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
  
  // Manifests: network-first (they can change — ABR level selection)
  if (MANIFEST_PATTERN.test(url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Segments: cache-first (immutable content-addressed files)
  if (CACHEABLE_PATTERN.test(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
              trimCache(cache);
            });
          }
          return response;
        });
      })
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
