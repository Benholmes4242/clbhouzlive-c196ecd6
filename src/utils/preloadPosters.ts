/**
 * Preload poster images for faster first-screen rendering
 */

const preloadedPosters = new Set<string>();

export function preloadPosters(urls: string[], limit = 6) {
  const uniqueUrls = urls.slice(0, limit).filter(url => url && !preloadedPosters.has(url));
  
  uniqueUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    preloadedPosters.add(url);
  });
}

export function getPosterUrl(item: any): string {
  return item.thumbnailSrc || item.media?.[0]?.thumbnail_url || '';
}
