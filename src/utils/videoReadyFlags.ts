/**
 * videoReadyFlags — Tiny ready/pending flag map for instant-tile UX.
 *
 * Replaces the byte-storing hlsBlobCache (which no HLS loader ever read).
 * The SW + hls.js buffer are the only real caches now; this just tracks
 * "did prefetch finish?" so tiles can reveal without a spinner.
 */

type ReadyState = 'pending' | 'ready';

const flags = new Map<string, ReadyState>();

export const videoReadyFlags = {
  markPending: (id: string) => { if (id) flags.set(id, 'pending'); },
  markReady:   (id: string) => { if (id) flags.set(id, 'ready'); },
  isReady:     (id: string) => flags.get(id) === 'ready',
  isPending:   (id: string) => flags.get(id) === 'pending',
  clear:       (id: string) => { flags.delete(id); },
};

if (typeof window !== 'undefined') {
  (window as any).videoReadyFlags = videoReadyFlags;
}
