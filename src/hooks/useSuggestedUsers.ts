import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuggestedUser {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  bio?: string;
  followersCount: number;
  isVerified?: boolean;
  isReal: boolean; // To distinguish real vs mock users
  lastPortraitVideo?: string; // URL of their last uploaded portrait video
}

export const useSuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get users that the current user is NOT following
      const { data: realUsers, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          bio,
          profile_video_url
        `)
        .neq('id', user.id) // Exclude current user
        .eq('is_public', true)
        .limit(15);

      // Get follower counts separately for each user
      const usersWithFollowerCounts = await Promise.all(
        (realUsers || []).map(async (profile) => {
          const { count } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);
          
          return {
            ...profile,
            followers_count: count || 0
          };
        })
      );

      if (error) {
        console.error('Error fetching suggested users:', error);
        setUsers([]);
        return;
      }

      // Filter out users that current user is already following
      const followedUserIds = new Set();
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      followingData?.forEach(follow => followedUserIds.add(follow.following_id));

      const unfollowedUsers = usersWithFollowerCounts.filter(u => !followedUserIds.has(u.id));

      // Transform real users to match our interface
      const transformedRealUsers: SuggestedUser[] = unfollowedUsers.map(user => ({
        id: user.id,
        displayName: user.display_name || user.username || 'User',
        username: user.username ? `@${user.username}` : '@user',
        profileImage: user.profile_photo_url || 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop&crop=face',
        bio: user.bio || '',
        followersCount: user.followers_count || 0,
        isVerified: false,
        isReal: true,
        lastPortraitVideo: user.profile_video_url
      }));

      // Mock users to fill out suggestions if needed
      const mockUsers: SuggestedUser[] = [
        {
          id: 'mock-1',
          displayName: 'Sarah Johnson',
          username: '@sarahjgolf',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612d7c5?w=100&h=100&fit=crop&crop=face',
          bio: 'Weekend warrior golfer',
          followersCount: 1240,
          isVerified: false,
          isReal: false,
          lastPortraitVideo: undefined
        },
        {
          id: 'mock-2',
          displayName: 'Mike Chen',
          username: '@mikechengolf',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          bio: 'Scratch golfer & coach',
          followersCount: 3420,
          isVerified: true,
          isReal: false
        },
        {
          id: 'mock-3',
          displayName: 'Emma Wilson',
          username: '@emmawgolf',
          profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
          bio: 'Golf fitness enthusiast',
          followersCount: 890,
          isVerified: false,
          isReal: false
        },
        {
          id: 'mock-4',
          displayName: 'David Rodriguez',
          username: '@davidrgolf',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          bio: 'Course photographer',
          followersCount: 2150,
          isVerified: false,
          isReal: false
        },
        {
          id: 'mock-5',
          displayName: 'Lisa Park',
          username: '@lisaparkgolf',
          profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
          bio: 'Junior golf instructor',
          followersCount: 1580,
          isVerified: true,
          isReal: false
        },
        {
          id: 'mock-6',
          displayName: 'James Miller',
          username: '@jamesmgolf',
          profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
          bio: 'Golf equipment reviewer',
          followersCount: 4230,
          isVerified: true,
          isReal: false
        },
        {
          id: 'mock-7',
          displayName: 'Rachel Green',
          username: '@rachelggolf',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
          bio: 'Golf course designer',
          followersCount: 980,
          isVerified: false,
          isReal: false
        },
        {
          id: 'mock-8',
          displayName: 'Alex Thompson',
          username: '@alextgolf',
          profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
          bio: 'PGA Tour analyst',
          followersCount: 6740,
          isVerified: true,
          isReal: false
        },
        {
          id: 'mock-9',
          displayName: 'Nicole Davis',
          username: '@nicoledgolf',
          profileImage: 'https://images.unsplash.com/photo-1557296387-5358ad7997bb?w=100&h=100&fit=crop&crop=face',
          bio: 'Golf mental coach',
          followersCount: 1320,
          isVerified: false,
          isReal: false
        },
        {
          id: 'mock-10',
          displayName: 'Ryan Kim',
          username: '@ryankgolf',
          profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
          bio: 'Golf swing analyst',
          followersCount: 2890,
          isVerified: true,
          isReal: false
        }
      ];

      // Combine real users first, then mock users
      const combinedUsers = [...transformedRealUsers, ...mockUsers];
      setUsers(combinedUsers);

    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  return { users, loading, refetch: fetchSuggestedUsers };
};