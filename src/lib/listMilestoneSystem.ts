import React from 'react';

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
 * Get all milestones with their states for the milestone rail
 */
export function getAllMilestonesWithState(playedCount: number): ListMilestoneInfo[] {
  const { lastCompletedMilestone, nextMilestone, toGo } = getListMilestoneState(playedCount);

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
      label = 'Locked';
    }

    return {
      threshold,
      state,
      label,
      toGo: coursesToGo,
    };
  });
}

/**
 * Get a "smart window" of milestones to display in the rail.
 * Shows: last completed, next up, and next 2 future milestones.
 * Falls back to first 4 if no progress yet.
 */
export function getVisibleMilestones(playedCount: number): ListMilestoneInfo[] {
  const allMilestones = getAllMilestonesWithState(playedCount);
  
  // For completed users, show last 4 milestones
  if (playedCount >= 100) {
    return allMilestones.slice(-4);
  }

  const nextUpIndex = allMilestones.findIndex((m) => m.state === 'next_up');
  
  // If no progress, show first 4
  if (nextUpIndex === -1) {
    return allMilestones.slice(0, 4);
  }

  // Show: 1 before next up (if exists), next up, and 2 after
  const startIndex = Math.max(0, nextUpIndex - 1);
  const endIndex = Math.min(allMilestones.length, nextUpIndex + 3);
  
  return allMilestones.slice(startIndex, endIndex);
}
