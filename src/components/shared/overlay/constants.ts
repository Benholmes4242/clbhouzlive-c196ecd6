// ============= Overlay Safe Zone Constants =============
// Single source of truth for all overlay positioning

// Base padding (from edge of container)
export const OVERLAY_PAD_X = 12; // px
export const OVERLAY_PAD_Y = 12; // px

// Gap between stacked items
export const OVERLAY_GAP = 8; // px

// Tailwind class equivalents
export const OVERLAY_PAD_X_CLASS = 'px-3'; // 12px
export const OVERLAY_PAD_Y_CLASS = 'py-3'; // 12px
export const OVERLAY_GAP_CLASS = 'gap-2'; // 8px

// Position classes (use these for consistent positioning)
export const OVERLAY_TOP_LEFT = 'absolute top-3 left-3';
export const OVERLAY_TOP_RIGHT = 'absolute top-3 right-3';
export const OVERLAY_BOTTOM_LEFT = 'absolute bottom-3 left-3';
export const OVERLAY_BOTTOM_RIGHT = 'absolute bottom-3 right-3';

// ============= Max Width Tokens =============
// Prevent layout breaks from long text

// Club/Course pill max widths
export const PILL_MAX_WIDTH = {
  tile: '70%',      // Watch grid tiles (portrait + landscape)
  hero: '55%',      // Trending Today hero
  player: '65%',    // Shorts fullscreen player
} as const;

// Ranking pill max widths (slightly smaller)
export const RANKING_MAX_WIDTH = {
  tile: '55%',
  hero: '45%',
  player: '60%',
} as const;

// Creator name max widths
export const TEXT_MAX_WIDTH = {
  portrait: '70%',   // Portrait tiles (leaves room for avatar)
  landscape: '75%',  // Landscape tiles (more room)
  hero: '60%',
  player: '70%',
} as const;

// ============= Surface Types =============
export type OverlaySurface = 'tile' | 'hero' | 'player';
export type TileVariant = 'portrait' | 'landscape';

// Helper to get max width for surface
export function getPillMaxWidth(surface: OverlaySurface): string {
  return PILL_MAX_WIDTH[surface] || PILL_MAX_WIDTH.tile;
}

export function getRankingMaxWidth(surface: OverlaySurface): string {
  return RANKING_MAX_WIDTH[surface] || RANKING_MAX_WIDTH.tile;
}

export function getTextMaxWidth(surface: OverlaySurface, variant?: TileVariant): string {
  if (surface === 'tile' && variant === 'landscape') {
    return TEXT_MAX_WIDTH.landscape;
  }
  if (surface === 'tile') {
    return TEXT_MAX_WIDTH.portrait;
  }
  return TEXT_MAX_WIDTH[surface] || TEXT_MAX_WIDTH.portrait;
}

// ============= Like Count Formatting =============
export function formatLikeCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toString();
}
