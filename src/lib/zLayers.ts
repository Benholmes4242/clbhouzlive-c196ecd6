/**
 * Central z-index registry for full-viewport overlays.
 *
 * Keep every overlay's stacking value here. Do NOT hardcode a magic
 * z-index in an overlay component — import a constant from this file
 * so ordering stays reviewable in one place.
 *
 * Order (higher = on top):
 *   FS_OVERLAY_Z      fullscreen media viewer
 *   COMMENTS_SHEET_Z  comments sheet opened over the viewer
 *   REVIEW_SHEET_Z    read-review sheet opened over the viewer
 *
 * The +1 offsets on scrim vs panel are handled inside each overlay.
 *
 * INVARIANT — PORTAL TO BODY:
 *   Every overlay listed here MUST render through a portal to document.body.
 *   A z-index in this registry is meaningless for any overlay that renders
 *   in place, because an ancestor stacking context clamps it regardless of
 *   its value. If you add an overlay here, portal it.
 */


export const FS_OVERLAY_Z     = 200;   // FullscreenFeedOverlay root
export const COMMENTS_SHEET_Z = 210;   // CommentsSheetV2 scrim (panel = +1)
export const MORE_SHEET_Z     = 230;   // MoreOptions sheet scrim (panel = +1)
export const REVIEW_SHEET_Z   = 240;   // ReviewBottomSheet scrim (panel = +1)
