/**
 * fsv2Bridge — decoder-starvation escape hatch.
 *
 * Lives OUTSIDE the fsv2 fence (feature code cannot import the video
 * engine directly). Subscribes to the fsv2 store's `isOpen` and drives
 * VideoEngine.releaseAllForOverlay() / restoreAfterOverlay() around the
 * overlay lifecycle.
 *
 *   false → true : release every lane's source SYNCHRONOUSLY (before the
 *                  overlay paints), freeing decoder slots for the
 *                  fullscreen video.
 *   true  → false : restore hook (no-op today; feed activation re-acquires).
 *
 * Traces: `fsv2.bridge.release` / `fsv2.bridge.restore`.
 */

import { useEffect } from 'react';

import { VideoEngine } from '@/video/VideoEngine';
import { useFsv2Store } from '@/features/fsv2/store/fsv2Store';
import { trace } from '@/perf/trace';
import { pushEvent } from '@/features/fsv2/debug/hudBus';

export function Fsv2Bridge(): null {
  useEffect(() => {
    let prevOpen = useFsv2Store.getState().isOpen;
    const unsub = useFsv2Store.subscribe((state) => {
      const isOpen = state.isOpen;
      if (isOpen === prevOpen) return;
      prevOpen = isOpen;
      if (isOpen) {
        const lanesDetached = VideoEngine.releaseAllForOverlay();
        trace('fsv2.bridge.release', { lanesDetached });
        pushEvent('fsv2.bridge.release', { openId: state.openId, lanesDetached });
      } else {
        VideoEngine.restoreAfterOverlay();
        trace('fsv2.bridge.restore', {});
        pushEvent('fsv2.bridge.restore', {});
      }
    });
    return unsub;
  }, []);
  return null;
}
