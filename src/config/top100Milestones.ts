// src/config/top100Milestones.ts
// Re-export milestone data from the unified top100Club system
// Colors now sourced from globalAchievementMilestoneSystem.ts

import { CLUB_STEPS, type Top100ClubMeta, type Top100TierId } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

export type Top100Milestone = {
  id: Top100TierId;
  threshold: number;
  label: string;
  ringColor: string;
};

// Transform CLUB_STEPS into milestone format, getting colors from global system
export const TOP100_MILESTONES: Top100Milestone[] = CLUB_STEPS.map((step) => ({
  id: step.tierId,
  threshold: step.threshold,
  label: step.tierName,
  ringColor: getRingColorForThreshold(step.threshold),
}));

// Re-export for convenience
export { CLUB_STEPS, type Top100ClubMeta, type Top100TierId };
