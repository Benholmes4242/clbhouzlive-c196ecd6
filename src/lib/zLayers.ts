/**
 * Central z-index registry for full-viewport overlays.
 *
 * Keep every overlay's stacking value here. Do NOT hardcode a magic
 * z-index in an overlay component — import a constant from this file
 * so ordering stays reviewable in one place.
 *
 * Order (higher = on top):
 *   FS_OVERLAY_Z      fullscreen feed viewer (FullscreenFeedOverlay)
 *   COMMENTS_SHEET_Z  comments sheet opened FROM the viewer — must sit above it
 *   MORE_SHEET_Z      more-options sheet opened FROM the viewer — above it
 *   REVIEW_SHEET_Z    read-review sheet opened FROM the viewer — above it
 *   MEDIA_PREVIEW_Z   read-only media viewer (MediaPreviewViewer) opened FROM a
 *                     sheet — must sit above every sheet listed here
 *
 * DIRECTION, NOT HIERARCHY: ranking follows "who opened whom". Everything the
 * feed viewer opens ranks above the feed viewer; anything a sheet opens ranks
 * above that sheet. Because the review sheet is opened BY the feed viewer and
 * itself opens MediaPreviewViewer, the sheet-vs-viewer relationship cannot be
 * inverted — the photo strip uses MEDIA_PREVIEW_Z instead.
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
/** MediaPreviewViewer's own `z-[9999]` class. Mirrored here so the ordering is
 *  reviewable in one place; change both together. */
export const MEDIA_PREVIEW_Z  = 9999;  // MediaPreviewViewer (portals to body)

/**
 * BRIEF_DISCOVER_STICKY_FILTER_BAR G1.6 — Discover's sticky filter bar.
 *
 * IN-PAGE CHROME, NOT AN OVERLAY. It is deliberately the LOWEST entry here: it
 * must sit below the fixed app chrome (ShellSlot, z 29), below every bottom
 * sheet (Z.sheetBackdrop 12002 / Z.sheet 12003), below the board's filter panel
 * and the scorecard sheet (both bottom sheets), and below the fullscreen media
 * viewer (FS_OVERLAY_Z 200, portalled to body). Its only job is to out-rank the
 * page rows it scrolls over.
 */
export const DISCOVER_STICKY_FILTER_Z = 20;
