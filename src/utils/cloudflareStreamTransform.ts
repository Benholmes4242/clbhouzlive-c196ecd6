// UNIVERSAL CLOUDFLARE STREAM EMBED TRANSFORM
// NO HLS MANIFESTS ALLOWED - IFRAME ONLY POLICY
// This function enforces iframe-only video playback for all Cloudflare Stream content

const IFRAME_BASE = 'https://iframe.videodelivery.net/';
const UID_RE = /([0-9a-f]{32})/i;
const HLS_PATTERN = /\.m3u8$/;
const CLOUDFLARE_STREAM_PATTERN = /cloudflarestream\.com/;

// STRICT POLICY: Block any HLS manifest usage
export function blockHLSUsage(url: string): void {
  if (HLS_PATTERN.test(url)) {
    console.error('🚫 HLS BLOCKED: HLS manifests are not allowed. Use iframe embed instead:', url);
    throw new Error('HLS manifests are disabled. All videos must use iframe embeds.');
  }
}

// Transform any Cloudflare URL to iframe embed (enforces iframe-only policy)
export function transformToIframeUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  // Block HLS usage
  blockHLSUsage(url);
  
  // If already an iframe URL, return as-is
  if (url.includes('iframe.videodelivery.net')) {
    return url;
  }
  
  // Extract video ID and convert to iframe
  const videoId = extractVideoId(url);
  if (videoId && isCloudflareStreamUrl(url)) {
    return generateEmbedUrl(videoId);
  }
  
  return url;
}

// Extract Cloudflare Stream UID from various possible fields or URLs
function uidFromNode(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;

  // Common Cloudflare Stream keys
  if (typeof obj.uid === 'string' && UID_RE.test(obj.uid)) return obj.uid;
  if (typeof obj.video_uid === 'string' && UID_RE.test(obj.video_uid)) return obj.video_uid;
  if (typeof obj.videoId === 'string' && UID_RE.test(obj.videoId)) return obj.videoId;
  if (typeof obj.id === 'string' && UID_RE.test(obj.id)) return obj.id;

  // Derive from various URL fields - BUT BLOCK HLS MANIFESTS
  const urlFields = [obj.hls, obj.hls_url, obj.manifest, obj.manifestUrl, 
                    obj.playback?.hls, obj.media_url, obj.video_url, obj.src];
  
  for (const field of urlFields) {
    const url = typeof field === 'string' ? field : 
                (typeof field?.url === 'string' ? field.url : null);
    
    if (url) {
      // Block HLS manifests
      if (HLS_PATTERN.test(url)) {
        console.warn('🚫 HLS manifest found in data, converting to iframe:', url);
        // Extract video ID and continue processing as iframe
      }
      
      const match = url.match(UID_RE);
      if (match) return match[1];
    }
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
      // ENFORCE IFRAME-ONLY: Always set iframe URLs
      node.embed_url = `${IFRAME_BASE}${uid}`;
      node.iframe_src = node.embed_url; // convenience alias
      node.video_id = uid;
      
      // Transform HLS URLs to iframe URLs in place
      const urlFields = ['media_url', 'video_url', 'src', 'hls', 'hls_url', 'manifest', 'manifestUrl'];
      for (const field of urlFields) {
        if (node[field] && typeof node[field] === 'string' && isCloudflareStreamUrl(node[field])) {
          try {
            node[field] = transformToIframeUrl(node[field]);
          } catch (error) {
            // If HLS URL, replace with iframe
            if (HLS_PATTERN.test(node[field])) {
              node[field] = node.embed_url;
              console.warn(`🔄 Converted HLS to iframe for ${field}:`, node[field]);
            }
          }
        }
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

// Main transform function - ENFORCES IFRAME-ONLY POLICY
export function transformCloudflareStreamData(data: any): any {
  return visit(data);
}

// Universal data transformer - converts HLS to iframe in any data structure
export function enforceIframeOnlyPolicy(data: any): any {
  return transformCloudflareStreamData(data);
}

// Helper to check if a URL is a Cloudflare Stream URL
export function isCloudflareStreamUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CLOUDFLARE_STREAM_PATTERN.test(url) || 
         url.includes('videodelivery.net') || 
         UID_RE.test(url);
}

// Helper to extract video ID from any Cloudflare Stream URL - BLOCKS HLS
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Block HLS usage first (but allow extraction for conversion)
  if (HLS_PATTERN.test(url)) {
    console.warn('🚫 HLS manifest detected, extracting ID for iframe conversion:', url);
  }
  
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