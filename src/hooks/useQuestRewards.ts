/**
 * useQuestRewards - Hook for quest-based profile evolution
 * Returns reward tiers based on quest progress
 */

import { useMemo } from 'react';

export interface QuestRewards {
  profileAccentTier: 'none' | 'bronze' | 'silver' | 'gold';
  glassGlowStrength: 0 | 1 | 2 | 3;
  questBadge?: string;
  hasGoldTrim: boolean;
  hasTrophyGlow: boolean;
  hasBackgroundTexture: boolean;
  hasPremiumAccent: boolean;
}

export function useQuestRewards(
  totalPlayed: number,
  regionsCompleted: number
): QuestRewards {
  return useMemo(() => {
    // Determine accent tier
    let profileAccentTier: QuestRewards['profileAccentTier'] = 'none';
    if (totalPlayed >= 50) {
      profileAccentTier = 'gold';
    } else if (totalPlayed >= 20) {
      profileAccentTier = 'silver';
    } else if (totalPlayed >= 10) {
      profileAccentTier = 'bronze';
    }

    // Glow strength based on progress
    let glassGlowStrength: QuestRewards['glassGlowStrength'] = 0;
    if (totalPlayed >= 50) {
      glassGlowStrength = 3;
    } else if (totalPlayed >= 20) {
      glassGlowStrength = 2;
    } else if (totalPlayed >= 10) {
      glassGlowStrength = 1;
    }

    // Quest badge
    let questBadge: string | undefined;
    if (totalPlayed >= 100) {
      questBadge = 'Century Club';
    } else if (totalPlayed >= 50) {
      questBadge = '50 Club';
    } else if (totalPlayed >= 20) {
      questBadge = '20 Club';
    }

    return {
      profileAccentTier,
      glassGlowStrength,
      questBadge,
      hasGoldTrim: totalPlayed >= 10,
      hasTrophyGlow: totalPlayed >= 20,
      hasBackgroundTexture: totalPlayed >= 10 || regionsCompleted >= 1,
      hasPremiumAccent: totalPlayed >= 50,
    };
  }, [totalPlayed, regionsCompleted]);
}
