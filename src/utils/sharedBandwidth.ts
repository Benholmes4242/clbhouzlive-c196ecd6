/**
 * Shared bandwidth estimate across all HLS instances (SnapVideoPlayer + UnifiedVideoPlayer)
 * Module-level singleton — persists for the lifetime of the page
 */
let _sharedBandwidth = 8_000_000; // 8Mbps default

export const getSharedBandwidth = (): number => _sharedBandwidth;

export const saveSharedBandwidth = (bw: number): void => {
  if (bw > 0) _sharedBandwidth = bw;
};
