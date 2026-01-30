/**
 * Scroll Lock Fix Utilities
 * Ensures that scroll interactions (especially scrubbing) restore scroll properly.
 * 
 * v2: Added safety timeout to prevent permanent touch lock on mobile devices.
 */

let isScrubbing = false;
let scrubTimeout: ReturnType<typeof setTimeout> | null = null;

const SAFETY_TIMEOUT_MS = 3000; // Auto-reset after 3 seconds

/**
 * Start scrubbing/long-press interaction - prevents scroll
 * Includes safety timeout to auto-reset if endScrubbing isn't called
 */
export const startScrubbing = () => {
  isScrubbing = true;
  document.documentElement.style.touchAction = 'none';
  
  // Safety: auto-reset after timeout to prevent permanent lock
  if (scrubTimeout) clearTimeout(scrubTimeout);
  scrubTimeout = setTimeout(() => {
    endScrubbing();
  }, SAFETY_TIMEOUT_MS);
};

/**
 * End scrubbing/long-press interaction - restores scroll
 * Call this on pointerup, pointercancel, touchend, and touchcancel
 */
export const endScrubbing = () => {
  isScrubbing = false;
  document.documentElement.style.touchAction = '';
  
  if (scrubTimeout) {
    clearTimeout(scrubTimeout);
    scrubTimeout = null;
  }
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
