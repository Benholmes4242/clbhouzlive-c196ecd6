// Singleton HLS debug registry — shared across all module chunks.
// Must be in its own file so Vite doesn't create two instances.

const HLS_REGISTRY = new Map<string, { hls: any; video: HTMLVideoElement }>();

export function registerHlsForDebug(videoId: string, hls: any, video: HTMLVideoElement) {
  HLS_REGISTRY.set(videoId, { hls, video });
}

export function unregisterHlsForDebug(videoId: string) {
  HLS_REGISTRY.delete(videoId);
}

export function getHlsRegistry() {
  return HLS_REGISTRY;
}
