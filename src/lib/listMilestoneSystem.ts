// ═══════════════════════════════════════════════════════════════════════════════════════════
// UNIFIED MILESTONE SYSTEM FOR TOP 100 LISTS
// Single source of truth for all list milestone logic
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Standardized milestone thresholds for ALL Top 100 lists.
 * Same for Worldwide, GB&I, USA, Europe - no exceptions.
 */
export const LIST_MILESTONE_THRESHOLDS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export type ListMilestoneThreshold = typeof LIST_MILESTONE_THRESHOLDS[number];

export type MilestoneState = 'unlocked' | 'next_up' | 'locked';

export interface ListMilestoneInfo {
  threshold: number;
  state: MilestoneState;
  label: string;
  toGo?: number;
}

export interface ListProgressState {
  playedCount: number;
  lastCompletedMilestone: number | null;
  nextMilestone: number | null;
  toGo: number;
  isComplete: boolean;
  statusCopy: string;
}

/**
 * Get the status copy based on played count
 * Locked copy mapping from spec
 */
function getStatusCopy(playedCount: number): string {
  if (playedCount >= 100) return 'Completed';
  if (playedCount >= 80) return 'Completion in sight';
  if (playedCount >= 60) return 'Elite territory';
  if (playedCount >= 40) return 'Halfway charge';
  if (playedCount >= 20) return 'In your stride';
  if (playedCount >= 5) return 'Momentum building';
  return 'Journey begins';
}

/**
 * Calculate milestone state from played count.
 * Single function used by ALL UI elements showing milestones.
 */
export function getListMilestoneState(playedCount: number): ListProgressState {
  // Find highest milestone at or below playedCount
  let lastCompletedMilestone: number | null = null;
  let nextMilestone: number | null = null;

  for (const threshold of LIST_MILESTONE_THRESHOLDS) {
    if (playedCount >= threshold) {
      lastCompletedMilestone = threshold;
    } else if (nextMilestone === null) {
      nextMilestone = threshold;
    }
  }

  const isComplete = playedCount >= 100;
  const toGo = nextMilestone ? nextMilestone - playedCount : 0;

  return {
    playedCount,
    lastCompletedMilestone,
    nextMilestone: isComplete ? null : nextMilestone,
    toGo,
    isComplete,
    statusCopy: getStatusCopy(playedCount),
  };
}

/**
 * Get all milestones with their states for the milestone rail.
 * Returns the full list of 11 milestones - rail shows all and scrolls horizontally.
 */
export function getAllMilestonesWithState(playedCount: number): ListMilestoneInfo[] {
  const { nextMilestone, toGo } = getListMilestoneState(playedCount);

  return LIST_MILESTONE_THRESHOLDS.map((threshold) => {
    let state: MilestoneState;
    let label: string;
    let coursesToGo: number | undefined;

    if (playedCount >= threshold) {
      state = 'unlocked';
      label = `${threshold} Complete`;
    } else if (threshold === nextMilestone) {
      state = 'next_up';
      label = `${toGo} to go`;
      coursesToGo = toGo;
    } else {
      state = 'locked';
      label = ''; // Clean - no "Locked" text
    }

    return {
      threshold,
      state,
      label,
      toGo: coursesToGo,
    };
  });
}
