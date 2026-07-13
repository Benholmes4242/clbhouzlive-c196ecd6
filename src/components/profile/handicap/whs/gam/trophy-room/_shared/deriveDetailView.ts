/**
 * deriveDetailView
 *
 * Single derivation for the three immersive overlays
 * (AchievementImmersive, Top100Immersive, LegendImmersive).
 *
 * Consolidation only -- rules lifted verbatim from the current
 * post-FIX-10 overlay implementations. Where the achievement
 * overlays disagreed, AchievementImmersive was canonical.
 * Rendering/JSX in the overlays remains unchanged; they consume
 * fields from the returned DetailView and delete their local
 * copies of this logic.
 */

import { format } from 'date-fns';
import { paletteFor } from '../parts/DetailHero';
import { materialNameForTier, type RarityPalette } from './rarityPalette';
import { GAM } from '../../tokens';
import type { LegendCategory } from '@/lib/gam/types';
import type { TrophyItem } from './normalizeTrophyItem';

export interface DetailViewAchievement {
  kind: 'achievement';
  isTiered: boolean;
  /** Live-derived earned flag. For tiered badges: reachedTier > 0.
   *  For binary badges: raw item.earned. Mirrors TrophyCardHybrid (FIX-8)
   *  so a stale row (reachedTier 0, count 0) behaves like an unearned badge. */
  earnedDerived: boolean;
  palette: RarityPalette;
  materialColor: string;
  /** null when tier 0 (no material naming at zero tier -- FIX-9/FIX-10). */
  materialName: string | null;
  /** Tiered: "N of M medals earned" (+" . material" when reachedTier > 0).
   *  Binary earned: "Earned MMM d, yyyy".
   *  Binary locked: null -- caller supplies its own hint fallback. */
  summaryLine: string | null;
  nextThreshold: number | null;
  remaining: number | null;
  progressPct: number;
  /** Localised currentValue string. Tiered only; null for binary. */
  counterText: string | null;
  /** "{x} more until your next medal" -- tiered, incomplete only. */
  progressLabel: string | null;
}

export interface DetailViewLegend {
  kind: 'legend';
  palette: RarityPalette;
  materialColor: string;
  label: string;
  formattedValue: string;
  /** "#{rank} at {courseName}" */
  rankLine: string;
  /** "" when attainedAt is invalid. */
  heldSince: string;
}

export type DetailView = DetailViewAchievement | DetailViewLegend;

const LEGEND_CATEGORY_LABEL: Record<LegendCategory, string> = {
  lowest_gross_90d: 'Lowest gross (90d)',
  lowest_gross_all_time: 'Lowest gross',
  best_score_diff_90d: 'Best differential (90d)',
  best_score_diff_all_time: 'Best differential',
  most_birdies_90d: 'Most birdies (90d)',
  most_birdies_all_time: 'Most birdies',
  best_stableford_90d: 'Best Stableford (90d)',
  best_stableford_all_time: 'Best Stableford',
  most_eagles_90d: 'Most eagles (90d)',
  most_eagles_all_time: 'Most eagles',
  most_aces_90d: 'Most hole-in-ones (90d)',
  most_aces_all_time: 'Most hole-in-ones',
  most_albatrosses_90d: 'Most albatrosses (90d)',
  most_albatrosses_all_time: 'Most albatrosses',
  most_rounds_90d: 'Most rounds (90d)',
  most_rounds_all_time: 'Most rounds',
};

/** Amber legendary palette shim -- LegendImmersive uses GAM.AMBER as color. */
const LEGEND_PALETTE_SHIM: RarityPalette = {
  color: GAM.AMBER,
  tint: 'rgba(247,147,30,0.14)',
  border: 'rgba(247,147,30,0.30)',
  label: 'LEGENDARY',
  heroGradient: '',
  cardSweep: '',
  topStripe: null,
  outerGlow: null,
  metaColor: GAM.AMBER,
};

export function deriveDetailView(item: TrophyItem): DetailView {
  if (item.kind === 'legend') {
    const label = LEGEND_CATEGORY_LABEL[item.category] ?? item.name;
    let heldSince = '';
    try {
      heldSince = format(new Date(item.attainedAt), 'MMM d, yyyy');
    } catch {
      heldSince = '';
    }
    return {
      kind: 'legend',
      palette: LEGEND_PALETTE_SHIM,
      materialColor: GAM.AMBER,
      label,
      formattedValue: item.formattedValue,
      rankLine: `#${item.rank} at ${item.courseName}`,
      heldSince,
    };
  }

  const palette = paletteFor(item);
  const materialColor = palette.color;

  const isTiered = item.tiers.length > 1;
  const earnedTiers = item.tiers.filter((t) => t.earned).length;
  const totalTiers = item.tiers.length;
  const earnedDerived = isTiered ? item.reachedTier > 0 : item.earned;
  const materialName =
    isTiered && item.reachedTier > 0 ? materialNameForTier(item.reachedTier) : null;

  const currentValue = item.currentValue ?? 0;
  const next = item.nextThreshold;
  const remaining = next != null ? Math.max(0, next - currentValue) : null;
  const progressPct =
    next != null ? Math.min(100, Math.round((currentValue / Math.max(1, next)) * 100)) : 0;

  const summaryLine: string | null = (() => {
    if (isTiered) {
      const base = `${earnedTiers} of ${totalTiers} medals earned`;
      return materialName ? `${base} · ${materialName}` : base;
    }
    if (item.earned && item.earnedAt) {
      return `Earned ${format(new Date(item.earnedAt), 'MMM d, yyyy')}`;
    }
    return null;
  })();

  const counterText = isTiered ? currentValue.toLocaleString() : null;
  const progressLabel =
    isTiered && remaining != null && remaining > 0
      ? `${remaining.toLocaleString()} more until your next medal`
      : null;

  return {
    kind: 'achievement',
    isTiered,
    earnedDerived,
    palette,
    materialColor,
    materialName,
    summaryLine,
    nextThreshold: next,
    remaining,
    progressPct,
    counterText,
    progressLabel,
  };
}
