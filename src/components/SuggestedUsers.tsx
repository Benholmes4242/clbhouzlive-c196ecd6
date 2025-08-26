
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { getAvatarSize } from '@/utils/imageOptimization';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  profile_photo_url: string;
  home_club?: string;
  mutualConnections?: number;
}

const SuggestedUsers = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseSession();

  useEffect(() => {
    fetchSuggestedUsers();
  }, [user]);

  const fetchSuggestedUsers = async () => {
    try {
      // Fetch public users excluding current user and existing friends
      let excludeIds = [];
      if (user) {
        excludeIds.push(user.id);
        
        // Get existing friends to exclude them
        const { data: friends } = await supabase
          .from('user_friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');
        
        if (friends) {
          excludeIds.push(...friends.map(f => f.friend_id));
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club')
        .eq('is_public', true)
        .not('id', 'in', `(${excludeIds.join(',') || 'null'})`)
        .limit(5);

      if (error) {
        console.error('Error fetching suggested users:', error);
        // Fallback to mock data
        setSuggestedUsers(getMockSuggestedUsers());
      } else if (data && data.length > 0) {
        setSuggestedUsers(data.map(user => ({
          ...user,
          display_name: user.display_name || user.username || 'Golf Player',
          profile_photo_url: user.profile_photo_url || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1507003211169-0a1dd7228f2d' : '1500648767791-00dcc994a43e'}?w=150&h=150&fit=crop&crop=face`,
          mutualConnections: Math.floor(Math.random() * 10)
        })));
      } else {
        setSuggestedUsers(getMockSuggestedUsers());
      }
    } catch (error) {
      console.error('Error in fetchSuggestedUsers:', error);
      setSuggestedUsers(getMockSuggestedUsers());
    } finally {
      setLoading(false);
    }
  };

  const getMockSuggestedUsers = (): SuggestedUser[] => [
    {
      id: '1',
      username: 'mike_golf_pro',
      display_name: 'Mike Johnson',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      home_club: 'Augusta National',
      mutualConnections: 5
    },
    {
      id: '2',
      username: 'sarah_golf',
      display_name: 'Sarah Chen',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b302?w=150&h=150&fit=crop&crop=face',
      home_club: 'Pebble Beach',
      mutualConnections: 3
    },
    {
      id: '3',
      username: 'alex_links',
      display_name: 'Alex Rodriguez',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      home_club: 'St Andrews',
      mutualConnections: 8
    },
    {
      id: '4',
      username: 'emma_fairway',
      display_name: 'Emma Thompson',
      profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      home_club: 'Pinehurst No. 2',
      mutualConnections: 2
    },
    {
      id: '5',
      username: 'david_green',
      display_name: 'David Wilson',
      profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      home_club: 'Torrey Pines',
      mutualConnections: 6
    }
  ];

  const handleFollow = (userId: string) => {
    // Update the button state optimistically
    setSuggestedUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: true }
          : user
      )
    );
    
    // Here you would typically send a friend request to the backend
    // Following user action
  };

  if (loading) {
    return (
      <div className="sticky top-6">
        <Card className="px-4 py-1">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-2 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="sticky top-6">
      <Card className="px-4 py-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-muted-foreground">Suggested for you</h3>
          <Button variant="ghost" size="sm" className="text-xs">
            See All
          </Button>
        </div>
        
        <div className="space-y-3">
          {suggestedUsers.map((suggestedUser) => (
            <div key={suggestedUser.id} className="flex items-center space-x-3">
              <OptimizedAvatar
                src={suggestedUser.profile_photo_url}
                alt={suggestedUser.display_name}
                className="w-6 h-6"
                size={getAvatarSize('thumbnail')}
                fallback={suggestedUser.display_name?.charAt(0)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestedUser.display_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Golf enthusiast
                  {suggestedUser.mutualConnections && suggestedUser.mutualConnections > 0 && (
                    <span> • {suggestedUser.mutualConnections} mutual</span>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs px-3 py-1 h-auto"
                onClick={() => handleFollow(suggestedUser.id)}
              >
                Follow
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuggestedUsers;
