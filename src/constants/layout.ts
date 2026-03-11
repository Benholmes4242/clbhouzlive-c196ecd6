/**
 * Shared layout constants for Clubhouse overlay positioning.
 * All overlay elements (action rail, creator capsule, skeleton) reference these
 * so bottom nav height changes propagate from a single source.
 */
export const BOTTOM_NAV_HEIGHT = 80;
export const OVERLAY_BOTTOM = `calc(30px + ${BOTTOM_NAV_HEIGHT}px)`;
export const OVERLAY_BOTTOM_REVIEW = `calc(30px + ${BOTTOM_NAV_HEIGHT + 8}px)`;
