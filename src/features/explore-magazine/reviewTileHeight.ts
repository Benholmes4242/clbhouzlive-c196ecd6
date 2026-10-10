/* ARCHITECTURE RULE (moved from AGENTS.md): Full-width review cards retain the standard photo-overlay preset and share kind-owned height constants with their loading shells, so height adjustments cannot change composition or drift from placeholders. */
/**
 * The height of a full-width review tile in the Explore feed. FIXED, not a
 * minimum — every review renders at exactly this height so no two reviews in
 * one feed differ.
 *
 * 340 against a round's 210. A round never renders text on its photo, so a
 * round never takes the 'lead' size and its photo band is always PHOTO_H.std
 * = 210. 340 is 1.62x that, which is the separation Ben signed off: the review
 * is unmistakably the bigger object in the feed.
 *
 * Previously REVIEW_TILE_MIN_HEIGHT, applied as minHeight, which let the
 * review's own quote push the tile to any height it liked.
 */
export const REVIEW_CARD_HEIGHT = 340;
