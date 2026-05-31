/**
 * Courses feature design tokens.
 *
 * Naming mirrors src/features/tourhub/_shared/tokens.ts — values are
 * byte-identical to the tourhub equivalents. This duplication follows
 * the established codebase convention (5 separate feature-scoped
 * tokens.ts files exist, each feature-private). A future architectural
 * refactor could promote tokens to a truly shared location.
 *
 * Add new tokens here as Courses-feature polish briefs touch new
 * surfaces. Keep the export list curated — only tokens actually used
 * in this feature.
 */

/* ── Ink scale (text + foreground) ──────────────────────────────────── */
export const INK = '#0F172A';                               // canonical foreground
export const INK_MUTE = '#64748B';                          // muted/supporting text (slate-500)

/* ── Surfaces ───────────────────────────────────────────────────────── */
export const SURFACE = '#FFFFFF';                           // canonical white surface
export const SHELL_BG = '#0A0E14';                          // dark shell band (matches global header)
export const SLATE_50 = '#F8FAFC';                          // page body bg (light)

/* ── Brand amber ────────────────────────────────────────────────────── */
export const AMBER = '#F7931E';                             // brand amber accent

/* ── Hairlines / fills on light bg ──────────────────────────────────── */
export const HAIRLINE_INK_7 = 'rgba(15,23,42,0.07)';        // faint divider
export const HAIRLINE_INK_10 = 'rgba(15,23,42,0.10)';       // input/dropdown border
export const HAIRLINE_INK_12 = 'rgba(15,23,42,0.12)';       // drag-handle / strong hairline
export const INK_TINT_05 = 'rgba(15,23,42,0.05)';           // ultra-faint surface (sheet close button bg)

/* ── White-alpha (on dark shell) ────────────────────────────────────── */
export const WHITE_ALPHA_06 = 'rgba(255,255,255,0.06)';     // tab strip bottom hairline
export const WHITE_ALPHA_55 = 'rgba(255,255,255,0.55)';     // inactive tab text on dark shell
