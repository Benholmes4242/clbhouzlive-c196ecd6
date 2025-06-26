
import React from 'react';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const FriendsPage = () => {
  const { user } = useSupabaseSession();

  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching friends for user:', user.id);
      
      // Get all accepted friendships where current user is involved
      const { data: friendships, error: friendshipError } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`and(user_id.eq.${user.id},status.eq.accepted),and(friend_id.eq.${user.id},status.eq.accepted)`);

      if (friendshipError) {
        console.error('Error fetching friendships:', friendshipError);
        throw friendshipError;
      }
      
      if (!friendships || friendships.length === 0) {
        console.log('No friendships found');
        return [];
      }

      // Extract friend IDs (excluding current user)
      const friendIds = friendships.map(friendship => 
        friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
      );

      console.log('Friend IDs found:', friendIds);

      if (friendIds.length === 0) return [];

      // Get profile data for all friends
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio')
        .in('id', friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        throw profileError;
      }

      console.log('Friend profiles:', profiles);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading friends...</div>
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
          <UserCheck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>

        {friends && friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((profile) => (
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
            No friends yet.
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default FriendsPage;
