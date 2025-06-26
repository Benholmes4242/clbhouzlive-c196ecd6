
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FollowerStatsProps {
  userId: string;
  userType?: string;
  username?: string; // Add username prop for navigation
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ userId, userType = 'individual', username }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSupabaseSession();
  const isIndividual = userType === 'individual';
  const isOwnProfile = currentUser?.id === userId;

  // Get follower count for any user profile
  const { data: followerCount = 0 } = useQuery({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      console.log('Fetching follower count for user:', userId);
      const { count, error } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (error) {
        console.error('Error fetching follower count:', error);
        return 0;
      }
      
      console.log('Follower count result:', count);
      return count || 0;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get following count for any user profile
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      console.log('Fetching following count for user:', userId);
      const { count, error } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) {
        console.error('Error fetching following count:', error);
        return 0;
      }
      
      console.log('Following count result:', count);
      return count || 0;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Get friends count for any user profile - only for individual users
  const { data: friendsCount = 0 } = useQuery({
    queryKey: ['friendsCount', userId],
    queryFn: async () => {
      if (!isIndividual) return 0;
      
      console.log('Fetching friends count for user:', userId);
      const { count, error } = await supabase
        .from('user_friends')
        .select('*', { count: 'exact', head: true })
        .or(`and(user_id.eq.${userId},status.eq.accepted),and(friend_id.eq.${userId},status.eq.accepted)`);
      
      if (error) {
        console.error('Error fetching friends count:', error);
        return 0;
      }
      
      console.log('Friends count result:', count);
      return count || 0;
    },
    enabled: isIndividual,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleFollowingClick = () => {
    if (isOwnProfile) {
      // For own profile, go to the standard following page
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      navigate('/following');
    } else if (username) {
      // For other users, go to their following page (if we implement it)
      // For now, show a message that this feature is coming soon
      console.log('Navigate to following for user:', username);
      // TODO: Implement /profile/:username/following route
    }
  };

  const handleFollowersClick = () => {
    if (isOwnProfile) {
      // For own profile, go to the standard followers page
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['followerCount'] });
      navigate('/followers');
    } else if (username) {
      // For other users, go to their followers page (if we implement it)
      console.log('Navigate to followers for user:', username);
      // TODO: Implement /profile/:username/followers route
    }
  };

  const handleFriendsClick = () => {
    if (isOwnProfile) {
      // For own profile, go to the standard friends page
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendsCount'] });
      navigate('/friends');
    } else if (username) {
      // For other users, go to their friends page (if we implement it)
      console.log('Navigate to friends for user:', username);
      // TODO: Implement /profile/:username/friends route
    }
  };

  return (
    <div className="flex justify-center gap-8 py-4 border-y border-border">
      <div 
        className={`text-center ${isOwnProfile ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : 'px-2 py-1'}`} 
        onClick={isOwnProfile ? handleFollowingClick : undefined}
      >
        <div className="text-xl font-bold">{followingCount}</div>
        <div className="text-sm text-muted-foreground">Following</div>
      </div>
      <div 
        className={`text-center ${isOwnProfile ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : 'px-2 py-1'}`} 
        onClick={isOwnProfile ? handleFollowersClick : undefined}
      >
        <div className="text-xl font-bold">{followerCount}</div>
        <div className="text-sm text-muted-foreground">Followers</div>
      </div>
      {isIndividual && (
        <div 
          className={`text-center ${isOwnProfile ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : 'px-2 py-1'}`} 
          onClick={isOwnProfile ? handleFriendsClick : undefined}
        >
          <div className="text-xl font-bold">{friendsCount}</div>
          <div className="text-sm text-muted-foreground">Friends</div>
        </div>
      )}
    </div>
  );
};

export default FollowerStats;
