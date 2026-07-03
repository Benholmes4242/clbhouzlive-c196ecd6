/**
 * useTileVideoPlayer - STUBBED (video teardown Stage A)
 * attachHlsToTile is a no-op returning null. prefetchTile is a no-op.
 */

interface AttachHlsToTileOptions {
  hlsUrl: string;
  mp4Fallback?: string;
  video: HTMLVideoElement;
  onReady?: () => void;
}

export async function attachHlsToTile(_opts: AttachHlsToTileOptions): Promise<any | null> {
  return null;
}

export function prefetchTile(_hlsUrl: string): void {}
