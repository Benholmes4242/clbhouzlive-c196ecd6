import { useMemo } from 'react';
import { useCurrentSeason } from './useCurrentSeason';
import { useUserSeasonXP } from './useUserSeasonXP';
import { useSeasonRewardTiers } from './useSeasonRewardTiers';

export interface CurrentSeasonReward {
  tier: string;
  label: string;
  badge_icon: string | null;
  min_rank: number;
  max_rank: number;
  current_rank?: number;
}

export function useCurrentSeasonReward(userId?: string) {
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(userId, currentSeason?.id);
  const { data: rewardTiers } = useSeasonRewardTiers(currentSeason?.id);

  return useMemo((): CurrentSeasonReward | null => {
    if (!seasonXP || !rewardTiers || rewardTiers.length === 0) {
      return null;
    }

    const currentRank = seasonXP.season_rank;
    if (!currentRank) {
      // User not on leaderboard yet - return participant tier
      const participantTier = rewardTiers.find(tier => tier.tier === 'participant');
      if (participantTier) {
        return {
          tier: participantTier.tier,
          label: participantTier.label,
          badge_icon: participantTier.badge_icon,
          min_rank: participantTier.min_rank,
          max_rank: participantTier.max_rank,
        };
      }
      return null;
    }

    // Find matching reward tier
    const matchingTier = rewardTiers.find(
      tier => currentRank >= tier.min_rank && currentRank <= tier.max_rank
    );

    if (matchingTier) {
      return {
        tier: matchingTier.tier,
        label: matchingTier.label,
        badge_icon: matchingTier.badge_icon,
        min_rank: matchingTier.min_rank,
        max_rank: matchingTier.max_rank,
        current_rank: currentRank,
      };
    }

    return null;
  }, [seasonXP, rewardTiers]);
}
