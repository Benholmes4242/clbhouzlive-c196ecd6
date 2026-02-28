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
    queryClient.invalidateQueries({ queryKey: ['relationshipStatus'] });
    queryClient.invalidateQueries({ queryKey: ['followerCount'] });
    queryClient.invalidateQueries({ queryKey: ['followingCount'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
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
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        
        toast.success("Unfollowed successfully", {
          description: "You are no longer following this user.",
          duration: 1500,
        });
      } else {
        await supabase
          .from('user_follows')
          .upsert({
            follower_id: currentUserId,
            following_id: targetUserId
          }, { 
            onConflict: 'follower_id,following_id',
            ignoreDuplicates: true 
          });
        
        toast.success("Following successfully", {
          description: "You are now following this user.",
          duration: 1500,
        });
      }
      
      invalidateAllRelatedQueries();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error("Error", {
        description: "Failed to update follow status. Please try again.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleFollow
  };
};