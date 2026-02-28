import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge, UserBadge, BadgeProgress } from '@/types/badges';

// Import the new badge unlock modal
let BadgeUnlockModal: any = null;
if (typeof window !== 'undefined') {
  import('@/components/badges/BadgeUnlockModal').then(module => {
    BadgeUnlockModal = module.BadgeUnlockModal;
  });
}

export const useBadges = (userId?: string) => {
  
  const queryClient = useQueryClient();
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Fetch all available badges
  const { data: allBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('id, name, display_name, description, emoji, tier, category, criteria_type, criteria_value')
        .eq('is_active', true)
        .order('criteria_value', { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    }
  });

  // Fetch user's earned badges
  const { data: userBadges, isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id, user_id, badge_id, earned_at, progress_value,
          badge:badges(id, name, display_name, description, emoji, tier, category, criteria_type, criteria_value)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!userId
  });

  // Calculate badge progress for user
  const badgeProgress: BadgeProgress[] = allBadges?.map(badge => {
    const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
    const isEarned = !!userBadge;
    const currentProgress = userBadge?.progress_value || 0;
    const progressPercentage = Math.min((currentProgress / badge.criteria_value) * 100, 100);

    return {
      badge,
      current_progress: currentProgress,
      is_earned: isEarned,
      earned_at: userBadge?.earned_at,
      progress_percentage: progressPercentage
    };
  }) || [];

  // Check and award badges mutation
  const checkBadgesMutation = useMutation({
    mutationFn: async (checkUserId: string) => {
      const { data, error } = await supabase.rpc('check_and_award_badges', {
        user_id_param: checkUserId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      const newBadges = result?.[0]?.newly_awarded_badges;
      if (newBadges && Array.isArray(newBadges) && newBadges.length > 0) {
        // Show the unlock modal for the first new badge
        const firstBadge = newBadges[0];
        if (firstBadge && typeof firstBadge === 'object') {
          setUnlockedBadge(firstBadge as unknown as Badge);
          setShowUnlockModal(true);
        }
        
        // Show toast for additional badges if more than one
        if (newBadges.length > 1) {
          toast.success(`🏅 ${newBadges.length} New Badges Earned!`, { description: "Check your achievements to see all unlocked badges!", duration: 5000 });
        }
        
        // Refresh badge data
        queryClient.invalidateQueries({ queryKey: ['user-badges', userId] });
      }
    },
    onError: (error) => {
      console.error('Error checking badges:', error);
    }
  });

  // Get badges by category
  const getBadgesByCategory = (category: Badge['category']) => {
    return badgeProgress.filter(bp => bp.badge.category === category);
  };

  // Get earned badges only
  const getEarnedBadges = () => {
    return badgeProgress.filter(bp => bp.is_earned);
  };

  // Get next badge to achieve
  const getNextBadgeTarget = (category?: Badge['category']) => {
    const categoryBadges = category 
      ? getBadgesByCategory(category)
      : badgeProgress;
    
    return categoryBadges
      .filter(bp => !bp.is_earned)
      .sort((a, b) => a.badge.criteria_value - b.badge.criteria_value)[0];
  };

  // Get tier colors for styling
  const getTierColor = (tier: Badge['tier']) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600 text-white';
      case 'silver': return 'bg-gray-400 text-white';
      case 'gold': return 'bg-yellow-500 text-white';
      case 'platinum': return 'bg-purple-600 text-white';
      case 'diamond': return 'bg-blue-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return {
    allBadges,
    userBadges,
    badgeProgress,
    loadingBadges,
    loadingUserBadges,
    isLoading: loadingBadges || loadingUserBadges,
    checkBadges: checkBadgesMutation.mutate,
    isCheckingBadges: checkBadgesMutation.isPending,
    getBadgesByCategory,
    getEarnedBadges,
    getNextBadgeTarget,
    getTierColor,
    // Badge unlock modal state
    unlockedBadge,
    showUnlockModal,
    setShowUnlockModal,
    BadgeUnlockModal
  };
};