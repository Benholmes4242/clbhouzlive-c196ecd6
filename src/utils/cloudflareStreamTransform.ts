// UNIVERSAL CLOUDFLARE STREAM EMBED TRANSFORM
// Transforms video objects to include embed_url for iframe playback

const IFRAME_BASE = 'https://iframe.videodelivery.net/';
const UID_RE = /([0-9a-f]{32})/i;

// Extract Cloudflare Stream UID from various possible fields or URLs
function uidFromNode(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;

  // Common Cloudflare Stream keys
  if (typeof obj.uid === 'string' && UID_RE.test(obj.uid)) return obj.uid;
  if (typeof obj.video_uid === 'string' && UID_RE.test(obj.video_uid)) return obj.video_uid;
  if (typeof obj.videoId === 'string' && UID_RE.test(obj.videoId)) return obj.videoId;
  if (typeof obj.id === 'string' && UID_RE.test(obj.id)) return obj.id;

  // Derive from HLS URL if present
  const hls = obj.hls || obj.hls_url || obj.manifest || obj.manifestUrl || 
              obj.playback?.hls || obj.media_url || obj.video_url || obj.src;
  
  const hlsUrl = typeof hls === 'string' ? hls : 
                 (typeof hls?.url === 'string' ? hls.url : null);
  
  if (hlsUrl) {
    const match = hlsUrl.match(UID_RE);
    if (match) return match[1];
  }
  
  return null;
}

// Recursively visit and transform objects/arrays
function visit(node: any): any {
  if (Array.isArray(node)) {
    return node.map(visit);
  }

  if (node && typeof node === 'object') {
    const uid = uidFromNode(node);
    if (uid && !node.embed_url) {
      node.embed_url = `${IFRAME_BASE}${uid}`;
      node.iframe_src = node.embed_url; // convenience alias
    }
    
    // Recursively transform nested objects
    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        node[key] = visit(node[key]);
      }
    }
    
    return node;
  }
  
  return node;
}

// Main transform function
export function transformCloudflareStreamData(data: any): any {
  return visit(data);
}

// Helper to check if a URL is a Cloudflare Stream URL
export function isCloudflareStreamUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cloudflarestream.com') || 
         url.includes('videodelivery.net') || 
         UID_RE.test(url);
}

// Helper to extract video ID from any Cloudflare Stream URL
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(UID_RE);
  return match ? match[1] : null;
}

// Helper to generate embed URL from video ID
export function generateEmbedUrl(videoId: string, token?: string): string {
  const baseUrl = `${IFRAME_BASE}${videoId}`;
  return token ? `${baseUrl}?token=${token}` : baseUrl;
}

// Helper to generate thumbnail URL from video ID
export function generateThumbnailUrl(videoId: string, options: {
  width?: number;
  height?: number;
  time?: number;
} = {}): string {
  const { width = 1280, height = 720, time = 1 } = options;
  return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
}