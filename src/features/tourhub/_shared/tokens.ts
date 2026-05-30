/**
 * Tour Hub design tokens — single source of truth.
 *
 * All Tour Hub Overview / Schedule / Players / Leaders / College sections
 * import their colour, ink, hairline, and font tokens from here. The same
 * token names + values were previously redeclared across 5+ section files
 * with three silent collisions (SLATE_200, HAIRLINE, AMBER_SOFT meaning
 * different things in different files). This file resolves those collisions
 * and gives Phase 2B+ a single place to evolve the system.
 *
 * Naming convention:
 * - INK_*       → text colour on light surfaces (primary / secondary / mute / faint / light)
 * - SLATE_*     → background-adjacent neutrals on light surfaces (50/150/200/etc., Tailwind-scale)
 * - HAIRLINE_*  → divider colours / borders (solid or ink-alpha variants)
 * - AMBER_*     → brand amber (text, tints, borders, soft bgs)
 * - GOLD_*      → celebratory / winner / trophy moments (more saturated than amber)
 * - SCORE_*_DARK / SCORE_*_LIGHT → verdict colours for score displays, theme-aware
 * - STATUS_*    → status indicators (live pulse, etc.)
 * - NAVY_*      → dark theatrical gradients (event card tour-stripe ends)
 * - FONT        → canonical font stack (was 5 different stacks before)
 */

// ============================================================================
// INK (text on light surface)
// ============================================================================
export const INK = '#0F172A';
export const INK_SOFT = '#475569';
export const INK_MUTE = '#64748B';
export const INK_FAINT = '#94A3B8';
export const INK_LIGHT = '#CBD5E1';

// ============================================================================
// SURFACE (background fills for cards on light theme)
// ============================================================================
export const SURFACE = '#FFFFFF';

// ============================================================================
// SLATE (neutrals on light surface)
// ============================================================================
export const SLATE_50 = '#F8FAFC';
export const SLATE_150 = '#EDF1F5';
export const SLATE_200 = '#E2E8F0';

// ============================================================================
// HAIRLINE (divider variants)
// ============================================================================
export const HAIRLINE_INK_7 = 'rgba(15,23,42,0.07)';
export const HAIRLINE_INK_10 = 'rgba(15,23,42,0.10)';
export const HAIRLINE_INK_15 = 'rgba(15,23,42,0.15)';        // section divider on light bg with stronger emphasis

// ============================================================================
// INK_ALPHA (text/scrim overlays on light bg where alpha-based muting is needed)
// ============================================================================
// Used primarily by hero PhotoBand for legibility scrims and ink-alpha caption text.
// Distinct from INK_* which are solid Tailwind slate values.
export const INK_ALPHA_45 = 'rgba(15,23,42,0.45)';           // medium ink-alpha (caption / secondary on light)
export const INK_ALPHA_60 = 'rgba(15,23,42,0.60)';           // heavier ink-alpha (subhead-equivalent on light)

// ============================================================================
// AMBER (brand)
// ============================================================================
export const AMBER = '#F7931E';
export const AMBER_INK = '#D97706';
export const AMBER_TINT_8 = 'rgba(247,147,30,0.08)';
export const AMBER_TINT_10 = 'rgba(247,147,30,0.10)';
export const AMBER_TINT_16 = 'rgba(247,147,30,0.16)';
export const AMBER_BORDER = 'rgba(247,147,30,0.30)';
export const AMBER_SOFT_BG = '#FEF3E7';

// ============================================================================
// GOLD (celebratory / winner / trophy theatre)
// ============================================================================
export const GOLD = '#FFB800';
export const GOLD_DEEP = '#D97706';
export const GOLD_TINT = 'rgba(255,184,0,0.04)';
export const GOLD_BORDER = 'rgba(255,184,0,0.32)';
export const GOLD_GLOW = '0 0 24px rgba(255,184,0,0.10), 0 1px 3px rgba(0,0,0,0.04)';

// ============================================================================
// LEADER_GOLD (hero leaderboard #1 row tint — distinct from celebratory GOLD)
// ============================================================================
// More yellow-toned than canonical GOLD (#FFB800). Used specifically for the #1
// leader row tinting in HybridHero — gold-on-dark visual lift without competing
// with finished-event GOLD trophy moments. Reserved for leaderboard row tinting;
// not a general-purpose gold.
export const LEADER_GOLD = '#FBBC2E';                        // hero leader-row tint base
export const LEADER_GOLD_DARK = '#D4A017';                   // text/icon-readable variant
export const LEADER_GOLD_TINT_7 = 'rgba(251,188,46,0.07)';   // soft leader tint (live state)
export const LEADER_GOLD_TINT_10 = 'rgba(251,188,46,0.10)';  // medium leader tint (results state)

// ============================================================================
// SCORE (verdict — under/over par; theme-aware)
// ============================================================================
export const SCORE_UNDER_PAR_LIGHT = '#059669';
export const SCORE_UNDER_PAR_LIGHT_TINT = 'rgba(5,150,105,0.14)';
export const SCORE_OVER_PAR_LIGHT = '#9F1D1D';
export const SCORE_OVER_PAR_LIGHT_TINT = 'rgba(159,29,29,0.14)';
export const SCORE_UNDER_PAR_DARK = '#4ADE80';
export const SCORE_OVER_PAR_DARK = '#F87171';
// Pale variants for use on heavier-dark backgrounds (e.g. ticker marquee) where
// the standard DARK variants don't lift enough. Tailwind green-300 / red-300.
export const SCORE_UNDER_PAR_DARK_PALE = '#86EFAC';          // Tailwind green-300 — pale under-par on heavy-dark bg
export const SCORE_OVER_PAR_DARK_PALE = '#FCA5A5';           // Tailwind red-300 — pale over-par on heavy-dark bg

// ============================================================================
// STATUS (live indicator dot — NOT a verdict)
// ============================================================================
export const STATUS_LIVE = '#10B981';

// ============================================================================
// TOUR_BRAND (tour-specific brand colours)
// ============================================================================
export const PGA_GREEN = '#006747';

// ============================================================================
// TREND (ranking movement chips — risers / fallers; distinct from SCORE_*)
// ============================================================================
export const TREND_UP = '#16A34A';
export const TREND_UP_TINT = 'rgba(22,163,74,0.10)';
export const TREND_DOWN = '#DC2626';
export const TREND_DOWN_TINT = 'rgba(220,38,38,0.10)';

// ============================================================================
// SEMANTIC ALIASES
// ============================================================================
export const DANGER = '#DC2626';

// ============================================================================
// NAVY (dark theatrical accents)
// ============================================================================
export const NAVY_HIGH = '#15203A';

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const FONT =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
