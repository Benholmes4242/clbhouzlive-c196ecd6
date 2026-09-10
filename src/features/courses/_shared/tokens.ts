/**
 * Courses feature DARK design tokens.
 *
 * The export names (INK, HAIRLINE_INK_*, INK_TINT_*, SLATE_50) are historical
 * light-ramp names deliberately retained to avoid a separate 27-importer
 * rename. Their values now encode the shipped dark analytical ramp.
 *
 * Add new tokens here as Courses-feature polish briefs touch new
 * surfaces. Keep the export list curated — only tokens actually used
 * in this feature.
 */

/* ── Ink scale (text + foreground) ──────────────────────────────────── */
export const INK = '#F8FAFC';                               // canonical foreground
export const INK_MUTE = 'rgba(248,250,252,0.62)';           // muted/supporting text
export const INK_FAINT = 'rgba(248,250,252,0.42)';          // fainter supporting text — inactive pill text, captions
export const INK_LIGHT = 'rgba(248,250,252,0.28)';          // faintest ink — breadcrumb separators, chevron link affordances

/* ── Slate scale ────────────────────────────────────────────────────── */
export const SLATE_600 = 'rgba(248,250,252,0.72)';          // sub-body text, progress sub-line
export const INK_ALPHA_60 = 'rgba(248,250,252,0.62)';       // supporting text — RecCard location subline

/* ── Surfaces ───────────────────────────────────────────────────────── */
export const SURFACE = '#1B1E27';                           // canonical panel surface
export const SHELL_BG = '#0A0E14';                          // dark shell band (matches global header)
/*
 * BRIEF_SHEET_BACKGROUND_CANON_02 §2 — COLLAPSED. This module's `SLATE_50`
 * meant "page canvas", which is exactly what `A.CANVAS` in
 * features/courses/components/holes/analytical/tokens.tsx means. One idea
 * under two names is how four sheet shades became possible, so the nine
 * consumers now read A.CANVAS and this name is gone. NOT collapsed: tourhub's
 * own SLATE_50 (a ramp step), CHARCOAL (a named product surface) and V4.bg
 * each carry a recorded non-merge reason.
 */

/* ── Brand amber ────────────────────────────────────────────────────── */
export const AMBER = '#F7931E';                             // brand amber accent

/* ── Hairlines / fills on light bg ──────────────────────────────────── */
export const HAIRLINE_INK_7 = 'rgba(255,255,255,0.08)';      // faint divider
export const HAIRLINE_INK_8 = 'rgba(255,255,255,0.10)';      // hairline — pill borders, table dividers
// Hairline only: button borders, card borders, dropdown MENU containers, row
// dividers. NOT a field border — fields take the canon (@/lib/tokens/field).
// The old "input/dropdown border" note was a fossil from before the field sweep.
export const HAIRLINE_INK_10 = 'rgba(255,255,255,0.14)';
export const HAIRLINE_INK_12 = 'rgba(255,255,255,0.18)';     // drag-handle / strong hairline
export const INK_TINT_02 = 'rgba(255,255,255,0.03)';         // ultra-faint tint — search input bg, guide-card bg
export const INK_TINT_04 = 'rgba(255,255,255,0.05)';         // very-faint tint — tile placeholder bg, fallback surfaces
export const INK_TINT_05 = 'rgba(255,255,255,0.06)';         // ultra-faint surface (sheet close button bg)
export const INK_TINT_06 = 'rgba(255,255,255,0.08)';         // loading skeleton bg, faint surfaces

/* ── White-alpha (on dark shell) ────────────────────────────────────── */
export const WHITE_ALPHA_06 = 'rgba(255,255,255,0.06)';     // tab strip bottom hairline
export const WHITE_ALPHA_55 = 'rgba(255,255,255,0.55)';     // inactive tab text on dark shell
