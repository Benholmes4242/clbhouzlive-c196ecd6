import { normalizeBadge } from '../_shared/normalizeTrophyItem';
import { isTop100Achievement } from '../_shared/showpieces';
import { STREAK_BADGE_IDS, type Achievement } from './types';
import type { UserBadge } from '@/lib/gam/types';

/** The milestone partition — the one definition. The trophy room's
 *  MilestonesPanel and the handicap page's door both read it. */
export function isMilestoneAchievement(a: Achievement): boolean {
  return (
    !isTop100Achievement(a.badgeId) &&
    !STREAK_BADGE_IDS.has(a.badgeId) &&
    a.category !== 'community' &&
    a.counterMetric === null &&
    a.tiers.length <= 1
  );
}

/** Milestones reached — MilestonesPanel's "n OF m REACHED" n. */
export function milestonesReachedFrom(badges: UserBadge[]): number {
  return badges
    .map(normalizeBadge)
    .filter((i): i is Achievement => i.kind === 'achievement')
    .filter(isMilestoneAchievement)
    .filter((a) => a.earned).length;
}
