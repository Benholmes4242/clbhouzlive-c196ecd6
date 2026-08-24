/**
 * SEARCH-V2 SURFACE TOKENS (BRIEF_SEARCH_OVERLAY_DARK).
 *
 * There is NO new palette here. Every value is re-exported from the canonical
 * analytical `A` ramp; this module exists only so the twelve files of the
 * overlay name ONE row panel, ONE hairline and ONE press state instead of each
 * declaring its own. Adding a colour literal to this file is a defect: put it
 * in `A` or don't use it.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';

export { A };

export const S = {
  /** The overlay ground — the app canvas, also fed to the NATIVE status bar. */
  GROUND: A.CANVAS,
  /** Native status bar: LIGHT icons over the dark ground. */
  STATUS_BAR_STYLE: 'light' as const,
  /** Median expects RRGGBB prefixed with the alpha byte. */
  STATUS_BAR_COLOR: 'FF15171F',

  /** FACTS — names, captions, figures. */
  INK: A.INK,
  /** CHROME — region lines, reason lines, timestamps. Never below 0.62. */
  QUIET: A.MUTE,
  /** Lowest permitted tier: placeholders and disabled glyphs only. */
  FAINT: A.DIM,

  /** The one row/tile fill inside the overlay. */
  TILE: 'rgba(248,250,252,0.06)',
  /** The one hairline: section under-rule and row separators. */
  HAIRLINE: A.HAIRLINE,
  /** Avatar ring for every row that shows a person. */
  RING: DARK_HAIRLINE,
} as const;

/** The one row press treatment for all eight row types. */
export const ROW_PRESS = 'active:bg-white/[0.04]';

/** The one row geometry for all eight row types. */
export const ROW_BASE =
  `w-full flex items-center gap-3 px-4 min-h-[60px] text-left ${ROW_PRESS}`;
