/**
 * Fullscreen open/close transition mode — single source of truth.
 *
 *   'cut'    — straight cut. Overlay mounts with the settled layout
 *              immediately (media at resting rect + fit, blur/scrim at rest,
 *              chrome present). Borrow opens reframe live pixels instantly;
 *              non-borrow opens rely on the engine's existing poster→video
 *              crossfade on firstFrame. Close is a symmetric snap-handoff.
 *              An optional short overlay opacity ease-in
 *              (`FS_CUT_FADE_MS`, tunable; 0 = truly instant) softens the
 *              switch without introducing any spatial motion.
 *
 *   'expand' — full shared-element expand/shrink (FLIP clone, borrow wrapper
 *              transition, reverse close). All the machinery is kept intact
 *              and reachable — flipping this constant restores it byte for
 *              byte, share every reveal gate + fallback path with 'cut'.
 *
 * All correctness invariants stay in both modes:
 *   - reveal gates (no flash on non-borrow poster→video swap)
 *   - resolveRestingRect geometry (media at final size + fit from frame one)
 *   - blur surrounds at rest
 *   - borrow semantics + returnBorrow tail
 *   - demote / route / target-gone fallbacks (already instant)
 */
export const FS_TRANSITION_MODE: 'cut' | 'expand' = 'cut';

/**
 * Overlay-root opacity ease-in on open in 'cut' mode. Anti-harshness only —
 * no spatial motion. Set to 0 for a truly instant switch. Also used as the
 * non-borrow close fade duration.
 */
export const FS_CUT_FADE_MS = 90;
