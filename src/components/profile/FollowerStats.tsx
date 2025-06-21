
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowerStatsProps {
  userId: string;
}

const FollowerStats: React.FC<FollowerStatsProps> = ({ userId }) => {
  // Get follower count
  const { data: followerCount = 0 } = useQuery({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      return count || 0;
    },
  });

  // Get following count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      return count || 0;
    },
  });

  // Get friends count
  const { data: friendsCount = 0 } = useQuery({
    queryKey: ['friendsCount', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_friends')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');
      return count || 0;
    },
  });

  return (
    <div className="flex justify-center gap-8 py-4 border-y border-border">
      <div className="text-center">
        <div className="text-xl font-bold">{followingCount}</div>
        <div className="text-sm text-muted-foreground">Following</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{followerCount}</div>
        <div className="text-sm text-muted-foreground">Followers</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{friendsCount}</div>
        <div className="text-sm text-muted-foreground">Friends</div>
      </div>
    </div>
  );
};

export default FollowerStats;
