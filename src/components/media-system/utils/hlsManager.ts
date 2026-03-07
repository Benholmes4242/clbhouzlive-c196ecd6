import type HlsType from 'hls.js';
import { createCachedLoader } from './cachedHlsLoader';

const perf = (tag: string, ...args: any[]) => {
  console.log(`[PERF:${tag}] ${Date.now() % 100000}`, ...args);
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
  // Always detach first
  detachMedia(video);
  perf('HLS', 'attachMedia START url:', hlsUrl?.slice(-40));

  const Hls = await getHls();
  const canUseHlsJs = !!Hls && Hls.isSupported();

  if (canUseHlsJs) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HLS.js manifest parse timeout'));
      }, ATTACH_TIMEOUT);

      const hls = new (Hls as any)(getHlsConfig()) as InstanceType<typeof HlsType>;
      hlsInstances.set(video, hls);

      hls.on((Hls as any).Events.MANIFEST_PARSED, () => {
        clearTimeout(timeout);
        perf('HLS', 'MANIFEST_PARSED levels:', hls.levels?.length);
        resolve();
      });

      hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
        if (data.fatal) {
          clearTimeout(timeout);
          if (onError) onError(data.type, data.details);
          reject(new Error(`HLS fatal error: ${data.type} ${data.details}`));
        }
      });

      perf('HLS', 'loadSource called');
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    });
  }

  if (supportsNativeHls()) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        video.removeEventListener('loadedmetadata', onMeta);
        reject(new Error('Native HLS attach timeout'));
      }, ATTACH_TIMEOUT);

      const onMeta = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', onMeta);
        perf('HLS', 'loadedmetadata readyState:', video.readyState);
        resolve();
      };
      video.addEventListener('loadedmetadata', onMeta);
      video.src = hlsUrl;
    });
  }

  video.src = hlsUrl;
  return;
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
interface PreCreatedEntry {
  hls: InstanceType<typeof HlsType>;
  dummyVideo: HTMLVideoElement;
}
const preCreatedInstances = new Map<string, PreCreatedEntry>();

/**
 * Pre-create an HLS instance, attach to a hidden dummy video so HLS.js
 * actually buffers the first segment. On promote we detach from dummy
 * and re-attach to the real pool element for near-instant playback.
 */
export async function preCreateHlsInstance(hlsUrl: string): Promise<void> {
  if (preCreatedInstances.has(hlsUrl)) {
    perf('HLS', 'preCreate SKIP (already exists) url:', hlsUrl.slice(-50));
    return;
  }

  const Hls = await getHls();
  if (!Hls || !Hls.isSupported()) return;

  perf('HLS', 'preCreate START url:', hlsUrl.slice(-50));
  const hls = new (Hls as any)(getHlsConfig()) as InstanceType<typeof HlsType>;

  // Create hidden dummy video for segment buffering
  const dummyVideo = document.createElement('video');
  dummyVideo.muted = true;
  dummyVideo.playsInline = true;
  dummyVideo.preload = 'auto';
  // Don't append to DOM — stays offscreen

  return new Promise<void>((resolve) => {
    hls.on((Hls as any).Events.MANIFEST_PARSED, () => {
      perf('HLS', 'preCreate MANIFEST_PARSED url:', hlsUrl.slice(-50));
      // Force lowest quality for preload to speed up segment fetch
      hls.currentLevel = 0;
      resolve();
    });

    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) {
        perf('HLS', 'preCreate ERROR url:', hlsUrl.slice(-50), data.details);
        preCreatedInstances.delete(hlsUrl);
        perf('HLS', 'preCreated MAP DELETE key:', hlsUrl, 'mapSize:', preCreatedInstances.size);
        try { hls.destroy(); } catch { /* ignore */ }
        resolve();
      }
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(dummyVideo); // Triggers actual segment downloads!
    perf('HLS', 'preCreate ATTACHED to dummy, buffering...', hlsUrl.slice(-50));

    preCreatedInstances.set(hlsUrl, { hls, dummyVideo });
    perf('HLS', 'preCreated MAP ADD key:', hlsUrl, 'mapSize:', preCreatedInstances.size);

    // Safety timeout
    setTimeout(() => resolve(), 5000);
  });
}

/**
 * Destroy pre-created instances whose URLs are NOT in the keepUrls set.
 */
export function destroyStalePreCreated(keepUrls: Set<string>): void {
  for (const [url, entry] of preCreatedInstances) {
    if (!keepUrls.has(url)) {
      perf('HLS', 'preCreate DESTROY stale url:', url.slice(-50));
      try { entry.hls.destroy(); } catch { /* ignore */ }
      entry.dummyVideo.removeAttribute('src');
      preCreatedInstances.delete(url);
      perf('HLS', 'preCreated MAP DELETE key:', url, 'mapSize:', preCreatedInstances.size);
    }
  }
}

/**
 * Promote a pre-created HLS instance by detaching from its dummy video
 * and re-attaching to the real pool video element.
 * Segments already buffered on the dummy carry over via the HLS instance.
 */
export function promotePreCreated(
  hlsUrl: string,
  video: HTMLVideoElement,
  onError?: (type: string, details: string) => void
): InstanceType<typeof HlsType> | null {
  perf('HLS', 'promotePreCreated START url:', hlsUrl.slice(-50), 'preCreatedKeys:', [...preCreatedInstances.keys()].map(k => k.slice(-50)));
  const entry = preCreatedInstances.get(hlsUrl);
  if (!entry) {
    perf('HLS', 'promotePreCreated result:', false);
    return null;
  }

  const { hls, dummyVideo } = entry;
  preCreatedInstances.delete(hlsUrl);
  perf('HLS', 'preCreated MAP DELETE key:', hlsUrl, 'mapSize:', preCreatedInstances.size);
  hlsInstances.set(video, hls);

  // Wire up error forwarding
  const Hls = HlsConstructor;
  if (Hls && onError) {
    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) onError(data.type, data.details);
    });
  }

  // Detach from dummy, attach to real video — segments stay in HLS buffer
  hls.detachMedia();
  hls.attachMedia(video);
  perf('HLS', 'promote: detached dummy, attached real, readyState:', video.readyState);

  // Clean up dummy
  dummyVideo.removeAttribute('src');

  // Log readyState after attach settles
  const checkReady = () => {
    const buffered = video.buffered.length > 0 ? video.buffered.end(0) : 0;
    perf('HLS', 'promote: real video readyState:', video.readyState, 'buffered:', buffered);
  };
  video.addEventListener('loadeddata', checkReady, { once: true });
  setTimeout(checkReady, 100); // fallback check

  perf('HLS', 'promotePreCreated result:', true);
  return hls;
}

/** Destroy all pre-created instances. */
export function destroyPreCreated(): void {
  preCreatedInstances.forEach((entry, url) => {
    try { entry.hls.destroy(); } catch { /* ignore */ }
    entry.dummyVideo.removeAttribute('src');
    preCreatedInstances.delete(url);
    perf('HLS', 'preCreated MAP DELETE key:', url, 'mapSize:', preCreatedInstances.size);
  });
}
