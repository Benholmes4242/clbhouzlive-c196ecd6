
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
    queryClient.invalidateQueries({ queryKey: ['friendsCount'] });
    queryClient.invalidateQueries({ queryKey: ['friends'] });
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

  const handleFriendRequest = async (friendStatus: 'pending' | 'accepted' | null) => {
    setLoading(true);
    try {
      if (friendStatus === 'pending') {
        // Cancel pending request - but since we cleared all pending requests, this shouldn't happen
        // Let's just treat it as sending a new request
        console.log('Unexpected pending status found, treating as new request');
      }
      
      // Always send new friend request since all pending ones were cleared
      const { error } = await supabase
        .from('user_friends')
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;
      
      toast({
        title: "Friend request sent",
        duration: 1500,
      });
      
      invalidateAllRelatedQueries();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      // Remove friend relationship (both directions)
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);
      
      // Also remove follow relationships (both directions) when removing friend
      await supabase
        .from('user_follows')
        .delete()
        .or(`and(follower_id.eq.${currentUserId},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${currentUserId})`);
      
      toast({
        title: "Friend removed",
        description: "You are no longer friends with this user and have unfollowed each other.",
        duration: 2000,
      });
      
      invalidateAllRelatedQueries();
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleFollow,
    handleFriendRequest,
    handleRemoveFriend
  };
};
