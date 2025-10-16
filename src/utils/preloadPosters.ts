export function preloadPosters(urls: string[], count = 2) {
  if (typeof document === 'undefined') return;
  const head = document.head;
  urls.slice(0, count).forEach((url) => {
    // Avoid duplicating the same preload
    if ([...head.querySelectorAll('link[rel="preload"]')].some(l => l.getAttribute('href') === url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    // For cross-origin posters from Cloudflare Stream
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });
}
