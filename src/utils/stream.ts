// utils/stream.ts
export function getStreamIdFromUrl(url: string): string | null {
  // e.g. https://customer-xxxx.cloudflarestream.com/<STREAM_ID>/manifest/video.m3u8
  const m = url.match(/cloudflarestream\.com\/([^/]+)\//i);
  return m?.[1] ?? null;
}

export function getStreamPoster(urlOrId: string, time = '1s'): string | null {
  const id = urlOrId.includes('cloudflarestream.com')
    ? getStreamIdFromUrl(urlOrId)
    : urlOrId;
  return id ? `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${id}/thumbnails/thumbnail.jpg?time=${time}` : null;
}