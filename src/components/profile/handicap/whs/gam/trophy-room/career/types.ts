/**
 * Shared shape for the career record. One fetch pass in CareerRecordSheet,
 * passed down; panels and details never fetch population data themselves.
 */
import type { TrophyItem } from '../_shared/normalizeTrophyItem';
import type { BadgeShareRow } from '@/hooks/gam/useBadgePopulationShare';
import type { Top100DistributionRow } from '@/hooks/gam/useTop100Distribution';
import type { GamRecordConfig } from '@/hooks/gam/useGamRecordConfig';
import type { CareerRoundRow } from '@/hooks/gam/useCareerRounds';
import type { StreakRow } from '@/lib/gam/types';

export type Achievement = Extract<TrophyItem, { kind: 'achievement' }>;
export type Legend = Extract<TrophyItem, { kind: 'legend' }>;

/** Streak badges are their own section: current and best, not a ladder. */
export const STREAK_BADGE_IDS = new Set<string>([
  'round_streak_tier',
  'cutting_streak',
  'sub_80_streak',
  'birdie_round_streak',
]);

export type CareerView =
  | { kind: 'room' }
  | { kind: 'counting'; badgeId: string }
  | { kind: 'top100'; badgeId: string }
  | { kind: 'crown'; courseKey: string }
  | { kind: 'milestone'; badgeId: string };

export interface CareerData {
  ownerUserId: string;
  viewerUserId: string;
  isFriendView: boolean;
  ownerFirstName: string | null;
  achievements: Achievement[];
  legends: Legend[];
  rounds: CareerRoundRow[];
  streaks: StreakRow[];
  shares: Map<string, BadgeShareRow>;
  distribution: Top100DistributionRow[];
  /**
   * LEGACY crown-holder head count, read only by the retired CrownsPanel and
   * the crown detail's field line. It counts crown HOLDERS and includes the
   * holder, so it is NOT a field size -- do not use it for a contest decision.
   */
  fieldSizes: Map<string, number>;
  /**
   * Distinct OTHER players with a scored round at a course, holder excluded:
   * the same count and the same threshold the scorecard sheet's field row uses.
   * Undefined entries mean "not measured", never zero.
   */
  fieldPlayers?: Map<string, number>;
  /** False when the batched field read is unavailable; no split is claimed. */
  fieldPlayersAvailable?: boolean;
  config: GamRecordConfig;
  onOpen: (view: CareerView) => void;
}
