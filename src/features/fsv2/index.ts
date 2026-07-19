/**
 * fsv2 public surface.
 *
 * Callers import ONLY from this file:
 *
 *   import { openFsv2, Fsv2Overlay } from '@/features/fsv2';
 *
 * `openFsv2` mirrors the v1 OpenOptions shape and, when the target
 * media is a video, kicks a synchronous play() to claim the iOS
 * gesture token (see audioContract.ts).
 */

import type { Fsv2OpenOptions } from './types';
import { useFsv2Store } from './store/fsv2Store';
import { preWarmVideoForGesture } from './player/audioContract';
import { traceTap } from './perf/trace';

export { Fsv2Overlay } from './overlay/Fsv2Overlay';
export { useFsv2Store } from './store/fsv2Store';
export type { Fsv2OpenOptions } from './types';

/**
 * Open the V2 fullscreen viewer. Must be called synchronously inside a
 * user gesture handler for iOS unmuted playback to work.
 */
export function openFsv2(opts: Fsv2OpenOptions): void {
  if (!opts?.openedFrom) {
    if (import.meta.env.DEV) {
      console.warn('[fsv2] openFsv2() refused: openedFrom is required.');
    }
    return;
  }
  if (!opts.posts || opts.posts.length === 0) return;

  const startIndex = Math.max(
    0,
    Math.min(opts.startIndex ?? 0, opts.posts.length - 1),
  );
  const startPost = opts.posts[startIndex];
  let startMediaIdx = 0;
  if (startPost) {
    if (opts.mediaId) {
      const found = startPost.mediaItems.findIndex((m) => m.id === opts.mediaId);
      if (found >= 0) startMediaIdx = found;
    } else if (typeof opts.mediaIndex === 'number' && opts.mediaIndex >= 0) {
      startMediaIdx = Math.min(
        opts.mediaIndex,
        Math.max(0, startPost.mediaItems.length - 1),
      );
    }
  }
  const startMedia = startPost?.mediaItems?.[startMediaIdx];

  // Push state FIRST so the openId exists for the pre-warm registry.
  useFsv2Store.getState().open(opts);
  const openId = useFsv2Store.getState().openId;
  traceTap(openId, { openedFrom: opts.openedFrom });

  // Pre-warm the video element SYNCHRONOUSLY in the tap stack.
  if (startMedia?.type === 'video') {
    const m = startMedia as unknown as { hlsUrl?: string; mp4Url?: string; url?: string };
    preWarmVideoForGesture(
      openId,
      { hlsUrl: m.hlsUrl, mp4Url: m.mp4Url ?? m.url },
      opts.startPosition,
    );
  }
}
