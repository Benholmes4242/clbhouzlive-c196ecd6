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
const preCreatedInstances = new Map<string, InstanceType<typeof HlsType>>();

/**
 * Pre-create an HLS instance and load the source without attaching to
 * a video element. When the item becomes active we "promote" the instance
 * for near-instant playback.
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

  // Wait for MANIFEST_PARSED so the instance is truly ready for instant promotion
  return new Promise<void>((resolve) => {
    hls.once((Hls as any).Events.MANIFEST_PARSED, (_event: unknown, data: any) => {
      // Force lowest quality for fast first segment
      hls.currentLevel = 0;
      hls.startLoad(); // ensure level playlist fetch begins immediately

      // Pre-warm: fetch first segment so the SW caches it before ACTIVATE
      const level = data.levels?.[0];
      if (level?.details?.fragments?.length > 0) {
        const segUrl = level.details.fragments[0].url;
        if (segUrl) {
          perf('HLS', 'preCreate pre-warm path: MANIFEST_PARSED direct fired', hlsUrl.slice(-50));
          perf('HLS', 'preCreate first seg pre-warm url:', segUrl.slice(-50));
          fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
        }
      } else {
        const levelUrl = data.levels?.[0]?.url;
        const levelUrlStr = Array.isArray(levelUrl) ? levelUrl[0] : levelUrl;
        if (levelUrlStr) {
          perf('HLS', 'preCreate pre-warm: fetching level playlist', hlsUrl.slice(-50));
          fetch(levelUrlStr, { mode: 'cors', credentials: 'omit' })
            .then(r => r.text())
            .then(text => {
              const lines = text.split('\n');
              const base = levelUrlStr.substring(0, levelUrlStr.lastIndexOf('/') + 1);

              // Pre-warm init segment (#EXT-X-MAP) if present
              const mapLine = lines.find(l => l.startsWith('#EXT-X-MAP:URI="'));
              if (mapLine) {
                const mapUri = mapLine.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
                if (mapUri) {
                  const initUrl = mapUri.startsWith('http')
                    ? mapUri
                    : new URL(mapUri, base).href;
                  perf('HLS', 'preCreate pre-warm init segment url:', initUrl.slice(-50));
                  fetch(initUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
                }
              }

              // Pre-warm first media segment
              const segLine = lines.find(l => l.trim() && !l.startsWith('#'));
              if (segLine) {
                const segUrl = segLine.trim().startsWith('http')
                  ? segLine.trim()
                  : new URL(segLine.trim(), base).href;
                perf('HLS', 'preCreate pre-warm path: level-playlist-parse fired', hlsUrl.slice(-50));
                perf('HLS', 'preCreate first seg pre-warm url:', segUrl.slice(-50));
                fetch(segUrl, { mode: 'cors', credentials: 'omit' }).catch(() => {});
              }
            })
            .catch(err => {
              perf('HLS', 'preCreate level playlist fetch ERROR:', String(err).slice(0, 100));
            });
        }
      }

      resolve();
    });

    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) {
        perf('HLS', 'preCreate ERROR url:', hlsUrl.slice(-50), data.details);
        preCreatedInstances.delete(hlsUrl);
        perf('HLS', 'preCreated MAP DELETE key:', hlsUrl, 'mapSize:', preCreatedInstances.size);
        try { hls.destroy(); } catch { /* ignore */ }
        resolve(); // resolve anyway to not block
      }
    });

    hls.loadSource(hlsUrl);
    preCreatedInstances.set(hlsUrl, hls);
    perf('HLS', 'preCreated MAP ADD key:', hlsUrl, 'mapSize:', preCreatedInstances.size);

    // Safety timeout — don't wait forever
    setTimeout(() => resolve(), 5000);
  });
}

/**
 * Destroy pre-created instances whose URLs are NOT in the keepUrls set.
 * Called when activeIndex changes to clean up stale preloads.
 */
/**
 * Imperatively pre-warm the first segment of an already-parsed preCreated instance.
 * Call on SPRING so the SW caches the segment ~500ms before ACTIVATE.
 */
export function prewarmFirstSegment(hlsUrl: string): void {
  const entry = preCreatedInstances.get(hlsUrl);
  if (!entry) return;
  const level = (entry as any).levels?.[0];
  const frag = level?.details?.fragments?.[0];
  if (frag?.url) {
    perf('HLS', 'imperative pre-warm url:', frag.url.slice(-50));
    fetch(frag.url, { mode: 'cors', credentials: 'omit' }).catch(() => {});
  }
}

export function destroyStalePreCreated(keepUrls: Set<string>): void {
  for (const [url, hls] of preCreatedInstances) {
    if (!keepUrls.has(url)) {
      perf('HLS', 'preCreate DESTROY stale url:', url.slice(-50));
      try { hls.destroy(); } catch { /* ignore */ }
      preCreatedInstances.delete(url);
      perf('HLS', 'preCreated MAP DELETE key:', url, 'mapSize:', preCreatedInstances.size);
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
  perf('HLS', 'promotePreCreated START url:', hlsUrl.slice(-50), 'preCreatedKeys:', [...preCreatedInstances.keys()].map(k => k.slice(-50)));
  const hls = preCreatedInstances.get(hlsUrl);
  if (!hls) {
    perf('HLS', 'promotePreCreated result:', false);
    return null;
  }

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

  hls.attachMedia(video);
  perf('HLS', 'promotePreCreated result:', true);
  return hls;
}

/** Destroy all pre-created instances. */
export function destroyPreCreated(): void {
  preCreatedInstances.forEach((hls, url) => {
    try { hls.destroy(); } catch { /* ignore */ }
    preCreatedInstances.delete(url);
    perf('HLS', 'preCreated MAP DELETE key:', url, 'mapSize:', preCreatedInstances.size);
  });
}
