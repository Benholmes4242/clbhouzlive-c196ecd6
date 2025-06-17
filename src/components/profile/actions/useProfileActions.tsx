
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
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          });
        
        toast({
          title: "Following successfully",
          description: "You are now following this user.",
        });
      }
      
      queryClient.invalidateQueries({
        queryKey: ['relationshipStatus', currentUserId, targetUserId]
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (friendStatus: 'pending' | 'accepted' | null) => {
    setLoading(true);
    try {
      if (friendStatus === 'pending') {
        await supabase
          .from('user_friends')
          .delete()
          .eq('user_id', currentUserId)
          .eq('friend_id', targetUserId);
        
        toast({
          title: "Friend request cancelled",
          description: "Your friend request has been cancelled.",
        });
      } else {
        await supabase
          .from('user_friends')
          .insert({
            user_id: currentUserId,
            friend_id: targetUserId,
            status: 'pending'
          });
        
        toast({
          title: "Friend request sent",
          description: "Your friend request has been sent.",
        });
      }
      
      queryClient.invalidateQueries({
        queryKey: ['relationshipStatus', currentUserId, targetUserId]
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      await supabase
        .from('user_friends')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);
      
      toast({
        title: "Friend removed",
        description: "You are no longer friends with this user.",
      });
      
      queryClient.invalidateQueries({
        queryKey: ['relationshipStatus', currentUserId, targetUserId]
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive",
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
