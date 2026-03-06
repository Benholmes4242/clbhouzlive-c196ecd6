import type HlsType from 'hls.js';
import { createCachedLoader } from './cachedHlsLoader';

const dbg = (tag: string, ...args: any[]) => {
  console.log(`[${tag}] ${Date.now() % 100000}`, ...args);
};

export const HLS_CONFIG: Record<string, unknown> = {
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

const ATTACH_TIMEOUT = 8000;

// ── HLS.js constructor cache ──────────────────────────────────────────
let HlsConstructor: typeof HlsType | null = null;
let hlsLoadPromise: Promise<typeof HlsType | null> | null = null;

export async function getHls(): Promise<typeof HlsType | null> {
  if (HlsConstructor) return HlsConstructor;
  if (!hlsLoadPromise) {
    hlsLoadPromise = import('hls.js')
      .then((mod) => {
        HlsConstructor = (mod.default ?? mod) as typeof HlsType;
        return HlsConstructor;
      })
      .catch(() => null);
  }
  return hlsLoadPromise;
}

// Preload immediately
getHls();

/** Check native HLS support (Safari / iOS). */
export function supportsNativeHls(): boolean {
  const v = document.createElement('video');
  return v.canPlayType('application/vnd.apple.mpegurl') !== '';
}

// ── Instance registry ──────────────────────────────────────────────────
const hlsInstances = new Map<HTMLVideoElement, InstanceType<typeof HlsType>>();

/** Get the HLS instance currently bound to a video element. */
export function getHlsInstance(video: HTMLVideoElement): InstanceType<typeof HlsType> | undefined {
  return hlsInstances.get(video);
}

/** Build HLS config with cached loader if available. */
function getHlsConfig(): Record<string, unknown> {
  const config = { ...HLS_CONFIG };
  if (HlsConstructor) {
    const loader = createCachedLoader(HlsConstructor as any);
    config.fLoader = loader;
  }
  return config;
}

/**
 * Attach an HLS source to a video element.
 * Returns a Promise that resolves when the manifest has been parsed (hls.js)
 * or loadedmetadata fires (native).
 *
 * Includes an 8s internal timeout to prevent hanging Promises.
 */
export async function attachMedia(
  video: HTMLVideoElement,
  hlsUrl: string,
  onError?: (type: string, details: string) => void
): Promise<void> {
  dbg('HLS:ATTACH', 'attachMedia START, url:', hlsUrl?.slice(-40));
  
  // Always detach first
  detachMedia(video);

  if (supportsNativeHls()) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        video.removeEventListener('loadedmetadata', onMeta);
        dbg('HLS:ATTACH', 'TIMEOUT waiting for loadedmetadata (native), url:', hlsUrl?.slice(-40));
        reject(new Error('Native HLS attach timeout'));
      }, ATTACH_TIMEOUT);

      const onMeta = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', onMeta);
        dbg('HLS:ATTACH', 'loadedmetadata fired (native), url:', hlsUrl?.slice(-40));
        resolve();
      };
      video.addEventListener('loadedmetadata', onMeta);
      video.src = hlsUrl;
    });
  }

  const Hls = await getHls();
  if (!Hls || !Hls.isSupported()) {
    video.src = hlsUrl;
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      dbg('HLS:ATTACH', 'TIMEOUT waiting for MANIFEST_PARSED, url:', hlsUrl?.slice(-40));
      reject(new Error('HLS.js manifest parse timeout'));
    }, ATTACH_TIMEOUT);

    const hls = new (Hls as any)(getHlsConfig()) as InstanceType<typeof HlsType>;
    hlsInstances.set(video, hls);

    hls.on((Hls as any).Events.MANIFEST_PARSED, () => {
      dbg('HLS:ATTACH', 'MANIFEST_PARSED, levels:', hls.levels?.length, 'url:', hlsUrl?.slice(-40));
      clearTimeout(timeout);
      resolve();
    });

    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      dbg('HLS:ERROR', 'type:', data.type, 'details:', data.details, 'fatal:', data.fatal, 'url:', hlsUrl?.slice(-40));
      if (data.fatal) {
        clearTimeout(timeout);
        if (onError) onError(data.type, data.details);
        reject(new Error(`HLS fatal error: ${data.type} ${data.details}`));
      }
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(video);
  });
}

