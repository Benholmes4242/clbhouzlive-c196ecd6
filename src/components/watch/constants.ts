/**
 * Shared constants for the Watch / Clips surfaces.
 * Hoisted here so future tuning is a single-file change.
 */

/** Long-press hold duration in ms before the action sheet fires. Matches iOS native. */
export const LONG_PRESS_MS = 500;

/** Pointer movement threshold (px) that cancels an in-flight long-press. */
export const TOUCHMOVE_CANCEL_PX = 8;
