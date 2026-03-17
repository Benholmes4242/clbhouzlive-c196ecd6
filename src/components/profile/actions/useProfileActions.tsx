/**
 * @deprecated Use `useUserFollow` for ProfileSocialButtons.
 * This hook is retained only for BusinessProfileActions and legacy consumers.
 * All Supabase calls now properly check for errors.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';

interface UseProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
}

export const useProfileActions = ({ targetUserId, currentUserId }: UseProfileActionsProps) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Check relationship status to respect blocks
  const { data: relationship } = useRelationshipStatus(targetUserId);

  const invalidateAllRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
    queryClient.invalidateQueries({ queryKey: ['followerCount'] });
    queryClient.invalidateQueries({ queryKey: ['followingCount'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    queryClient.invalidateQueries({ queryKey: ['user-follows'] });
    queryClient.invalidateQueries({ queryKey: ['social-counts'] });
  };

  const handleFollow = async (isFollowing: boolean) => {
    if (relationship?.hasBlockedThem || relationship?.isBlockedByThem) {
      toast.error("Action not allowed", {
        description: "You can't interact with this user.",
      });
      return;
    }
    
    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        toast.success("Unfollowed");
      } else {
        const { error } = await supabase
          .from('user_follows')
          .upsert({
            follower_id: currentUserId,
            following_id: targetUserId
          }, { 
            onConflict: 'follower_id,following_id',
            ignoreDuplicates: true 
          });
        
        if (error) throw error;
        toast.success("Following");
      }
      
      invalidateAllRelatedQueries();
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error?.message || "Couldn't update follow");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleFollow
  };
};
