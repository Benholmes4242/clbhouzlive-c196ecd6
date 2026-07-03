/**
 * usePausedFirstFrame - STUBBED (video teardown Stage A)
 * No video interaction. Reports hasFirstFrame=true so any reveal gate
 * that depends on it does not hide the poster tile.
 */
import type React from 'react';

export function usePausedFirstFrame(
  _videoRef: React.RefObject<HTMLVideoElement>,
  _active: boolean,
  _attachToken: number = 0,
) {
  return {
    hasFirstFrame: true,
    reset: () => {},
  };
}
