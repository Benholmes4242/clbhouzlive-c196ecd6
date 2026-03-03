import type HlsType from 'hls.js';

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

/**
 * Attach an HLS source to a video element.
 * Returns a Promise that resolves when the manifest has been parsed (hls.js)
 * or loadedmetadata fires (native).
 *
 * Includes optional error callback for fatal HLS errors.
 */
export async function attachMedia(
  video: HTMLVideoElement,
  hlsUrl: string,
  onError?: (type: string, details: string) => void
): Promise<void> {
  // Always detach first
  detachMedia(video);

  if (supportsNativeHls()) {
    return new Promise<void>((resolve) => {
      const onMeta = () => {
        video.removeEventListener('loadedmetadata', onMeta);
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

  return new Promise<void>((resolve) => {
    const hls = new (Hls as any)(HLS_CONFIG) as InstanceType<typeof HlsType>;
    hlsInstances.set(video, hls);

    // Resolve when manifest is parsed (video is ready to play)
    hls.on((Hls as any).Events.MANIFEST_PARSED, () => resolve());

    // Error forwarding
    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal && onError) {
        onError(data.type, data.details);
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

  const hls = new (Hls as any)(HLS_CONFIG) as InstanceType<typeof HlsType>;
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
  const hls = preCreatedInstances.get(hlsUrl);
  if (!hls) return null;

  preCreatedInstances.delete(hlsUrl);
  hlsInstances.set(video, hls);

  // Wire up error forwarding
  const Hls = HlsConstructor;
  if (Hls && onError) {
    hls.on((Hls as any).Events.ERROR, (_event: unknown, data: any) => {
      if (data.fatal) onError(data.type, data.details);
    });
  }

  hls.attachMedia(video);
  return hls;
}

/** Destroy all pre-created instances. */
export function destroyPreCreated(): void {
  preCreatedInstances.forEach((hls) => {
    try { hls.destroy(); } catch { /* ignore */ }
  });
  preCreatedInstances.clear();
}
