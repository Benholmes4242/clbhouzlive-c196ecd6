
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FollowerStatsProps {
  userId: string;
  userType?: string;
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ userId, userType = 'individual' }) => {
  const navigate = useNavigate();
  const isIndividual = userType === 'individual';

  // Get follower count with service role bypass for RLS
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
  });

  // Get following count with service role bypass for RLS
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
  });

  // Get friends count - only for individual users
  const { data: friendsCount = 0 } = useQuery({
    queryKey: ['friendsCount', userId],
    queryFn: async () => {
      if (!isIndividual) return 0;
      
      console.log('Fetching friends count for user:', userId);
      const { count, error } = await supabase
        .from('user_friends')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');
      
      if (error) {
        console.error('Error fetching friends count:', error);
        return 0;
      }
      
      console.log('Friends count result:', count);
      return count || 0;
    },
    enabled: isIndividual,
  });

  const handleFollowingClick = () => {
    navigate(`/profile/${userId}/following`);
  };

  const handleFollowersClick = () => {
    navigate(`/profile/${userId}/followers`);
  };

  const handleFriendsClick = () => {
    navigate(`/profile/${userId}/friends`);
  };

  return (
    <div className="flex justify-center gap-8 py-4 border-y border-border">
      <div className="text-center cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" onClick={handleFollowingClick}>
        <div className="text-xl font-bold">{followingCount}</div>
        <div className="text-sm text-muted-foreground">Following</div>
      </div>
      <div className="text-center cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" onClick={handleFollowersClick}>
        <div className="text-xl font-bold">{followerCount}</div>
        <div className="text-sm text-muted-foreground">Followers</div>
      </div>
      {isIndividual && (
        <div className="text-center cursor-pointer hover:bg-muted/50 px-2 py-1 rounded" onClick={handleFriendsClick}>
          <div className="text-xl font-bold">{friendsCount}</div>
          <div className="text-sm text-muted-foreground">Friends</div>
        </div>
      )}
    </div>
  );
};

export default FollowerStats;
