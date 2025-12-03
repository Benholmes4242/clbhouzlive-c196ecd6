// src/config/top100Milestones.ts
// Re-export milestone data from the unified top100Club system

import { CLUB_STEPS, type Top100ClubMeta, type Top100TierId } from '@/lib/top100Club';

export type Top100Milestone = {
  id: Top100TierId;
  threshold: number;
  label: string;
  ringColor: string;
};

// Transform CLUB_STEPS into milestone format
export const TOP100_MILESTONES: Top100Milestone[] = CLUB_STEPS.map((step) => ({
  id: step.tierId,
  threshold: step.threshold,
  label: step.tierName,
  ringColor: step.ringColor,
}));

// Re-export for convenience
export { CLUB_STEPS, type Top100ClubMeta, type Top100TierId };
