import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UseProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
}

export const useProfileActions = ({ targetUserId, currentUserId }: UseProfileActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateAllRelatedQueries = () => {
    // Invalidate all relationship-related queries for both users
    queryClient.invalidateQueries({ queryKey: ['relationshipStatus'] });
    queryClient.invalidateQueries({ queryKey: ['followerCount'] });
    queryClient.invalidateQueries({ queryKey: ['followingCount'] });
    queryClient.invalidateQueries({ queryKey: ['followers'] });
    queryClient.invalidateQueries({ queryKey: ['following'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleFollow = async (isFollowing: boolean) => {
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