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
// SCORE (verdict — under/over par; theme-aware)
// ============================================================================
export const SCORE_UNDER_PAR_LIGHT = '#059669';
export const SCORE_UNDER_PAR_LIGHT_TINT = 'rgba(5,150,105,0.14)';
export const SCORE_OVER_PAR_LIGHT = '#9F1D1D';
export const SCORE_OVER_PAR_LIGHT_TINT = 'rgba(159,29,29,0.14)';
export const SCORE_UNDER_PAR_DARK = '#4ADE80';
export const SCORE_OVER_PAR_DARK = '#F87171';

// ============================================================================
// STATUS (live indicator dot — NOT a verdict)
// ============================================================================
export const STATUS_LIVE = '#10B981';

// ============================================================================
// TREND (ranking movement chips — risers / fallers; distinct from SCORE_*)
// ============================================================================
export const TREND_UP = '#16A34A';
export const TREND_UP_TINT = 'rgba(22,163,74,0.10)';
export const TREND_DOWN = '#DC2626';
export const TREND_DOWN_TINT = 'rgba(220,38,38,0.10)';

// ============================================================================
// NAVY (dark theatrical accents)
// ============================================================================
export const NAVY_HIGH = '#15203A';

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const FONT =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
