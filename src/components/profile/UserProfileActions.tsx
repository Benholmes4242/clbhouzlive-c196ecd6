
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UserPlus, MessageCircle, UserCheck, MoreHorizontal, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UserProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing: boolean;
  friendStatus: 'pending' | 'accepted' | null;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  isFollowing,
  friendStatus
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
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
        // Follow
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
      
      // Refresh the relationship status
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

  const handleFriendRequest = async () => {
    setLoading(true);
    try {
      if (friendStatus === 'pending') {
        // Cancel pending request
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
        // Send friend request
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
      // Remove the friendship (works for both directions)
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

  const handleMessage = () => {
    if (friendStatus !== 'accepted') {
      toast({
        title: "Cannot send message",
        description: "You can only message friends. Send a friend request first.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement messaging functionality
    toast({
      title: "Coming soon",
      description: "Messaging functionality will be available soon.",
    });
  };

  const getFollowButtonText = () => {
    if (loading) return "Loading...";
    return isFollowing ? "Following" : "Follow";
  };

  const getFriendButtonText = () => {
    if (loading) return "Loading...";
    if (friendStatus === 'accepted') return "Friends";
    if (friendStatus === 'pending') return "Request Sent";
    return "Add Friend";
  };

  const getFriendButtonIcon = () => {
    if (friendStatus === 'accepted') return <UserCheck className="w-4 h-4" />;
    if (friendStatus === 'pending') return <UserMinus className="w-4 h-4" />;
    return <UserPlus className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-6 mb-6">
      {/* Follow Button */}
      <Button
        variant={isFollowing ? "secondary" : "default"}
        onClick={handleFollow}
        disabled={loading}
        className="flex-1 max-w-32"
      >
        {getFollowButtonText()}
      </Button>

      {/* Message Button */}
      <Button
        variant="outline"
        onClick={handleMessage}
        disabled={friendStatus !== 'accepted'}
        className="flex-1 max-w-32"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Message
      </Button>

      {/* Friend Request Button */}
      <Button
        variant={friendStatus === 'accepted' ? "secondary" : "outline"}
        onClick={handleFriendRequest}
        disabled={loading || friendStatus === 'accepted'}
        className="flex-1 max-w-32"
      >
        {getFriendButtonIcon()}
        <span className="ml-2">{getFriendButtonText()}</span>
      </Button>

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {friendStatus === 'accepted' && (
            <DropdownMenuItem onClick={handleRemoveFriend} disabled={loading}>
              Remove Friend
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => {
            toast({
              title: "Coming soon",
              description: "Block user functionality will be available soon.",
            });
          }}>
            Block User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            toast({
              title: "Coming soon", 
              description: "Report user functionality will be available soon.",
            });
          }}>
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfileActions;
