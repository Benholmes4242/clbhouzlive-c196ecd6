/**
 * Single source of truth for course milestone thresholds.
 * All milestone logic must import from this file.
 */
export const COURSE_MILESTONES = [
  1, 10, 25, 50, 100, 150, 200, 250, 300, 400, 500
] as const;

export type CourseMilestone = (typeof COURSE_MILESTONES)[number];

/**
 * Get the next milestone for a given courses played count
 */
export const getNextMilestone = (coursesPlayed: number): number | null => {
  return COURSE_MILESTONES.find(m => m > coursesPlayed) ?? null;
};

/**
 * Get all unlocked milestones for a given courses played count
 */
export const getUnlockedMilestones = (coursesPlayed: number): number[] => {
  return COURSE_MILESTONES.filter(m => m <= coursesPlayed);
};

/**
 * Get milestone display name
 */
export const getMilestoneName = (milestone: number): string => {
  if (milestone === 1) return 'First Course';
  return `${milestone} Club`;
};
