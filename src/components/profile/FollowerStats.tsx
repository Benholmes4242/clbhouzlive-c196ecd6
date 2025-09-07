
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FollowerStatsProps {
  userId: string;
  userType?: string;
  username?: string;
  compact?: boolean;
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ userId, userType = 'individual', username, compact = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSupabaseSession();
  const isIndividual = userType === 'individual';
  // Enhanced isOwnProfile check to handle username-based profile access
  const isOwnProfile = currentUser?.id === userId ||
                       (currentUser && username && currentUser.user_metadata?.username === username) ||
                       (currentUser && username === currentUser.email?.split('@')[0]);

  console.log('FollowerStats - userId:', userId, 'userType:', userType, 'isOwnProfile:', isOwnProfile);

  // Get follower count
  const { data: followerCount = 0, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('FollowerStats: No userId provided for follower count');
        return 0;
      }
      
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
    enabled: !!userId,
    staleTime: 0, // No caching - always fetch fresh data
    gcTime: 0, // Don't keep in cache
  });

  // Get following count
  const { data: followingCount = 0, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('FollowerStats: No userId provided for following count');
        return 0;
      }
      
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
    enabled: !!userId,
    staleTime: 0, // No caching - always fetch fresh data
    gcTime: 0, // Don't keep in cache
  });

  // Get friends count - REMOVED (feature deprecated)
  
  // Navigation handlers
  const handleFollowingClick = () => {
    if (username) {
      navigate(`/following${isOwnProfile ? '' : `/${username}`}`);
    }
  };

  const handleFollowersClick = () => {
    if (username) {
      navigate(`/followers${isOwnProfile ? '' : `/${username}`}`);
    }
  };

  // Removed excessive logging for performance

  return (
    <div className={compact ? "flex items-center gap-4" : "flex justify-center gap-8 py-4 border-y border-border"}>
      {/* Following - Always show and always clickable */}
      <div 
        className={`text-center cursor-pointer hover:bg-muted/50 rounded transition-colors ${
          compact ? 'py-1 px-2' : 'px-2 py-1'
        }`} 
        onClick={handleFollowingClick}
      >
        <div className={compact ? "text-sm font-semibold" : "text-xl font-bold"}>
          {isLoadingFollowing ? '...' : followingCount}
        </div>
        <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
          Following
        </div>
      </div>

      {/* Followers/Follows you - Logic based on profile ownership */}
      <div 
        className={`text-center cursor-pointer hover:bg-muted/50 rounded transition-colors ${
          compact ? 'py-1 px-2' : 'px-2 py-1'
        }`} 
        onClick={handleFollowersClick}
      >
        <div className={compact ? "text-sm font-semibold" : "text-xl font-bold"}>
          {isLoadingFollowers ? '...' : followerCount}
        </div>
        <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
          {isOwnProfile ? 'Follows you' : 'Followers'}
        </div>
      </div>
    </div>
  );
};

export default FollowerStats;
