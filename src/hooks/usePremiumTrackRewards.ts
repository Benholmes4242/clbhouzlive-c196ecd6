import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserSeasonXP } from './useUserSeasonXP';
import { useSeasonPass } from './useSeasonPass';

export interface TrackReward {
  xpRequired: number;
  tier: 'free' | 'premium';
  reward: {
    type: 'currency' | 'cosmetic' | 'badge';
    name: string;
    amount?: number;
    itemId?: string;
  };
  isUnlocked: boolean;
  isClaimed: boolean;
}

// Sample reward track structure
const REWARD_TRACK: Omit<TrackReward, 'isUnlocked' | 'isClaimed'>[] = [
  { xpRequired: 100, tier: 'free', reward: { type: 'currency', name: 'Season Coins', amount: 50 } },
  { xpRequired: 100, tier: 'premium', reward: { type: 'cosmetic', name: 'Bronze Ring' } },
  
  { xpRequired: 250, tier: 'free', reward: { type: 'currency', name: 'Season Coins', amount: 75 } },
  { xpRequired: 250, tier: 'premium', reward: { type: 'cosmetic', name: 'Elite Frame' } },
  
  { xpRequired: 500, tier: 'free', reward: { type: 'badge', name: 'Competitor Badge' } },
  { xpRequired: 500, tier: 'premium', reward: { type: 'cosmetic', name: 'Golf Vibes Pack' } },
  
  { xpRequired: 750, tier: 'free', reward: { type: 'currency', name: 'Season Coins', amount: 100 } },
  { xpRequired: 750, tier: 'premium', reward: { type: 'cosmetic', name: 'Silver Ring' } },
  
  { xpRequired: 1000, tier: 'free', reward: { type: 'currency', name: 'Season Coins', amount: 150 } },
  { xpRequired: 1000, tier: 'premium', reward: { type: 'cosmetic', name: 'Pro Reactions' } },
  
  { xpRequired: 1500, tier: 'free', reward: { type: 'badge', name: 'Veteran Badge' } },
  { xpRequired: 1500, tier: 'premium', reward: { type: 'cosmetic', name: 'Golden Ring' } },
  
  { xpRequired: 2000, tier: 'free', reward: { type: 'currency', name: 'Season Coins', amount: 200 } },
  { xpRequired: 2000, tier: 'premium', reward: { type: 'cosmetic', name: 'Championship Frame' } },
];

export function usePremiumTrackRewards(seasonId?: string, userId?: string) {
  const { data: seasonXP } = useUserSeasonXP(userId, seasonId);
  const { hasPremiumPass } = useSeasonPass(userId, seasonId);

  const currentXP = seasonXP?.total_xp || 0;

  // Build reward track with unlock states
  const rewards: TrackReward[] = REWARD_TRACK.map(reward => ({
    ...reward,
    isUnlocked: currentXP >= reward.xpRequired && (reward.tier === 'free' || hasPremiumPass),
    isClaimed: currentXP >= reward.xpRequired, // In a full implementation, track claims separately
  }));

  const freeRewards = rewards.filter(r => r.tier === 'free');
  const premiumRewards = rewards.filter(r => r.tier === 'premium');

  return {
    freeRewards,
    premiumRewards,
    allRewards: rewards,
    currentXP,
    hasPremiumPass,
  };
}
