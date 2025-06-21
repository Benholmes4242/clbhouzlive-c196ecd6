
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

const FollowersPage = () => {
  const { userId } = useParams<{ userId: string }>();

  const { data: followers, isLoading } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // First get the follower relationships
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (followError) throw followError;
      if (!followData || followData.length === 0) return [];

      // Then get the profile data for each follower
      const followerIds = followData.map(f => f.follower_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio')
        .in('id', followerIds);

      if (profileError) throw profileError;

      return profiles || [];
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading followers...</div>
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
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Followers</h1>
        </div>

        {followers && followers.length > 0 ? (
          <div className="space-y-3">
            {followers.map((profile) => (
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
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No followers yet.
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default FollowersPage;
