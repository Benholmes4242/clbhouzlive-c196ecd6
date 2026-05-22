import type { UserBadge, BadgeRarity, LegendCategory } from '@/lib/gam/types';
import type { TopLegendRow } from '@/hooks/gam/useUserTopLegends';
import { legendCategoryLabel, formatLegendValue } from '@/lib/gam/visuals';

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
      earned: boolean;
      earnedAt: string | null;
      currentValue: number | null;
      nextThreshold: number | null;
      counterMetric: string | null;
      tiers: TrophyTier[];
      /** Tier index reached so far (0 if none). */
      reachedTier: number;
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
      return 'feather';
    case 'most_rounds_90d':
      return 'map-pin';
    case 'lowest_gross':
      return 'trophy';
    case 'best_score_diff':
      return 'trending-down';
    case 'best_stableford_90d':
      return 'target';
  }
}

function normalizeTiersArray(raw: unknown): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  return [];
}

export function normalizeBadge(b: UserBadge): TrophyItem {
  const thresholds = normalizeTiersArray(b.counter_tiers);
  const reached = Math.max(0, b.counter_tier ?? 0);
  const earned = Boolean(b.is_earned);
  const value = b.counter_value ?? 0;
  const nextThreshold =
    thresholds.length > 0 && reached < thresholds.length ? thresholds[reached] : null;

  const tiers: TrophyTier[] = thresholds.length > 0
    ? thresholds.map((t, idx) => ({
        tier: idx + 1,
        threshold: t,
        name: `${b.title} ${romanize(idx + 1)}`,
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
    earned,
    earnedAt: b.earned_at,
    currentValue: b.counter_value,
    nextThreshold,
    counterMetric: b.counter_metric,
    tiers,
    reachedTier: reached,
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

function romanize(n: number): string {
  const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII' };
  return map[n] ?? String(n);
}
