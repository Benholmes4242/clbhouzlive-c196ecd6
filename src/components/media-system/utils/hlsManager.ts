import type HlsType from 'hls.js';

const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  startLevel: -1,
  capLevelToPlayerSize: true,
  maxBufferLength: 15,
  maxMaxBufferLength: 30,
  startFragPrefetch: true,
  progressive: true,
  abrBandWidthFactor: 0.95,
  abrBandWidthUpFactor: 0.7,
  fragLoadingMaxRetry: 4,
};

// Cache the HLS.js constructor
let HlsConstructor: typeof HlsType | null = null;
let hlsLoadPromise: Promise<typeof HlsType | null> | null = null;

async function getHls(): Promise<typeof HlsType | null> {
  if (HlsConstructor) return HlsConstructor;
  if (!hlsLoadPromise) {
    hlsLoadPromise = import('hls.js').then((mod) => {
      HlsConstructor = (mod.default ?? mod) as typeof HlsType;
      return HlsConstructor;
    }).catch(() => null);
  }
  return hlsLoadPromise;
}

// Preload immediately
getHls();

/**
 * Check if browser supports native HLS (Safari/iOS).
 */
export function supportsNativeHls(): boolean {
  const video = document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}

// Map of video elements to their HLS instances
const hlsInstances = new Map<HTMLVideoElement, InstanceType<typeof HlsType>>();

/**
 * Attach an HLS source to a video element.
 * Uses native HLS on Safari, hls.js elsewhere.
 */
export async function attachMedia(
  video: HTMLVideoElement,
  hlsUrl: string
): Promise<void> {
  // Detach any existing source first
  detachMedia(video);

  if (supportsNativeHls()) {
    video.src = hlsUrl;
    return;
  }

  const Hls = await getHls();
  if (!Hls || !Hls.isSupported()) {
    // Fallback: try direct src
    video.src = hlsUrl;
    return;
  }

  const hls = new Hls(HLS_CONFIG);
  hlsInstances.set(video, hls);
  hls.loadSource(hlsUrl);
  hls.attachMedia(video);
}

/**
 * Detach HLS from a video element and clean up.
 */
export function detachMedia(video: HTMLVideoElement): void {
  const hls = hlsInstances.get(video);
  if (hls) {
    hls.destroy();
    hlsInstances.delete(video);
  }
  video.removeAttribute('src');
  video.load();
}

/**
 * Destroy all HLS instances.
 */
export function destroyAll(): void {
  hlsInstances.forEach((hls) => hls.destroy());
  hlsInstances.clear();
}
