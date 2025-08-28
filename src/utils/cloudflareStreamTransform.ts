// CLOUDFLARE STREAM → HLS TRANSFORM
// Transforms video objects to include hls_url, poster, uid for every video object

const UID_RE = /([0-9a-f]{32})/i;

// Extract Cloudflare Stream UID from various possible fields or URLs
export function uidFromNode(obj: any): string | null {
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
    if (uid) {
      node.uid = uid;
      // Try common locations for HLS + poster; keep existing if already present
      node.hls_url = node.hls_url || node?.playback?.hls || node?.manifestUrl || node?.manifest || 
                    `https://videodelivery.net/${uid}/manifest/video.m3u8`;
      node.poster = node.poster || node.thumbnail || node?.input?.poster || node?.thumbnail?.src ||
                   `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?height=600`;
      
      // Keep embed_url for backward compatibility
      if (!node.embed_url) {
        node.embed_url = `https://iframe.videodelivery.net/${uid}`;
        node.iframe_src = node.embed_url; // convenience alias
      }
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

// Main transform function - now adds HLS data instead of just embed URLs
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
  const baseUrl = `https://iframe.videodelivery.net/${videoId}`;
  return token ? `${baseUrl}?token=${token}` : baseUrl;
}

// Helper to generate HLS URL from video ID
export function generateHlsUrl(videoId: string): string {
  return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
}

// Helper to generate thumbnail URL from video ID
export function generateThumbnailUrl(videoId: string, options: {
  width?: number;
  height?: number;
  time?: number;
} = {}): string {
  const { width = 1280, height = 720, time = 1 } = options;
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
}
