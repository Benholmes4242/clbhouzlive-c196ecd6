import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { useDiscoveryExclusions } from '@/hooks/useDiscoveryExclusions';
import { useQueryClient } from '@tanstack/react-query';
import { useToggleFollow } from '@/hooks/useToggleFollow';

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
  const queryClient = useQueryClient();
  const toggle = useToggleFollow();

  // Get exclusion data from the centralized hook
  const { data: exclusions, isLoading: exclusionsLoading } = useDiscoveryExclusions(user?.id);

  useEffect(() => {
    if (user && exclusions && !exclusionsLoading) {
      fetchSuggestedUsers();
    } else if (!user) {
      // No user logged in, show mock data
      setSuggestedUsers(getMockSuggestedUsers());
      setLoading(false);
    }
  }, [user, exclusions, exclusionsLoading]);

  const fetchSuggestedUsers = async () => {
    try {
      if (!user || !exclusions) {
        setSuggestedUsers(getMockSuggestedUsers());
        setLoading(false);
        return;
      }

      // Convert excludedIds Set to array for query
      const excludeIdsArray = Array.from(exclusions.excludedIds);
      
      // Build query - exclude all users with existing relationships
      let query = supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url, home_club')
        .eq('is_public', true)
        .is('deleted_at', null)
        .limit(20); // Fetch more to account for filtering

      // Execute query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching suggested users:', error);
        setSuggestedUsers(getMockSuggestedUsers());
        return;
      }

      // Filter out excluded users client-side (more reliable than SQL IN clause)
      const eligibleUsers = (data || []).filter(u => !exclusions.excludedIds.has(u.id));

      console.log('SuggestedUsers: Users after exclusion filtering:', eligibleUsers.length, 'from', data?.length);

      if (eligibleUsers.length > 0) {
        // Limit to 5 users for display
        setSuggestedUsers(eligibleUsers.slice(0, 5).map(userData => ({
          ...userData,
          display_name: userData.display_name || userData.username || 'Golf Player',
          profile_photo_url: userData.profile_photo_url || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1507003211169-0a1dd7228f2d' : '1500648767791-00dcc994a43e'}?w=150&h=150&fit=crop&crop=face`,
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

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: userId,
        targetUserId: userId,
        viewerActorType: 'personal',
        viewerActorId: user.id,
        viewerUserId: user.id,
        isFollowing: false,
      });

      // Invalidate exclusions cache and remove user from list
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error in handleFollow:', error);
    }
  };

  if (loading || exclusionsLoading) {
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
              <SquircleAvatar 
                size={40} 
                src={suggestedUser.profile_photo_url}
                alt={suggestedUser.display_name}
                fallback={suggestedUser.display_name?.charAt(0) || '?'}
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