/**
 * Attempt hls.js media error recovery.
 * Returns true if recovery was attempted.
 */
export function recoverMediaError(video: HTMLVideoElement): boolean {
  const hls = hlsInstances.get(video);
  if (!hls) return false;
  try {
    hls.recoverMediaError();
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempt hls.js network retry.
 */
export function retryLoad(video: HTMLVideoElement): boolean {
  const hls = hlsInstances.get(video);
  if (!hls) return false;
  try {
    hls.startLoad();
    return true;
  } catch {
    return false;
  }
}

/** Detach & destroy any HLS instance on a video element. */
export function detachMedia(video: HTMLVideoElement): void {
  const hls = hlsInstances.get(video);
  if (hls) {
    dbg('HLS:DESTROY', 'Destroying HLS instance');
    try { hls.detachMedia(); } catch { /* ignore */ }
    try { hls.removeAllListeners(); } catch { /* ignore */ }
    try { hls.destroy(); } catch { /* ignore */ }
    hlsInstances.delete(video);
  }
  video.removeAttribute('src');
  video.load();
}

/** Destroy all tracked HLS instances. */
export function destroyAll(): void {
  hlsInstances.forEach((hls) => {
    try { hls.destroy(); } catch { /* ignore */ }
  });
  hlsInstances.clear();
}

// ── Pre-created instances (for preloader) ──────────────────────────────
const preCreatedInstances = new Map<string, InstanceType<typeof HlsType>>();

/**
 * Pre-create an HLS instance and load the source without attaching to
 * a video element. When the item becomes active we "promote" the instance
 * for near-instant playback.
 */
export async function preCreateHlsInstance(hlsUrl: string): Promise<void> {
  if (preCreatedInstances.has(hlsUrl)) return;
  if (supportsNativeHls()) return; // native doesn't need pre-creation

  const Hls = await getHls();
  if (!Hls || !Hls.isSupported()) return;

  const hls = new (Hls as any)(getHlsConfig()) as InstanceType<typeof HlsType>;
  hls.loadSource(hlsUrl);
  preCreatedInstances.set(hlsUrl, hls);

  // Limit pre-created pool to 2
  if (preCreatedInstances.size > 2) {
    const oldest = preCreatedInstances.keys().next().value;
    if (oldest) {
      const old = preCreatedInstances.get(oldest);
      old?.destroy();
      preCreatedInstances.delete(oldest);
    }
  }
}

/**
 * Promote a pre-created HLS instance by attaching it to a video element.
 * Returns the instance if promotion succeeded, null otherwise.
 */
export function promotePreCreated(
  hlsUrl: string,
  video: HTMLVideoElement,
  onError?: (type: string, details: string) => void
): InstanceType<typeof HlsType> | null {
  dbg('HLS:PROMOTE', 'promotePreCreated START, url:', hlsUrl?.slice(-40));
  const hls = preCreatedInstances.get(hlsUrl);
  if (!hls) {
    dbg('HLS:PROMOTE', 'No pre-created instance found');
    return null;
  }

  preCreatedInstances.delete(hlsUrl);
  hlsInstances.set(video, hls);

  // Wire up error forwarding
  const Hls = HlsConstructor;
  if (Hls && onError) {
    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      dbg('HLS:ERROR', 'type:', data.type, 'details:', data.details, 'fatal:', data.fatal, 'url:', hlsUrl?.slice(-40));
      if (data.fatal) onError(data.type, data.details);
    });
  }

  hls.attachMedia(video);
  dbg('HLS:PROMOTE', 'promotePreCreated SUCCESS');
  return hls;
}

/** Destroy all pre-created instances. */
export function destroyPreCreated(): void {
  preCreatedInstances.forEach((hls) => {
    try { hls.destroy(); } catch { /* ignore */ }
  });
  preCreatedInstances.clear();
}
