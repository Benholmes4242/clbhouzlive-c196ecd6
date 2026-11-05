/** FW1 gesture thresholds. Ben's ruling: 260ms handover during the 320ms exit. */
export const FEATURED_MIN = 3;
export const FEATURED_EXIT_MS = 320;
export const FEATURED_ADVANCE_MS = 260;
export const FEATURED_CROSSFADE_MS = 150;
export const FEATURED_TAP_MS = 320;
export function featuredSwipe(dx: number, end: boolean): 'next' | 'back' | 'stay' {
  return end ? (dx > 80 ? 'back' : 'stay') : Math.abs(dx) > 90 ? 'next' : 'stay';
}