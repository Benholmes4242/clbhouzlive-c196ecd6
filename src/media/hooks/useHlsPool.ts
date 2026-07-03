/**
 * useHlsPool - STUBBED (video teardown Stage A)
 * No hls.js, no attach; both methods are no-ops.
 */
import { useCallback } from 'react';

export interface HlsPoolHandle {
  attach: (
    hlsUrl: string,
    video: HTMLVideoElement,
    mp4Fallback?: string,
    surface?: 'feed' | 'fullscreen',
  ) => Promise<void>;
  teardown: (hlsUrl: string) => void;
}

export function useHlsPool(): HlsPoolHandle {
  const attach = useCallback(async (_hlsUrl: string, _video: HTMLVideoElement) => {}, []);
  const teardown = useCallback((_hlsUrl: string) => {}, []);
  return { attach, teardown };
}
