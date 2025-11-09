/**
 * Scroll Lock Fix Utilities
 * Ensures that scroll interactions (especially scrubbing) restore scroll properly.
 */

let isScrubbing = false;

/**
 * Start scrubbing/long-press interaction - prevents scroll
 */
export const startScrubbing = () => {
  isScrubbing = true;
  document.documentElement.style.touchAction = 'none';
};

/**
 * End scrubbing/long-press interaction - restores scroll
 * Call this on pointerup, pointercancel, touchend, and touchcancel
 */
export const endScrubbing = () => {
  isScrubbing = false;
  document.documentElement.style.touchAction = '';
};

/**
 * Check if currently scrubbing
 */
export const getIsScrubbing = () => isScrubbing;

/**
 * Force reset scrubbing state (use if needed for cleanup)
 */
export const forceResetScrubbing = () => {
  endScrubbing();
};
