import type { UserBadge, BadgeRarity, BadgeCategory, LegendCategory } from '@/lib/gam/types';
import type { TopLegendRow } from '@/hooks/gam/useUserTopLegends';
import { legendCategoryLabel, formatLegendValue } from '@/lib/gam/visuals';
import { MATERIAL_PALETTES } from './rarityPalette';

export interface TrophyTier {
  tier: number;
  threshold: number;
  name: string;
  earned: boolean;
  earnedAt: string | null;
}

export type TrophyItem =
  | {
      kind: 'achievement';
      id: string;
      badgeId: string;
      name: string;
      description: string;
      iconKey: string;
      rarity: BadgeRarity;
      category: BadgeCategory;
      earned: boolean;
      earnedAt: string | null;
      currentValue: number | null;
      nextThreshold: number | null;
      counterMetric: string | null;
      tiers: TrophyTier[];
      /** Tier index reached so far (0 if none). */
      reachedTier: number;
      /** Earned but the owner has not opened the trophy room since. Drives
       *  the one-shot sheen on the card. False for locked/seen badges. */
      isNew: boolean;
    }
  | {
      kind: 'legend';
      id: string;
      name: string;
      category: LegendCategory;
      rank: number;
      value: number;
      formattedValue: string;
      courseId: string;
      courseName: string;
      attainedAt: string;
      iconKey: string;
    };

function categoryToIconKey(c: LegendCategory): string {
  switch (c) {
    case 'most_birdies_90d':
    case 'most_birdies_all_time':
      return 'bird';
    case 'lowest_gross_90d':
    case 'lowest_gross_all_time':
      return 'trophy';
    case 'best_score_diff_90d':
    case 'best_score_diff_all_time':
      return 'trending-down';
    case 'best_stableford_90d':
    case 'best_stableford_all_time':
      return 'target';
    case 'most_eagles_90d':
    case 'most_eagles_all_time':
      return 'feather';
    case 'most_aces_90d':
    case 'most_aces_all_time':
      return 'target';
    case 'most_rounds_90d':
    case 'most_rounds_all_time':
      return 'flag';
  }
}

function normalizeTiersArray(raw: unknown): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  return [];
}

function materialName(t: number) {
  const l = MATERIAL_PALETTES[Math.min(5, Math.max(1, t)) as 1 | 2 | 3 | 4 | 5].label;
  return l.charAt(0) + l.slice(1).toLowerCase();
}

export function normalizeBadge(b: UserBadge): TrophyItem {
  const thresholds = normalizeTiersArray(b.counter_tiers);
  const earned = Boolean(b.is_earned);
  const value = b.counter_value ?? 0;
  // Single source of truth: DERIVE the reached tier from the live count against
  // the current thresholds. A stored `counter_tier` computed under old thresholds
  // would otherwise ghost-forward (e.g. GB&I=14 under [1,5,10,25,50] → tier 3;
  // under [10,25,50,75,100] → tier 1).
  const reached = thresholds.length > 0
    ? thresholds.reduce((acc, t) => (value >= t ? acc + 1 : acc), 0)
    : (b.counter_tier ?? (earned ? 1 : 0));
  const nextThreshold =
    thresholds.length > 0 && reached < thresholds.length ? thresholds[reached] : null;

  const tiers: TrophyTier[] = thresholds.length > 0
    ? thresholds.map((t, idx) => ({
        tier: idx + 1,
        threshold: t,
        name: materialName(idx + 1),
        earned: idx < reached,
        earnedAt: idx < reached && idx === reached - 1 ? b.earned_at : null,
      }))
    : [
        {
          tier: 1,
          threshold: 1,
          name: b.title,
          earned,
          earnedAt: b.earned_at,
        },
      ];

  return {
    kind: 'achievement',
    id: `badge:${b.badge_id}`,
    badgeId: b.badge_id,
    name: b.title,
    description: b.description,
    iconKey: b.icon_name,
    rarity: b.rarity,
    category: b.category,
    earned,
    earnedAt: b.earned_at,
    currentValue: b.counter_value,
    nextThreshold,
    counterMetric: b.counter_metric,
    tiers,
    reachedTier: reached,
    isNew: earned && b.seen_by_user === false,
  };
}

export function normalizeLegend(l: TopLegendRow): TrophyItem {
  return {
    kind: 'legend',
    id: `legend:${l.id}`,
    name: legendCategoryLabel[l.category],
    category: l.category,
    rank: l.rank,
    value: l.value,
    formattedValue: formatLegendValue(l.category, l.value),
    courseId: l.course_id,
    courseName: l.course_name,
    attainedAt: l.attained_at,
    iconKey: categoryToIconKey(l.category),
  };
}

