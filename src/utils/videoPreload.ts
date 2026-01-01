// Enhanced video preloading utilities with HLS support
import { getCloudflareStreamHLS } from '@/utils/cloudflareStreamAPI';

let cache = new Map<string, string>();
let HlsClass: any | null = null;

function canNativeHls(): boolean {
  if (typeof document === 'undefined') return false;
  const v = document.createElement('video') as any;
  return !!v.canPlayType && v.canPlayType('application/vnd.apple.mpegurl') !== '';
}

export async function warmHls() {
  if (HlsClass) return;
  try { 
    HlsClass = (await import('hls.js')).default; 
  } catch (error) {
    console.warn('Failed to load HLS.js:', error);
  }
}

export async function getHlsUrl(uid: string): Promise<string> {
  if (cache.has(uid)) return cache.get(uid)!;
  
  try {
    const url = await getCloudflareStreamHLS(uid);
    if (url) {
      cache.set(uid, url);
      return url;
    }
  } catch (error) {
    console.warn('Failed to get HLS URL for', uid, error);
  }
  
  // Fallback to constructed URL
  const fallbackUrl = `https://videodelivery.net/${uid}/manifest/video.m3u8`;
  cache.set(uid, fallbackUrl);
  return fallbackUrl;
}

export async function attachHlsIfNeeded(video: HTMLVideoElement, url: string) {
  // If already attached to this URL, do nothing.
  if (video.currentSrc === url || video.src === url) return;

  if (canNativeHls() || !HlsClass) {
    video.src = url;   // No destroy/reattach on mute changes
    return;
  }

  // Re-use or (re)create one Hls instance per element
  const existing = (video as any).__hlsInstance as any | undefined;
  if (existing) {
    existing.detachMedia();
    // do NOT destroy unless switching elements; we'll reuse for stability
  }

  const hls = existing ?? new HlsClass({
    autoStartLoad: true,
    capLevelToPlayerSize: true,
    startLevel: -1,
    backBufferLength: 30,
    lowLatencyMode: false,
  });

  (video as any).__hlsInstance = hls;
  hls.attachMedia(video);
  hls.on(HlsClass.Events.MEDIA_ATTACHED, () => {
    hls.loadSource(url);
  });
}

// Utility: element mostly in view
export function isElementMostlyInView(el: Element) {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const visibleX = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
  const visibleY = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  const area = r.width * r.height;
  const visible = visibleX * visibleY;
  return area > 0 && visible / area > 0.85;
}