/**
 * fsv2 chrome tokens — literals, not a re-export. No shared token file
 * exists for fullscreen-viewer chrome (see audit item 16). Kept local so
 * V2 has zero implicit coupling to V1 or shared design surfaces.
 */

export const FSV2 = {
  BACKDROP: '#000000',
  INK: '#FFFFFF',
  INK_MUTE: 'rgba(255,255,255,0.72)',
  INK_SUB: 'rgba(255,255,255,0.55)',
  GLASS_BG: 'rgba(0,0,0,0.45)',
  GLASS_BLUR: 'blur(8px)',
  IMAGE_BLUR_BG_FILTER: 'blur(40px) brightness(0.5)',
  SCRIM_ALPHA: 0.55,
  OPEN_FADE_MS: 180,
  CLOSE_FADE_MS: 180,
  VIDEO_CROSSFADE_MS: 120,
  OPEN_BUDGET_MS_VIDEO_COLD: 500,
  OPEN_BUDGET_MS_IMAGE: 200,
  CLOSE_BUDGET_MS: 250,
  SWIPE_BUDGET_MS: 450,
  WATCHDOG_VIDEO_FIRST_FRAME_MS: 3000,
  WATCHDOG_IMAGE_DECODE_MS: 2000,
  WATCHDOG_INITIAL_SCROLL_MS: 800,
  FONT_FAMILY:
    'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;
