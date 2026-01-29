/**
 * Achievement Definitions
 * 
 * IMPORTANT: Milestone thresholds are sourced from src/config/achievements.ts
 * IMPORTANT: All colors are sourced from globalAchievementMilestoneSystem.ts
 * 
 * This file only defines structure and combines milestones with list achievements.
 * DO NOT add ringColor values here - they come from the global system.
 */

import { 
  ACHIEVEMENT_MILESTONES,
  MILESTONE_TIER_META,
  type AchievementMilestone,
} from '@/config/achievements';
import { 
  MILESTONE_THEMES, 
  REGION_THEMES,
} from './globalAchievementMilestoneSystem';

export type AchievementType = 'milestone' | 'list_completion';

export interface AchievementDefinition {
  id: string;
  threshold?: AchievementMilestone; // For milestones only - explicitly typed
  label: string;
  shortLabel: string;
  type: AchievementType;
  iconName?: string;
}

// Helper to get ring color from global system
export function getAchievementRingColor(achievement: AchievementDefinition): string {
  if (achievement.type === 'milestone' && achievement.threshold) {
    return MILESTONE_THEMES[achievement.threshold]?.accent ?? '#94a3b8';
  }
  if (achievement.type === 'list_completion') {
    return REGION_THEMES[achievement.id]?.accent ?? '#94a3b8';
  }
  return '#94a3b8';
}

// Helper to get glass intensity based on threshold
export function getAchievementGlassIntensity(achievement: AchievementDefinition): number {
  const glassIntensity = {
    subtle: 0.16,
    standard: 0.22,
    vivid: 0.32,
  };
  
  if (achievement.type === 'list_completion') {
    return glassIntensity.vivid;
  }
  
  if (achievement.threshold) {
    // Higher thresholds get more vivid glass
    if (achievement.threshold >= 200) return glassIntensity.vivid;
    if (achievement.threshold >= 50) return glassIntensity.vivid;
    if (achievement.threshold >= 10) return glassIntensity.standard;
  }
  
  return glassIntensity.subtle;
}

/**
 * MILESTONE_ACHIEVEMENTS - Derived from the single source of truth in src/config/achievements.ts
 * 
 * User earns ALL milestones where totalPlayed >= threshold.
 * Colors come from MILESTONE_THEMES in globalAchievementMilestoneSystem.ts.
 */
export const MILESTONE_ACHIEVEMENTS: AchievementDefinition[] = MILESTONE_TIER_META.map(meta => ({
  id: `milestone_${meta.threshold}`,
  threshold: meta.threshold,
  label: meta.tierName,
  shortLabel: `${meta.threshold} Club`,
  type: 'milestone' as const,
}));

// List completion achievements - earned by completing regional Top 100 lists
// NOTE: Colors come from REGION_THEMES in globalAchievementMilestoneSystem.ts
export const LIST_ACHIEVEMENTS: AchievementDefinition[] = [
  { 
    id: 'list_gb_ireland', 
    label: 'GB&I Top 100', 
    shortLabel: 'GB&I Complete',
    type: 'list_completion',
  },
  { 
    id: 'list_europe', 
    label: 'Europe Top 100', 
    shortLabel: 'Europe Complete',
    type: 'list_completion',
  },
  { 
    id: 'list_usa', 
    label: 'USA Top 100', 
    shortLabel: 'USA Complete',
    type: 'list_completion',
  },
  { 
    id: 'list_worldwide', 
    label: 'Global Top 100', 
    shortLabel: 'Global Complete',
    type: 'list_completion',
  },
];

// Combined lookup
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  ...MILESTONE_ACHIEVEMENTS,
  ...LIST_ACHIEVEMENTS,
];

// Map for quick lookup by ID
export const ACHIEVEMENT_BY_ID: Record<string, AchievementDefinition> = 
  ALL_ACHIEVEMENTS.reduce((acc, def) => {
    acc[def.id] = def;
    return acc;
  }, {} as Record<string, AchievementDefinition>);

// Map list slugs to achievement IDs
export const LIST_SLUG_TO_ACHIEVEMENT_ID: Record<string, string> = {
  'gb-i': 'list_gb_ireland',
  'europe': 'list_europe',
  'usa': 'list_usa',
  'global': 'list_worldwide',
};

/**
 * Get all unlocked milestone achievements for a given Top 100 count
 * Returns ALL milestones where threshold <= totalPlayed (not just highest)
 */
export function getUnlockedMilestoneAchievements(totalTop100Played: number): AchievementDefinition[] {
  return MILESTONE_ACHIEVEMENTS.filter(m => 
    m.threshold !== undefined && totalTop100Played >= m.threshold
  );
}

/**
 * Get unlocked list completion achievements based on list progress
 * A list is complete when played === total
 */
export function getUnlockedListAchievements(
  lists: Array<{ listSlug: string; played: number; total: number }>
): AchievementDefinition[] {
  const completedListIds: string[] = [];
  
  for (const list of lists) {
    if (list.played >= list.total && list.total > 0) {
      const achievementId = LIST_SLUG_TO_ACHIEVEMENT_ID[list.listSlug];
      if (achievementId) {
        completedListIds.push(achievementId);
      }
    }
  }
  
  return LIST_ACHIEVEMENTS.filter(a => completedListIds.includes(a.id));
}

/**
 * Get all unlocked achievements for a user
 * Combines milestones and list completions
 */
export function getAllUnlockedAchievements(
  totalTop100Played: number,
  lists: Array<{ listSlug: string; played: number; total: number }>
): AchievementDefinition[] {
  const milestones = getUnlockedMilestoneAchievements(totalTop100Played);
  const listCompletions = getUnlockedListAchievements(lists);
  
  // Milestones first (sorted by threshold ascending), then list completions
  return [...milestones, ...listCompletions];
}

/**
 * Convert hex to translucent rgba for glass effect
 */
export function achievementGlassTint(hex: string, opacity = 0.22): string {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
