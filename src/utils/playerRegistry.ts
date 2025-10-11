import Hls from 'hls.js';

// Global player registry - module singleton
export const MAX_ACTIVE_PLAYERS = 2;
export const activePlayers = new Set<HTMLVideoElement>();

// Optional: limit concurrent HLS instances to save bandwidth
export const MAX_ATTACHED_HLS = 6;
export const attachedHls = new Map<string, Hls>(); // id -> Hls instance

/**
 * Remove the furthest HLS instance when at capacity
 */
export function evictFurthestHls(currentId: string): void {
  if (attachedHls.size < MAX_ATTACHED_HLS) return;
  
  // Simple strategy: evict the first one (FIFO)
  // Could be enhanced with distance-from-viewport heuristic
  const firstId = Array.from(attachedHls.keys())[0];
  if (firstId && firstId !== currentId) {
    const hls = attachedHls.get(firstId);
    if (hls) {
      hls.destroy();
      attachedHls.delete(firstId);
    }
  }
}
