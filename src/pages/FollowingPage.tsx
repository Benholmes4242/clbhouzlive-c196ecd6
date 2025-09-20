
import React from 'react';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const FollowingPage = () => {
  const { user } = useSupabaseSession();

  const { data: following, isLoading } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching following for user:', user.id);
      
      // First get the following relationships
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error fetching following relationships:', followError);
        throw followError;
      }
      
      if (!followData || followData.length === 0) {
        console.log('Not following anyone');
        return [];
      }

      console.log('Following IDs found:', followData.map(f => f.following_id));

      // Then get the profile data for each person being followed
      const followingIds = followData.map(f => f.following_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio')
        .in('id', followingIds);

      if (profileError) {
        console.error('Error fetching following profiles:', profileError);
        throw profileError;
      }

      console.log('Following profiles:', profiles);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading following...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Following</h1>
        </div>

        {following && following.length > 0 ? (
          <div className="space-y-3">
            {following.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={profile.display_name || profile.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">
                          {profile.display_name || profile.username || 'User'}
                        </h3>
                        {profile.username && (
                          <p className="text-sm text-muted-foreground">@{profile.username}</p>
                        )}
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Unfollow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Not following anyone yet.
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default FollowingPage;
