/**
 * Shared bandwidth estimate across all HLS instances (SnapVideoPlayer + UnifiedVideoPlayer)
 * Persisted to localStorage so cold starts seed the last known real value
 * instead of re-guessing 8Mbps every session.
 */
const STORAGE_KEY = 'clbhouz-bw-estimate';
const DEFAULT_BW = 8_000_000; // 8Mbps fallback (first-ever launch only)

const loadInitial = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (n > 0) return n;
    }
  } catch {}
  return DEFAULT_BW;
};

let _sharedBandwidth = loadInitial();

export const getSharedBandwidth = (): number => _sharedBandwidth;

export const saveSharedBandwidth = (bw: number): void => {
  if (bw > 0) {
    _sharedBandwidth = bw;
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(bw)));
    } catch {}
  }
};
