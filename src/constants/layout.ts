/**
 * Shared layout constants for Clubhouse overlay positioning.
 * All overlay elements (action rail, creator capsule, skeleton) reference these
 * so bottom nav height changes propagate from a single source.
 */
export const BOTTOM_NAV_HEIGHT = 88;

/** Gap between overlay elements and nav top (breathing room) */
export const OVERLAY_GAP = 12;

/** Total bottom offset for overlays: gap + nav height */
export const OVERLAY_BOTTOM = `calc(${OVERLAY_GAP}px + var(--bottom-nav-height, ${BOTTOM_NAV_HEIGHT}px))`;
export const OVERLAY_BOTTOM_REVIEW = `calc(${OVERLAY_GAP + 8}px + var(--bottom-nav-height, ${BOTTOM_NAV_HEIGHT}px))`;
