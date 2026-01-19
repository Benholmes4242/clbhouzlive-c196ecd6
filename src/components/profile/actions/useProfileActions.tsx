import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';

interface UseProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
}

export const useProfileActions = ({ targetUserId, currentUserId }: UseProfileActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check relationship status to respect blocks
  const { data: relationship } = useRelationshipStatus(targetUserId);

  const invalidateAllRelatedQueries = () => {
    // Invalidate all relationship-related queries for both users
    queryClient.invalidateQueries({ queryKey: ['relationshipStatus'] });
    queryClient.invalidateQueries({ queryKey: ['followerCount'] });
    queryClient.invalidateQueries({ queryKey: ['followingCount'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    // Invalidate discovery exclusions so suggested users refreshes
    queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
  };

  const handleFollow = async (isFollowing: boolean) => {
    // Guard: check if blocked before allowing action
    if (relationship?.hasBlockedThem || relationship?.isBlockedByThem) {
      toast({
        title: "Action not allowed",
        description: "You can't interact with this user.",
        variant: "destructive",
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
        
        toast({
          title: "Unfollowed successfully",
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
        
        toast({
          title: "Following successfully",
          description: "You are now following this user.",
          duration: 1500,
        });
      }
      
      invalidateAllRelatedQueries();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
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